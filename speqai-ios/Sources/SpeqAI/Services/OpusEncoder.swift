import Foundation
import SwiftOpus
import AVFoundation
import Logging

// Opus encoder service for recording
class OpusEncoder: NSObject {
    private let logger = Logger(label: "opus-encoder")
    private var encoder: OpusEncoder?
    private var audioBuffer: [Int16]
    private var bufferPosition: Int = 0
    
    // Audio settings
    private var sampleRate: Int
    private var channels: Int
    
    // Recording state
    private var isRecording = false
    private var recordingStartTime: Date?
    
    // State
    @Published var isEncoding = false
    @Published var encodingDuration: TimeInterval = 0
    @Published var audioLevel: Float = 0.0
    
    private var updateTimer: Timer?
    
    override init(sampleRate: Int = Config.sampleRate, channels: Int = Config.channels) {
        self.sampleRate = sampleRate
        self.channels = channels
        self.audioBuffer = [Int16](repeating: 0, count: 960) // 48kHz * 0.02s
        super.init()
    }
    
    // Initialize encoder with sample rate and channels
    func initialize() throws {
        logger.info("Initializing Opus encoder with \(sampleRate)Hz, \(channels) channel(s)")
        
        encoder = try OpusEncoder(
            sampleRate: sampleRate,
            channels: channels
        )
        
        logger.info("Opus encoder initialized successfully")
    }
    
    // Encode PCM audio to Opus
    func encode(_ pcmData: Data) -> Data? {
        guard let encoder = encoder else {
            logger.error("Encoder not initialized")
            return nil
        }
        
        var opusData = [UInt8](repeating: 0, count: 1276) // Maximum Opus frame size
        var frameSize = 0
        
        do {
            let status = encoder.encode(
                pcmData,
                opus: &opusData,
                frameSize: pcmData.count / (MemoryLayout<Int16>.size * channels)
            )
            
            if status == .ok {
                // Return actual encoded data (first byte is packet type)
                let result = Data(bytes: opusData, count: frameSize)
                logger.debug("Encoded \(pcmData.count) bytes PCM to \(result.count) bytes Opus")
                return result
            } else {
                logger.warning("Opus encode error: \(status)")
                return nil
            }
        } catch {
            logger.error("Opus encode exception: \(error)")
            return nil
        }
    }
    
    // Encode and get audio data for WebSocket
    func encodeAudioForWebSocket(_ pcmData: Data) -> Data? {
        // Opus packets start with a type byte (0x01 for audio)
        guard let opusData = encode(pcmData) else {
            return nil
        }
        
        // Prepend message type byte
        var messageData = Data()
        messageData.append(WebSocketMessageType.audio.rawValue)
        messageData.append(contentsOf: opusData)
        
        return messageData
    }
    
    // Cleanup
    func disconnect() {
        isEncoding = false
    }
}
