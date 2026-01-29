import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  Settings: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

interface Config {
  voice: string;
  prompt: string;
  audioTemperature: number;
  textTemperature: number;
  textTopK: number;
  audioTopK: number;
  repetitionPenalty: number;
}

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const [config, setConfig] = useState<Config>({
    voice: 'female',
    prompt: 'You are a helpful AI assistant.',
    audioTemperature: 0.7,
    textTemperature: 0.8,
    textTopK: 40,
    audioTopK: 40,
    repetitionPenalty: 1.1,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    // TODO: Implement saveConfig() call
    // saveConfig(config);
    Alert.alert('Success', 'Settings saved successfully!');
    setIsSaving(false);
    navigation.goBack();
  };

  const resetToDefaults = () => {
    setConfig({
      voice: 'female',
      prompt: 'You are a helpful AI assistant.',
      audioTemperature: 0.7,
      textTemperature: 0.8,
      textTopK: 40,
      audioTopK: 40,
      repetitionPenalty: 1.1,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Configure your AI preferences</Text>
        </View>

        {/* Basic Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Settings</Text>

          {/* Voice Selection */}
          <View style={styles.settingItem}>
            <Text style={styles.label}>Voice</Text>
            <View style={styles.valueContainer}>
              <Text style={styles.value}>{config.voice}</Text>
            </View>
          </View>

          {/* Prompt */}
          <View style={styles.settingItem}>
            <Text style={styles.label}>System Prompt</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                Alert.alert(
                  'Edit Prompt',
                  'Configure your system prompt here',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Save',
                      onPress: () => {
                        // TODO: Open prompt editor modal
                      },
                    },
                  ]
                );
              }}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Advanced Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Advanced Settings</Text>
            <TouchableOpacity onPress={resetToDefaults}>
              <Text style={styles.resetButton}>Reset to Defaults</Text>
            </TouchableOpacity>
          </View>

          {/* Audio Temperature */}
          <View style={styles.settingItem}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Audio Temperature</Text>
              <Text style={styles.value}>{config.audioTemperature.toFixed(2)}</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              step={0.01}
              value={config.audioTemperature}
              onValueChange={(value) =>
                setConfig({ ...config, audioTemperature: value })
              }
              minimumTrackTintColor="#4CAF50"
              maximumTrackTintColor="#333333"
              thumbTintColor="#4CAF50"
            />
            <Text style={styles.sliderHint}>Lower values are more deterministic</Text>
          </View>

          {/* Text Temperature */}
          <View style={styles.settingItem}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Text Temperature</Text>
              <Text style={styles.value}>{config.textTemperature.toFixed(2)}</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              step={0.01}
              value={config.textTemperature}
              onValueChange={(value) =>
                setConfig({ ...config, textTemperature: value })
              }
              minimumTrackTintColor="#4CAF50"
              maximumTrackTintColor="#333333"
              thumbTintColor="#4CAF50"
            />
            <Text style={styles.sliderHint}>Lower values are more deterministic</Text>
          </View>

          {/* Text TopK */}
          <View style={styles.settingItem}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Text TopK</Text>
              <Text style={styles.value}>{config.textTopK}</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={100}
              step={1}
              value={config.textTopK}
              onValueChange={(value) =>
                setConfig({ ...config, textTopK: value })
              }
              minimumTrackTintColor="#4CAF50"
              maximumTrackTintColor="#333333"
              thumbTintColor="#4CAF50"
            />
            <Text style={styles.sliderHint}>Number of top tokens to sample from</Text>
          </View>

          {/* Audio TopK */}
          <View style={styles.settingItem}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Audio TopK</Text>
              <Text style={styles.value}>{config.audioTopK}</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={100}
              step={1}
              value={config.audioTopK}
              onValueChange={(value) =>
                setConfig({ ...config, audioTopK: value })
              }
              minimumTrackTintColor="#4CAF50"
              maximumTrackTintColor="#333333"
              thumbTintColor="#4CAF50"
            />
            <Text style={styles.sliderHint}>Number of top tokens to sample from</Text>
          </View>

          {/* Repetition Penalty */}
          <View style={styles.settingItem}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Repetition Penalty</Text>
              <Text style={styles.value}>{config.repetitionPenalty.toFixed(2)}</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={1.0}
              maximumValue={2.0}
              step={0.01}
              value={config.repetitionPenalty}
              onValueChange={(value) =>
                setConfig({ ...config, repetitionPenalty: value })
              }
              minimumTrackTintColor="#4CAF50"
              maximumTrackTintColor="#333333"
              thumbTintColor="#4CAF50"
            />
            <Text style={styles.sliderHint}>
              Higher values reduce repetition (1.0 - 2.0)
            </Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={[styles.saveButtonText, isSaving && styles.saveButtonTextDisabled]}>
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
  },
  section: {
    marginBottom: 30,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  resetButton: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
  },
  settingItem: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#aaaaaa',
    marginBottom: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  valueContainer: {
    backgroundColor: '#2d2d2d',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButton: {
    backgroundColor: '#2d2d2d',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 8,
  },
  sliderHint: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#4CAF50',
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    opacity: 0.7,
  },
});

export default SettingsScreen;
