// Comprehensive integration of audio, connection, voice, and prompt selectors
// This is the main component that brings everything together

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { VoiceSelector } from './speqai-voice-selector';
import { PromptSelector } from './speqai-prompt-selector';
import { useAudioPlayer, handleWebSocketAudioMessage } from './speqai-audio-fix';
import { useWebSocket, useServerSelection, useRateLimit } from './speqai-connection-fix';

export default function SpeqAIApp() {
  // Server selection
  const { selectedServer, selectServer, servers } = useServerSelection();

  // Rate limiting
  const rateLimit = useRateLimit(10, 60000);

  // Audio player
  const {
    audioState,
    playAudio,
    stopAudio,
    pauseAudio,
    resumeAudio,
  } = useAudioPlayer();

  // WebSocket connection
  const {
    status,
    isReconnecting,
    reconnectCount,
    send,
    disconnect,
  } = useWebSocket({
    server: selectedServer,
    onMessage: handleWebSocketMessage,
    onConnected: handleConnected,
    onError: handleError,
    onDisconnected: handleDisconnected,
  });

  // State
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [errorMessage, setErrorMessage] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback(async (data) => {
    try {
      console.log('WebSocket message:', data);

      // Handle audio messages
      if (data.type === 'audio') {
        await handleWebSocketAudioMessage(data, playAudio);
      }

      // Handle connection status
      if (data.type === 'connected') {
        setIsConnected(true);
        setConnectionStatus('connected');
      }

      // Handle error messages
      if (data.type === 'error') {
        setErrorMessage(data.message);
        Alert.alert('Error', data.message);
      }

    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      setErrorMessage(error.message);
    }
  }, [playAudio]);

  // Handle connection established
  const handleConnected = useCallback(() => {
    setIsConnected(true);
    setConnectionStatus('connected');
    setIsConnecting(false);
    setErrorMessage(null);

    // Send initial connection message with selected voice and prompt
    send({
      type: 'connect',
      voice: selectedVoice?.id,
      prompt: selectedPrompt?.id,
    });
  }, [selectedVoice, selectedPrompt, send]);

  // Handle connection error
  const handleError = useCallback((error) => {
    console.error('WebSocket error:', error);
    setIsConnecting(false);
    setConnectionStatus('error');
    setErrorMessage('Connection error. Retrying...');

    // Reconnect automatically
    setTimeout(() => {
      setIsConnecting(true);
      setConnectionStatus('connecting');
    }, 2000);
  }, []);

  // Handle disconnection
  const handleDisconnected = useCallback((code, reason) => {
    console.log('Disconnected:', code, reason);
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setIsConnecting(false);

    if (code !== 1000) {
      setErrorMessage(`Disconnected: ${reason || code}`);
      Alert.alert('Disconnected', reason || 'Connection lost');
    }
  }, []);

  // Handle voice selection
  const handleVoiceSelect = useCallback((voice) => {
    console.log('Selected voice:', voice);
    setSelectedVoice(voice);

    // Update server if needed
    if (voice.id === 'male3') {
      selectServer({ host: 'ws://localhost', port: 9000 });
    }
  }, [selectServer]);

  // Handle prompt selection
  const handlePromptSelect = useCallback((prompt) => {
    console.log('Selected prompt:', prompt);
    setSelectedPrompt(prompt);

    // Send prompt selection to server
    send({
      type: 'prompt_select',
      prompt: prompt.id,
    });
  }, [send]);

  // Handle connect button
  const handleConnect = useCallback(() => {
    if (isConnecting) return;

    setIsConnecting(true);
    setConnectionStatus('connecting');
    setErrorMessage(null);
  }, [isConnecting]);

  // Handle disconnect button
  const handleDisconnect = useCallback(() => {
    disconnect();
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, [disconnect]);

  // Handle server selection
  const handleServerSelect = (serverIndex) => {
    const server = servers[serverIndex];
    selectServer(server);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>SpeqAI</Text>
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusIndicator,
              connectionStatus === 'connected' && styles.statusIndicatorConnected,
            ]} />
            <Text style={styles.statusText}>
              {isReconnecting ? 'Reconnecting...' : status}
            </Text>
          </View>
        </View>

        {/* Connection Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection</Text>

          <View style={styles.connectionButtons}>
            <TouchableOpacity
              style={[
                styles.connectButton,
                isConnecting && styles.connectButtonDisabled,
              ]}
              onPress={handleConnect}
              disabled={isConnecting || isConnected}
            >
              <Text style={styles.connectButtonText}>
                {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Connect'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={handleDisconnect}
              disabled={!isConnected}
            >
              <Text style={styles.disconnectButtonText}>Disconnect</Text>
            </TouchableOpacity>
          </View>

          {/* Server selection */}
          <View style={styles.serverSelection}>
            <Text style={styles.serverLabel}>Server:</Text>
            <ScrollView horizontal style={styles.serverList} showsHorizontalScrollIndicator={false}>
              {servers.map((server, index) => (
                <TouchableOpacity
                  key={`${server.host}-${server.port}`}
                  style={[
                    styles.serverButton,
                    selectedServer.host === server.host && selectedServer.port === server.port && styles.serverButtonSelected,
                  ]}
                  onPress={() => handleServerSelect(index)}
                >
                  <Text style={styles.serverButtonText}>
                    {server.port === 8998 ? 'Main' : server.port === 8999 ? 'Backup 1' : 'Backup 2'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Reconnection info */}
          {isReconnecting && (
            <View style={styles.reconnectInfo}>
              <Text style={styles.reconnectText}>
                Reconnecting (attempt {reconnectCount}/{5})
              </Text>
            </View>
          )}
        </View>

        {/* Voice Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voice</Text>

          <VoiceSelector
            selectedVoiceId={selectedVoice?.id}
            onSelectVoice={handleVoiceSelect}
          />
        </View>

        {/* Prompt Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prompt</Text>

          <PromptSelector
            selectedPromptId={selectedPrompt?.id}
            onSelectPrompt={handlePromptSelect}
          />
        </View>

        {/* Audio Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audio Status</Text>

          <View style={styles.audioStatus}>
            <Text style={styles.audioStatusText}>
              Status: {audioState.isPlaying ? 'Playing' : audioState.isLoaded ? 'Loaded' : 'Not Loaded'}
            </Text>
            <Text style={styles.audioStatusText}>
              Progress: {audioState.progress.toFixed(2)}s
            </Text>
          </View>
        </View>

        {/* Error Message */}
        {errorMessage && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorMessage}>{errorMessage}</Text>
          </View>
        )}

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.infoTitle}>Backend Server</Text>
          <Text style={styles.infoText}>
            PersonaPlex on RunPod
          </Text>
          <Text style={styles.infoText}>
            WebSocket: ws://localhost:8998
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF0000',
    marginRight: 8,
  },
  statusIndicatorConnected: {
    backgroundColor: '#00FF00',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  connectionButtons: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  connectButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 12,
  },
  connectButtonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  connectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disconnectButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FF0000',
    borderRadius: 8,
    alignItems: 'center',
  },
  disconnectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  serverSelection: {
    marginBottom: 12,
  },
  serverLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  serverList: {
    flexDirection: 'row',
  },
  serverButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    marginRight: 8,
  },
  serverButtonSelected: {
    backgroundColor: '#4A90E2',
  },
  serverButtonText: {
    fontSize: 14,
    color: '#333',
  },
  reconnectInfo: {
    padding: 12,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    marginBottom: 12,
  },
  reconnectText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
  audioStatus: {
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  audioStatusText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  errorContainer: {
    padding: 12,
    backgroundColor: '#FDE8E8',
    borderRadius: 8,
    marginBottom: 20,
  },
  errorMessage: {
    fontSize: 14,
    color: '#D32F2F',
    textAlign: 'center',
  },
  info: {
    padding: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1565C0',
    marginBottom: 4,
  },
});
