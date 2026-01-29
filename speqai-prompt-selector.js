// Prompt selector component for SpeqAI
// Pre-selected prompts as buttons with configurable backend

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';

const PRESET_PROMPTS = [
  {
    id: 'general',
    title: 'General Conversation',
    description: 'General conversation and questions',
    icon: '💬',
    color: '#4A90E2',
  },
  {
    id: 'coding',
    title: 'Coding Assistant',
    description: 'Help with code and programming',
    icon: '💻',
    color: '#50E3C2',
  },
  {
    id: 'writing',
    title: 'Writing Assistant',
    description: 'Help with writing and editing',
    icon: '✍️',
    color: '#F5A623',
  },
  {
    id: 'analysis',
    title: 'Data Analysis',
    description: 'Analyze and interpret data',
    icon: '📊',
    color: '#9013FE',
  },
  {
    id: 'creative',
    title: 'Creative Writing',
    description: 'Creative ideas and stories',
    icon: '🎨',
    color: '#BD10E0',
  },
  {
    id: 'educational',
    title: 'Educational',
    description: 'Learn and explain concepts',
    icon: '📚',
    color: '#417505',
  },
];

export const PromptSelector = ({ onSelectPrompt, selectedPromptId, onClose }) => {
  const [visible, setVisible] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState(selectedPromptId);

  const modalScale = useRef(new Animated.Value(0)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(modalScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(modalScale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handlePromptSelect = (prompt) => {
    setSelectedPrompt(prompt);
    onSelectPrompt?.(prompt);
    setVisible(false);
  };

  const handlePromptUse = (prompt) => {
    setSelectedPrompt(prompt);
    onSelectPrompt?.(prompt);
    // In a real app, this would send the prompt to the backend
    console.log('Using prompt:', prompt.id);
  };

  return (
    <>
      {/* Trigger button */}
      <TouchableOpacity
        style={styles.triggerButton}
        onPress={() => setVisible(true)}
      >
        <Text style={styles.triggerButtonText}>
          {selectedPrompt ? selectedPrompt.title : 'Select Prompt'}
        </Text>
      </TouchableOpacity>

      {/* Prompt selector modal */}
      <Modal
        visible={visible}
        animationType="none"
        transparent={true}
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ scale: modalScale }],
                opacity: modalOpacity,
              },
            ]}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Prompt</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Prompt list */}
            <ScrollView style={styles.promptList} contentContainerStyle={styles.promptListContent}>
              {PRESET_PROMPTS.map((prompt) => (
                <TouchableOpacity
                  key={prompt.id}
                  style={[
                    styles.promptItem,
                    selectedPrompt?.id === prompt.id && styles.promptItemSelected,
                  ]}
                  onPress={() => handlePromptSelect(prompt)}
                >
                  <View style={styles.promptContent}>
                    <View style={styles.promptHeader}>
                      <Text style={styles.promptIcon}>{prompt.icon}</Text>
                      <Text style={styles.promptTitle}>{prompt.title}</Text>
                    </View>
                    <Text style={styles.promptDescription}>{prompt.description}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.useButton}
                    onPress={() => handlePromptUse(prompt)}
                  >
                    <Text style={styles.useButtonText}>Use</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => {
                  if (selectedPrompt) {
                    onSelectPrompt?.(selectedPrompt);
                    setVisible(false);
                  }
                }}
              >
                <Text style={styles.selectButtonText}>Select Prompt</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  triggerButton: {
    padding: 12,
    backgroundColor: '#50E3C2',
    borderRadius: 8,
    alignItems: 'center',
  },
  triggerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    padding: 4,
  },
  promptList: {
    flex: 1,
  },
  promptListContent: {
    paddingVertical: 10,
  },
  promptItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: 'white',
  },
  promptItemSelected: {
    backgroundColor: '#F0FDFA',
  },
  promptContent: {
    flex: 1,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  promptIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  promptDescription: {
    fontSize: 12,
    color: '#666',
  },
  useButton: {
    padding: 8,
    backgroundColor: '#50E3C2',
    borderRadius: 20,
  },
  useButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  selectButton: {
    padding: 16,
    backgroundColor: '#50E3C2',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
