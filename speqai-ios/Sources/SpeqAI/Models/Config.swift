import Foundation

// App configuration
struct Config {
    // Backend WebSocket URL
    static let websocketURL = "wss://api.personaplex.com/v1/ws"
    
    // Default audio settings
    static let sampleRate = 16000
    static let channels = 1
    static let bitRate = 128000
    
    // Opus codec settings
    static let opusApplication = 1 // VoIP
    static let opusComplexity = 10
    static let opusBitrate = 64000 // 64kbps
    
    // Recording settings
    static let maxRecordingDuration: TimeInterval = 60.0 // Maximum recording time
    
    // Playback settings
    static let maxPlaybackDuration: TimeInterval = 30.0 // Maximum playback time
    
    // Connection settings
    static let connectionTimeout: TimeInterval = 10.0
    static let heartbeatInterval: TimeInterval = 30.0
    
    // Retry settings
    static let maxRetries = 3
    static let retryDelay: TimeInterval = 1.0
}
