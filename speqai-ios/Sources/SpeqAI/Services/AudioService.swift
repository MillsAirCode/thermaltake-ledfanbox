import Foundation
import AVFoundation
import Combine
import Logging

// Audio service for recording and playback
class AudioService: NSObject, ObservableObject {
    private let logger = Logger(label: "audio-service")
    
    // Audio recording
    private var audioRecorder: AVAudioRecorder?
    private var recordingURL: URL?
    private var recordingStartTime: Date?
    
    // Audio playback
    private var audioPlayer: AVAudioPlayer?
    
    // Audio engine for processing
    private var audioEngine = AVAudioEngine()
    private var inputNode: AVAudioInputNode?
    private var outputNode: AVAudioEngine?
    
    // Recording settings
    private var sampleRate = Config.sampleRate
    private var channels = Config.channels
    private var bitRate = Config.bitRate
    
    // State
    @Published var isRecording = false
    @Published var isPlaying = false
    @Published var recordingDuration: TimeInterval = 0
    @Published var audioLevel: Float = 0.0
    
    private var updateTimer: Timer?
    
    override init() {
        super.init()
    }
    
    // Request microphone permissions
    func requestPermissions() async throws {
        let session = AVAudioSession.sharedInstance()
        
        try await session.setCategory(
            .recordAndPlay,
            mode: .videoChat,
            options: [.defaultToSpeaker]
        )
        
        try await session.setActive(true)
        
        logger.info("Audio permissions granted")
    }
    
    // Start recording
    func startRecording() async throws {
        let session = AVAudioSession.sharedInstance()
        try await session.setCategory(.record, mode: .videoChat, options: [.defaultToSpeaker])
        try await session.setActive(true)
        
        recordingURL = try FileManager.default
            .url(for: .cachesDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
            .appendingPathComponent("recording-\(UUID().uuidString).caf")
        
        let settings: [String: Any] = [
            AVFormatIDKey: kAudioFormatMPEG4AAC,
            AVSampleRateKey: sampleRate,
            AVNumberOfChannelsKey: channels,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
        ]
        
        audioRecorder = try AVAudioRecorder(url: recordingURL!, settings: settings)
        audioRecorder?.record()
        recordingStartTime = Date()
        
        isRecording = true
        
        // Start level meter
        startLevelMetering()
        
        logger.info("Recording started")
    }
    
    // Stop recording
    func stopRecording() async -> URL? {
        guard let recorder = audioRecorder, recorder.isRecording else {
            return nil
        }
        
        recorder.stop()
        isRecording = false
        recordingDuration = 0
        
        // Stop level metering
        stopLevelMetering()
        
        let url = recordingURL
        recordingURL = nil
        recordingStartTime = nil
        
        logger.info("Recording stopped, duration: \(recordingDuration)s")
        
        return url
    }
    
    // Play audio file
    func playAudioFile(at url: URL) async throws {
        stopPlayback()
        
        audioPlayer = try AVAudioPlayer(contentsOf: url)
        audioPlayer?.prepareToPlay()
        
        isPlaying = true
        await audioPlayer?.play()
        
        logger.info("Playing audio file")
    }
    
    // Stop playback
    func stopPlayback() {
        audioPlayer?.stop()
        isPlaying = false
        logger.info("Playback stopped")
    }
    
    // Get audio data as PCM
    func getAudioData(from url: URL) async throws -> Data {
        let asset = AVAsset(url: url)
        let audioTrack = asset.tracks(withMediaType: .audio).first!
        
        let formatDescription = audioTrack.formatDescriptions.first as! CMAudioFormatDescription
        let audioStreamBasicDescription = formatDescription.formatDescription as! AudioStreamBasicDescription
        
        let reader = try AVAssetReader(asset: asset)
        reader.loadTracks(forMediaType: .audio)
        
        let outputSettings: [String: Any] = [
            AVFormatIDKey: kAudioFormatLinearPCM,
            AVSampleRateKey: audioStreamBasicDescription.mSampleRate,
            AVNumberOfChannelsKey: audioStreamBasicDescription.mChannelsPerFrame,
            AVLinearPCMBitDepthKey: 16,
            AVLinearPCMIsNonInterleaved: false,
            AVLinearPCMIsFloatKey: false,
            AVLinearPCMFormatFlagBigEndianKey: false
        ]
        
        let output = try AVAssetReaderAudioTrackOutput(
            audioTrack: audioTrack,
            outputSettings: outputSettings
        )
        
        reader.add(output)
        reader.startReading()
        
        var pcmData = Data()
        
        while let sampleBuffer = output.copyNextSampleBuffer() {
            if let blockBuffer = CMSampleBufferGetDataBuffer(sampleBuffer) {
                var dataPointer: UnsafeMutablePointer<UInt8>?
                CMSampleBufferGetBufferPointer(sampleBuffer, &dataPointer, nil, nil)
                
                let length = CMBlockBufferGetDataLength(blockBuffer)
                let audioData = Data(bytes: dataPointer!, count: length)
                pcmData.append(audioData)
            }
        }
        
        return pcmData
    }
    
    // Start level metering
    private func startLevelMetering() {
        inputNode = audioEngine.inputNode
        audioEngine.prepare()
        
        let inputBus = 0
        let format = audioEngine.inputNode.outputFormat(forBus: inputBus)
        
        let recorder = AVAudioRecorder(url: recordingURL!, settings: [
            AVFormatIDKey: kAudioFormatMPEG4AAC,
            AVSampleRateKey: sampleRate,
            AVNumberOfChannelsKey: channels,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
        ])
        
        updateTimer = Timer.scheduledTimer(withTimeInterval: 0.05, repeats: true) { [weak self] _ in
            guard let self = self,
                  let recorder = self.audioRecorder,
                  let avgPower = recorder.averagePower(forChannel: 0) else {
                return
            }
            
            // Convert dB to 0-1 range
            self.audioLevel = pow(10, avgPower / 20.0)
        }
    }
    
    // Stop level metering
    private func stopLevelMetering() {
        updateTimer?.invalidate()
        updateTimer = nil
    }
    
    // Cleanup
    func disconnect() {
        stopPlayback()
        
        if let recorder = audioRecorder, recorder.isRecording {
            recorder.stop()
        }
        
        audioEngine.stop()
        audioEngine.reset()
    }
}
