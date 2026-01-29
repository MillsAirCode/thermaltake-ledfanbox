import Foundation
import Combine
import Logging
import AsyncHTTPClient

// WebSocket message types
enum WebSocketMessageType: UInt8 {
    case handshake = 0x00
    case audio = 0x01
    case text = 0x02
}

// WebSocket service for PersonaPlex backend communication
class WebSocketService: NSObject, ObservableObject {
    private let logger = Logger(label: "websocket-service")
    
    // URL parameters
    var voicePrompt: String = ""
    var textPrompt: String = ""
    var audioTemperature: Double = 1.0
    var textTemperature: Double = 1.0
    var maxTokens: Int = 1024
    
    // WebSocket
    private var websocket: URLSessionWebSocketTask?
    private var webSocketURL: URL
    private var isConnected = false
    private var reconnectTimer: Timer?
    private var heartbeatTimer: Timer?
    
    // State
    @Published var connectionStatus: ConnectionStatus = .disconnected
    @Published var lastMessage: String?
    
    // Callbacks
    var onAudioData: ((Data) -> Void)?
    var onTextReceived: ((String) -> Void)?
    var onError: ((Error) -> Void)?
    
    override init() {
        var components = URLComponents(string: Config.websocketURL)!
        components.queryItems = [
            URLQueryItem(name: "voice_prompt", value: ""),
            URLQueryItem(name: "text_prompt", value: ""),
            URLQueryItem(name: "audio_temperature", value: "\(audioTemperature)"),
            URLQueryItem(name: "text_temperature", value: "\(textTemperature)"),
            URLQueryItem(name: "max_tokens", value: "\(maxTokens)")
        ]
        self.webSocketURL = components.url!
        super.init()
    }
    
    // Connect to WebSocket
    func connect() async {
        logger.info("Connecting to WebSocket: \(webSocketURL)")
        
        await withCheckedContinuation { continuation in
            var request = URLRequest(url: webSocketURL)
            request.timeoutInterval = Config.connectionTimeout
            
            let task = URLSession.shared.webSocketTask(with: request)
            self.websocket = task
            
            task.resume()
            
            // Wait for connection
            Task {
                for await result in task {
                    switch result {
                    case .connected:
                        logger.info("WebSocket connected")
                        self.isConnected = true
                        self.connectionStatus = .connected
                        self.startHeartbeat()
                        continuation.resume()
                    case .disconnected(let error):
                        logger.error("WebSocket disconnected: \(error)")
                        self.handleDisconnect(error: error)
                        continuation.resume()
                    case .failure(let error):
                        logger.error("WebSocket error: \(error)")
                        self.connectionStatus = .error(error.localizedDescription)
                        continuation.resume()
                    case .text(let message):
                        self.handleTextMessage(message)
                    case .binary(let data):
                        self.handleBinaryMessage(data)
                    @unknown default:
                        logger.warning("Unknown WebSocket result")
                    }
                }
            }
        }
    }
    
    // Disconnect
    func disconnect() {
        logger.info("Disconnecting from WebSocket")
        
        reconnectTimer?.invalidate()
        heartbeatTimer?.invalidate()
        
        websocket?.cancel(with: .goingAway, reason: nil)
        websocket = nil
        isConnected = false
        connectionStatus = .disconnected
    }
    
    // Send handshake message
    func sendHandshake() async {
        guard isConnected else {
            logger.warning("Cannot send handshake: not connected")
            return
        }
        
        let payload: [String: Any] = [
            "type": "handshake",
            "voice_prompt": voicePrompt,
            "text_prompt": textPrompt,
            "audio_temperature": audioTemperature,
            "text_temperature": textTemperature,
            "max_tokens": maxTokens
        ]
        
        do {
            let data = try JSONSerialization.data(withJSONObject: payload)
            let message = URLSessionWebSocketTask.Message.binary(data)
            await websocket?.send(message)
            logger.info("Handshake sent")
        } catch {
            logger.error("Failed to send handshake: \(error)")
        }
    }
    
    // Send audio data (Opus encoded)
    func sendAudio(_ audioData: Data) async {
        guard isConnected else {
            logger.warning("Cannot send audio: not connected")
            return
        }
        
        do {
            let message = URLSessionWebSocketTask.Message.binary(audioData)
            await websocket?.send(message)
        } catch {
            logger.error("Failed to send audio: \(error)")
        }
    }
    
    // Send text message
    func sendText(_ text: String) async {
        guard isConnected else {
            logger.warning("Cannot send text: not connected")
            return
        }
        
        let payload: [String: Any] = [
            "type": "text",
            "content": text
        ]
        
        do {
            let data = try JSONSerialization.data(withJSONObject: payload)
            let message = URLSessionWebSocketTask.Message.binary(data)
            await websocket?.send(message)
            logger.info("Text message sent: \(text.prefix(50))...")
        } catch {
            logger.error("Failed to send text: \(error)")
        }
    }
    
    // Handle binary messages
    private func handleBinaryMessage(_ data: Data) {
        guard data.count > 0 else { return }
        
        let messageType = WebSocketMessageType(rawValue: data[0])
        
        switch messageType {
        case .audio:
            // Audio packet - pass to decoder
            onAudioData?(data)
            
        case .text:
            // Text transcript
            let content = String(data: data[1...], encoding: .utf8) ?? ""
            onTextReceived?(content)
            logger.info("Received text: \(content.prefix(50))...")
            
        case .handshake:
            // Handshake response
            do {
                if let json = try JSONSerialization.jsonObject(with: data[1...]) as? [String: Any] {
                    logger.info("Handshake response: \(json)")
                }
            } catch {
                logger.error("Failed to parse handshake response: \(error)")
            }
            
        case nil:
            logger.warning("Unknown message type")
        }
    }
    
    // Handle text messages
    private func handleTextMessage(_ message: String) {
        logger.info("Received text message: \(message)")
        lastMessage = message
    }
    
    // Handle disconnect
    private func handleDisconnect(error: Error) {
        connectionStatus = .error(error.localizedDescription)
        isConnected = false
        stopHeartbeat()
        
        // Schedule reconnect
        reconnectTimer = Timer.scheduledTimer(withTimeInterval: Config.retryDelay, repeats: false) { [weak self] _ in
            Task {
                await self?.connect()
            }
        }
    }
    
    // Start heartbeat
    private func startHeartbeat() {
        stopHeartbeat()
        
        heartbeatTimer = Timer.scheduledTimer(withTimeInterval: Config.heartbeatInterval, repeats: true) { [weak self] _ in
            Task {
                await self?.sendPing()
            }
        }
    }
    
    // Stop heartbeat
    private func stopHeartbeat() {
        heartbeatTimer?.invalidate()
        heartbeatTimer = nil
    }
    
    // Send ping (heartbeat)
    private func sendPing() async {
        guard isConnected, let websocket = websocket else { return }
        
        let ping = URLSessionWebSocketTask.Message.ping([])
        await websocket.send(ping)
    }
}
