import Foundation

// App state for UI updates
@MainActor
class AppState: ObservableObject {
    @Published var isConnected = false
    @Published var connectionStatus: ConnectionStatus = .disconnected
    @Published var transcripts: [Transcript] = []
    @Published var error: String?
    @Published var isRecording = false
    @Published var audioLevel: Float = 0.0
}

enum ConnectionStatus {
    case disconnected
    case connecting
    case connected
    case error(String)
}

struct Transcript {
    let id: UUID
    let role: String
    let content: String
    let timestamp: Date
    
    init(role: String, content: String) {
        self.id = UUID()
        self.role = role
        self.content = content
        self.timestamp = Date()
    }
}
