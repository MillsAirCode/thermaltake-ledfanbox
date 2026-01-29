// Audio playback fix for SpeqAI
// This module handles audio playback with proper initialization and error handling

import { Audio } from 'expo-av';
import { useState, useEffect, useRef } from 'react';

// Audio state management
export const useAudioPlayer = () => {
  const [audioState, setAudioState] = useState({
    isPlaying: false,
    isLoaded: false,
    isError: false,
    progress: 0,
  });

  const soundRef = useRef(null);
  const [sound, setSound] = useState(null);

  // Initialize audio context when component mounts
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        // Request audio permission
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          console.error('Audio permission denied');
          setAudioState(prev => ({ ...prev, isError: true }));
          return;
        }

        // Set audio mode
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
          shouldDuckAndroid: true,
        });

        console.log('Audio initialized successfully');
      } catch (error) {
        console.error('Audio initialization error:', error);
        setAudioState(prev => ({ ...prev, isError: true }));
      }
    };

    initializeAudio();

    return () => {
      // Cleanup on unmount
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  // Load and play audio from URI
  const playAudio = async (uri) => {
    try {
      setAudioState({ isPlaying: true, isLoaded: false, isError: false, progress: 0 });

      // Unload previous sound if exists
      if (sound) {
        await sound.unloadAsync();
      }

      // Load new sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      setAudioState(prev => ({ ...prev, isLoaded: true }));

    } catch (error) {
      console.error('Error playing audio:', error);
      setAudioState(prev => ({ ...prev, isPlaying: false, isError: true }));
    }
  };

  // Stop audio playback
  const stopAudio = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        setAudioState(prev => ({ ...prev, isPlaying: false, progress: 0 }));
      }
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  };

  // Pause audio playback
  const pauseAudio = async () => {
    try {
      if (sound) {
        await sound.pauseAsync();
        setAudioState(prev => ({ ...prev, isPlaying: false }));
      }
    } catch (error) {
      console.error('Error pausing audio:', error);
    }
  };

  // Resume audio playback
  const resumeAudio = async () => {
    try {
      if (sound) {
        await sound.playAsync();
        setAudioState(prev => ({ ...prev, isPlaying: true }));
      }
    } catch (error) {
      console.error('Error resuming audio:', error);
    }
  };

  // Update playback status
  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setAudioState({
        isPlaying: status.isPlaying,
        isLoaded: true,
        isError: false,
        progress: status.isPlaying ? status.positionMillis / 1000 : 0,
      });

      // Auto-stop when audio ends
      if (status.didJustFinish) {
        setAudioState(prev => ({ ...prev, isPlaying: false, progress: 0 }));
      }
    }

    if (status.hasPlaybackError) {
      console.error('Playback error:', status.error);
      setAudioState(prev => ({ ...prev, isError: true, isPlaying: false }));
    }
  };

  return {
    audioState,
    playAudio,
    stopAudio,
    pauseAudio,
    resumeAudio,
    sound,
  };
};

// WebSocket audio message handler
export const handleWebSocketAudioMessage = async (audioData, playAudioCallback) => {
  try {
    if (!audioData || !audioData.url) {
      console.error('Invalid audio data received');
      return;
    }

    console.log('Playing audio from WebSocket:', audioData.url);
    await playAudioCallback(audioData.url);

  } catch (error) {
    console.error('Error handling audio message:', error);
  }
};
