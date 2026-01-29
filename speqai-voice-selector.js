// Voice selector component for SpeqAI
// Rolodex/scrollbar picker for AI voice selection

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Modal,
  PanResponder,
  Animated,
  Alert,
} from 'react-native';

const VOICES = [
  { id: 'default', name: 'Default Voice', gender: 'Neutral' },
  { id: 'male1', name: 'Alex', gender: 'Male' },
  { id: 'male2', name: 'James', gender: 'Male' },
  { id: 'male3', name: 'Robert', gender: 'Male' },
  { id: 'female1', name: 'Sarah', gender: 'Female' },
  { id: 'female2', name: 'Emily', gender: 'Female' },
  { id: 'female3', name: 'Jessica', gender: 'Female' },
  { id: 'deep', name: 'Deep Voice', gender: 'Male' },
  { id: 'soft', name: 'Soft Voice', gender: 'Female' },
  { id: 'robot', name: 'Robot', gender: 'Neutral' },
  { id: 'news', name: 'News Anchor', gender: 'Male' },
  { id: 'friendly', name: 'Friendly', gender: 'Female' },
];

const VOICE_CATEGORIES = {
  'All': VOICES,
  'Male': VOICES.filter(v => v.gender === 'Male'),
  'Female': VOICES.filter(v => v.gender === 'Female'),
  'Neutral': VOICES.filter(v => v.gender === 'Neutral'),
};

export const VoiceSelector = ({ onSelectVoice, selectedVoiceId, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [visible, setVisible] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(selectedVoiceId);

  // Animation for modal
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

  const voiceList = VOICE_CATEGORIES[selectedCategory];

  const handleVoiceSelect = (voice) => {
    setSelectedVoice(voice);
    onSelectVoice?.(voice);
    setVisible(false);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  const handlePreview = () => {
    // In a real implementation, this would play a preview audio
    setIsPlayingPreview(!isPlayingPreview);
    setTimeout(() => setIsPlayingPreview(false), 2000);
  };

  return (
    <>
      {/* Trigger button */}
      <TouchableOpacity
        style={styles.triggerButton}
        onPress={() => setVisible(true)}
      >
        <Text style={styles.triggerButtonText}>
          {selectedVoice ? selectedVoice.name : 'Select Voice'}
        </Text>
      </TouchableOpacity>

      {/* Voice selector modal */}
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
              <Text style={styles.modalTitle}>Select Voice</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Categories */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              {Object.keys(VOICE_CATEGORIES).map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category && styles.categoryButtonSelected,
                  ]}
                  onPress={() => handleCategorySelect(category)}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      selectedCategory === category && styles.categoryButtonTextSelected,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Voice list */}
            <ScrollView style={styles.voiceList} contentContainerStyle={styles.voiceListContent}>
              {voiceList.map((voice) => (
                <TouchableOpacity
                  key={voice.id}
                  style={[
                    styles.voiceItem,
                    selectedVoice?.id === voice.id && styles.voiceItemSelected,
                  ]}
                  onPress={() => handleVoiceSelect(voice)}
                >
                  <View style={styles.voiceInfo}>
                    <Text style={styles.voiceName}>{voice.name}</Text>
                    <Text style={styles.voiceGender}>{voice.gender}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.previewButton}
                    onPress={() => handlePreview(voice)}
                  >
                    <Text style={styles.previewButtonText}>
                      {isPlayingPreview && selectedVoice?.id === voice.id ? '🔊' : '🔊'}
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => {
                  if (selectedVoice) {
                    onSelectVoice?.(selectedVoice);
                    setVisible(false);
                  }
                }}
              >
                <Text style={styles.selectButtonText}>Select Voice</Text>
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
    backgroundColor: '#4A90E2',
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
  categoryScroll: {
    paddingVertical: 10,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 10,
  },
  categoryButtonSelected: {
    backgroundColor: '#4A90E2',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
  },
  categoryButtonTextSelected: {
    color: 'white',
  },
  voiceList: {
    flex: 1,
  },
  voiceListContent: {
    paddingVertical: 10,
  },
  voiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  voiceItemSelected: {
    backgroundColor: '#E6F0FF',
  },
  voiceInfo: {
    flex: 1,
  },
  voiceName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  voiceGender: {
    fontSize: 12,
    color: '#666',
  },
  previewButton: {
    padding: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
  },
  previewButtonText: {
    fontSize: 18,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  selectButton: {
    padding: 16,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
