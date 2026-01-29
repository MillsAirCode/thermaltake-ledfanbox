import Foundation
import SwiftUI
import Combine
import AVFoundation

// Chat view model with WebSocket and audio services
@MainActor
class ChatViewModel: ObservableObject {
    // Services
    private let webSocketService = WebSocketService()
    private let audioService = AudioService()
    private let opusDecoder = OpusDecoder()
    private let opusEncoder = OpusEncoder()

    // State
    @Published var transcripts: [Transcript] = []
    @Published var isRecording = false
    @Published var isPlaying = false
    @Published var voicePrompt: String = ""
    @Published var textPrompt: String = ""
    @Published var audioTemperature: Double = 1.0
    @Published var textTemperature: Double = 1.0
    @Published var selectedVoice: String = "default"
    @Published var selectedPersonality: String = "helpful"

    // Connection state
    @Published var connectionStatus: ConnectionStatus = .disconnected

    // Setup callbacks
    private var cancellables = Set<AnyCancellable>()

    init() {
        loadSettings()
        setupObservers()
    }

    // Load settings from persistence
    private func loadSettings() {
        voicePrompt = PersistenceManager().getVoicePrompt()
        textPrompt = PersistenceManager().getTextPrompt()
        audioTemperature = PersistenceManager().getTemperature()
    }

    // Setup observers
    private func setupObservers() {
        // WebSocket callbacks
        webSocketService.onAudioData = { [weak self] audioData in
            Task { await self?.handleAudioData(audioData) }
        }

        webSocketService.onTextReceived = { [weak self] text in
            Task { await self?.handleTextReceived(text) }
        }

        webSocketService.onError = { [weak self] error in
            Task { await self?.handleError(error) }
        }
    }

    // Initialize services
    func initializeServices() async throws {
        // Request audio permissions
        try await audioService.requestPermissions()

        // Initialize Opus encoder and decoder
        try await MainActor.run {
            try opusEncoder.initialize()
            try opusDecoder.initialize(sampleRate: Config.sampleRate, channels: Config.channels)
        }

        // Update WebSocket parameters
        updateWebSocketParameters()
    }

    // Connect to WebSocket
    func connect() async {
        connectionStatus = .connecting

        do {
            await webSocketService.connect()
            await webSocketService.sendHandshake()
        } catch {
            connectionStatus = .error(error.localizedDescription)
        }
    }

    // Disconnect
    func disconnect() {
        webSocketService.disconnect()
        audioService.disconnect()
        opusDecoder.disconnect()
        opusEncoder.disconnect()
        connectionStatus = .disconnected
    }

    // Start recording
    func startRecording() async {
        do {
            await audioService.startRecording()
            isRecording = true
        } catch {
            connectionStatus = .error("Failed to start recording: \(error.localizedDescription)")
        }
    }

    // Stop recording and send audio
    func stopRecording() async -> URL? {
        let url = await audioService.stopRecording()

        guard let url = url else { return nil }

        do {
            // Convert to PCM
            let pcmData = try await audioService.getAudioData(from: url)

            // Encode to Opus
            let opusData = opusEncoder.encodeAudioForWebSocket(pcmData)

            guard let opusData = opusData else {
                connectionStatus = .error("Failed to encode audio to Opus")
                return nil
            }

            // Send through WebSocket
            await webSocketService.sendAudio(opusData)

            return url
        } catch {
            connectionStatus = .error("Failed to process audio: \(error.localizedDescription)")
            return nil
        }
    }

    // Send text message
    func sendText(_ text: String) async {
        await webSocketService.sendText(text)

        // Add user transcript
        transcripts.append(Transcript(role: "user", content: text))
    }

    // Handle received audio
    private func handleAudioData(_ audioData: Data) async {
        do {
            await opusDecoder.decodeAndPlay(audioData)
        } catch {
            connectionStatus = .error("Playback error: \(error.localizedDescription)")
        }
    }

    // Handle received text
    private func handleTextReceived(_ text: String) {
        transcripts.append(Transcript(role: "assistant", content: text))
    }

    // Handle errors
    private func handleError(_ error: Error) {
        connectionStatus = .error(error.localizedDescription)
    }

    // Update WebSocket parameters
    func updateWebSocketParameters() {
        webSocketService.voicePrompt = voicePrompt
        webSocketService.textPrompt = textPrompt
        webSocketService.audioTemperature = audioTemperature
        webSocketService.textTemperature = textTemperature
    }

    // Save settings
    func saveSettings() {
        PersistenceManager().saveVoicePrompt(voicePrompt)
        PersistenceManager().saveTextPrompt(textPrompt)
        PersistenceManager().saveTemperature(audioTemperature)
    }

    // Clear transcripts
    func clearTranscripts() {
        transcripts.removeAll()
    }

    // Cleanup
    func cleanup() {
        disconnect()
        cancellables.removeAll()
    }
}
