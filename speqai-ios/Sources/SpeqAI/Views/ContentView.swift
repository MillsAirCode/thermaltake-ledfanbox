import SwiftUI

// Main content view
struct ContentView: View {
    @StateObject private var viewModel = ChatViewModel()
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Header
                    headerSection
                    
                    // Connection status
                    connectionSection
                    
                    // Voice selector
                    voiceSelectorSection
                    
                    // Personality selector
                    personalitySelectorSection
                    
                    // Prompt inputs
                    promptSections
                    
                    // Transcript
                    transcriptSection
                    
                    // Action buttons
                    actionButtons
                }
                .padding()
            }
            .navigationTitle("SpeqAI")
            .navigationBarTitleDisplayMode(.large)
            .background(Color(UIColor.systemBackground))
        }
        .task {
            await viewModel.initializeServices()
            await viewModel.connect()
        }
        .onChange(of: viewModel.selectedVoice) { _, newValue in
            viewModel.voicePrompt = voicePrompts[newValue] ?? ""
        }
    }
    
    // Header section
    private var headerSection: some View {
        VStack(spacing: 10) {
            // Animated orb
            VoiceOrbView(
                status: viewModel.connectionStatus,
                isRecording: viewModel.isRecording,
                pulseIntensity: viewModel.connectionStatus == .connected ? 1.0 : 0.5
            )
            .frame(width: 100, height: 100)
            
            // Connection status
            ConnectionStatusIndicator(status: viewModel.connectionStatus)
            
            // Recording indicator
            if viewModel.isRecording {
                HStack {
                    Image(systemName: "mic")
                        .foregroundColor(.red)
                    Text("Recording...")
                        .foregroundColor(.red)
                        .font(.caption)
                }
            }
        }
        .padding(.vertical)
    }
    
    // Connection section
    private var connectionSection: some View {
        VStack(spacing: 10) {
            Text("Connection")
                .font(.headline)
            
            HStack(spacing: 10) {
                Button(action: {
                    Task {
                        if viewModel.connectionStatus == .connected {
                            viewModel.disconnect()
                        } else {
                            await viewModel.connect()
                        }
                    }
                }) {
                    Text(viewModel.connectionStatus == .connected ? "Disconnect" : "Connect")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .disabled(viewModel.connectionStatus == .connecting)
            }
        }
    }
    
    // Voice selector section
    private var voiceSelectorSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Voice")
                .font(.headline)
            
            VoiceSelector(
                selectedVoice: $viewModel.selectedVoice,
                voices: voiceOptions
            )
        }
    }
    
    // Personality selector section
    private var personalitySelectorSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Personality")
                .font(.headline)
            
            PersonalitySelector(
                selectedPersonality: $viewModel.selectedPersonality,
                personalities: personalityOptions
            )
        }
    }
    
    // Prompt sections
    private var promptSections: some View {
        VStack(spacing: 16) {
            voicePromptSection
            textPromptSection
            temperatureSection
        }
    }
    
    // Voice prompt section
    private var voicePromptSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Voice Prompt")
                .font(.headline)
            
            TextEditor(text: $viewModel.voicePrompt)
                .frame(height: 80)
                .background(Color.gray.opacity(0.1))
                .cornerRadius(8)
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color.gray.opacity(0.3))
                )
        }
    }
    
    // Text prompt section
    private var textPromptSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Text Prompt")
                .font(.headline)
            
            TextEditor(text: $viewModel.textPrompt)
                .frame(height: 80)
                .background(Color.gray.opacity(0.1))
                .cornerRadius(8)
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color.gray.opacity(0.3))
                )
        }
    }
    
    // Temperature section
    private var temperatureSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Temperature: \(viewModel.audioTemperature, specifier: "%.1f")")
                .font(.headline)
            
            Slider(value: $viewModel.audioTemperature, in: 0.0...2.0, step: 0.1)
                .onChange(of: viewModel.audioTemperature) { _, newValue in
                    viewModel.updateWebSocketParameters()
                }
        }
    }
    
    // Transcript section
    private var transcriptSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Conversation")
                    .font(.headline)
                
                Spacer()
                
                if !viewModel.transcripts.isEmpty {
                    Button("Clear") {
                        viewModel.clearTranscripts()
                    }
                    .font(.caption)
                }
            }
            
            if viewModel.transcripts.isEmpty {
                Text("No messages yet")
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
            } else {
                VStack(spacing: 12) {
                    ForEach(viewModel.transcripts) { transcript in
                        transcriptRow(transcript)
                    }
                }
            }
        }
    }
    
    // Transcript row
    private func transcriptRow(_ transcript: Transcript) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Circle()
                .fill(transcript.role == "user" ? Color.blue : Color.green)
                .frame(width: 24, height: 24)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(transcript.role.capitalized)
                    .font(.caption)
                    .fontWeight(.semibold)
                
                Text(transcript.content)
                    .font(.body)
                
                Text(transcript.timestamp, style: .time)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
        }
        .padding()
        .background(Color.gray.opacity(0.05))
        .cornerRadius(12)
    }
    
    // Action buttons
    private var actionButtons: some View {
        VStack(spacing: 16) {
            // Record button
            Button(action: {
                Task {
                    if viewModel.isRecording {
                        await viewModel.stopRecording()
                    } else {
                        await viewModel.startRecording()
                    }
                }
            }) {
                HStack {
                    Image(systemName: viewModel.isRecording ? "stop.circle.fill" : "record.circle.fill")
                        .foregroundColor(viewModel.isRecording ? .white : .red)
                    Text(viewModel.isRecording ? "Stop Recording" : "Start Recording")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(viewModel.isRecording ? Color.red : Color.red.opacity(0.8))
                .foregroundColor(.white)
                .cornerRadius(12)
                .disabled(viewModel.connectionStatus != .connected)
            }
            
            // Send text button
            Button(action: {
                // This would be implemented with a text input field
                Text("Send Text")
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                    .disabled(viewModel.connectionStatus != .connected)
            }) {
                Text("Send Text Message")
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                    .disabled(viewModel.connectionStatus != .connected)
            }
        }
    }
    
    // Voice options
    private var voiceOptions: [String] {
        ["default", "professional", "friendly", "casual", "authoritative"]
    }
    
    // Personality options
    private var personalityOptions: [String] {
        ["helpful", "creative", "analytical", "friendly", "professional"]
    }
    
    // Voice prompt templates
    private var voicePrompts: [String: String] {
        [
            "default": "You are a helpful AI assistant.",
            "professional": "You are a professional business consultant.",
            "friendly": "You are a friendly chat companion.",
            "casual": "You are a casual friend.",
            "authoritative": "You are an expert consultant."
        ]
    }
}

#Preview {
    ContentView()
}
