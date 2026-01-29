import Foundation
import SwiftOpus
import AVFoundation
import Logging

// Opus decoder service
class OpusDecoder: NSObject {
    private let logger = Logger(label: "opus-decoder")
    private var decoder: OpusDecoder?
    private var audioBuffer: [Int16]
    private var bufferPosition: Int = 0
    
    // Audio engine for playback
    private var audioEngine = AVAudioEngine()
    private var audioPlayerNode = AVAudioPlayerNode()
    private var audioFormat: AVAudioFormat?
    
    override init() {
        self.audioBuffer = [Int16](repeating: 0, count: 960) // 48kHz * 0.02s
        super.init()
    }
    
    // Initialize decoder with sample rate and channels
    func initialize(sampleRate: Int = Config.sampleRate, channels: Int = Config.channels) throws {
        logger.info("Initializing Opus decoder with \(sampleRate)Hz, \(channels) channel(s)")
        
        decoder = try OpusDecoder(
            sampleRate: sampleRate,
            channels: channels
        )
        
        // Setup audio engine for playback
        audioFormat = AVAudioFormat(
            commonFormat: .pcmFormatInt16,
            sampleRate: Float(sampleRate),
            channels: UInt32(channels),
            interleaved: true
        )
        
        let inputNode = audioEngine.inputNode
        audioEngine.attach(audioPlayerNode)
        audioEngine.attach(inputNode)
        
        let outputBus = 0
        let inputBus = 1
        audioEngine.connect(audioPlayerNode, to: inputNode, format: audioFormat, fromBus: outputBus, toBus: inputBus)
        
        audioPlayerNode.prepare(with: audioFormat)
    }
    
    // Decode Opus packet to PCM
    func decode(_ opusData: Data) -> Data? {
        guard let decoder = decoder else {
            logger.error("Decoder not initialized")
            return nil
        }
        
        var pcmData = [Int16](repeating: 0, count: 960)
        var frameSize = 0
        
        do {
            let status = decoder.decode(
                opusData,
                pcm: pcmData,
                frameSize: pcmData.count,
                outSamples: &frameSize
            )
            
            if status == .ok {
                // Convert Int16 PCM to Data
                return Data(bytes: pcmData, count: frameSize * MemoryLayout<Int16>.size)
            } else {
                logger.warning("Opus decode error: \(status)")
                return nil
            }
        } catch {
            logger.error("Opus decode exception: \(error)")
            return nil
        }
    }
    
    // Decode and play audio stream
    func decodeAndPlay(_ opusData: Data) async throws {
        guard let pcmData = decode(opusData) else {
            return
        }
        
        await playPCMData(pcmData)
    }
    
    // Play PCM data
    private func playPCMData(_ pcmData: Data) async throws {
        let pcmBuffer = AVAudioPCMBuffer(
            pcmFormat: audioFormat!,
            frameCapacity: AVAudioFrameCount(pcmData.count / audioFormat!.streamDescription!.mBytesPerFrame)
        )!
        
        pcmBuffer.frameLength = AVAudioFrameCount(pcmData.count / audioFormat!.streamDescription!.mBytesPerFrame)
        
        if let rawBuffer = pcmBuffer.floatChannelData {
            let pcmInt16 = pcmData.withUnsafeBytes { (bytes: UnsafeRawBufferPointer) -> [Int16] in
                return bytes.bindMemory(to: Int16.self).baseAddress!.map { $0.pointee }
            }
            
            for i in 0..<Int(pcmBuffer.frameLength) {
                rawBuffer[Int(i) * 1].pointee = Float(pcmInt16[i]) / Float(Int16.max)
            }
        }
        
        await audioPlayerNode.start()
        audioPlayerNode.queue(pcmBuffer)
    }
    
    // Stop playback
    func stopPlayback() {
        audioPlayerNode.stop()
    }
    
    // Disconnect and cleanup
    func disconnect() {
        audioEngine.stop()
        audioPlayerNode.stop()
        audioEngine.reset()
        decoder = nil
    }
}
