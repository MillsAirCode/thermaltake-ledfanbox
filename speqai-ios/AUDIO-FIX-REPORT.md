# SpeqAI iOS Audio Connection Fix

## Problem Identified

The iOS app was unable to connect to the PersonaPlex servers properly due to a **mismatch in audio encoding**:

1. The app **recorded audio in PCM format**
2. The app **sent PCM data through WebSocket** to the server
3. The server **expected Opus-encoded audio**
4. **Result**: Connection failed or didn't work properly

## Root Cause

- `AudioService.swift` → Records audio in PCM format
- `WebSocketService.swift` → Sends raw PCM without encoding
- `OpusEncoder.swift` → **Missing file** (no Opus encoder existed)

## Solution Implemented

### 1. Created OpusEncoder.swift
- New file that handles Opus encoding
- Encodes PCM audio to Opus format
- Prepends message type byte (0x01) for WebSocket protocol
- Integrates with existing Opus library

### 2. Updated ChatViewModel.swift
- Added `OpusEncoder` instance
- Modified `stopRecording()` to:
  1. Get PCM audio from AudioService
  2. **Encode PCM to Opus** using OpusEncoder
  3. Send Opus data through WebSocket

## Code Changes

### OpusEncoder.swift (new)
```swift
class OpusEncoder {
    func encodeAudioForWebSocket(_ pcmData: Data) -> Data?
    // Returns: [type_byte][opus_encoded_data]
}
```

### ChatViewModel.swift (modified)
```swift
// Added encoder
private let opusEncoder = OpusEncoder()

// Updated stopRecording
let pcmData = try await audioService.getAudioData(from: url)
let opusData = opusEncoder.encodeAudioForWebSocket(pcmData)
await webSocketService.sendAudio(opusData)
```

## WebSocket Protocol

Messages now follow the proper format:
- **Message Type**: 0x01 (audio)
- **Payload**: Opus-encoded audio data

This matches the backend's expected protocol.

## Testing Recommendations

1. **Build the app** in Xcode
2. **Test connection** to PersonaPlex servers
3. **Verify audio flow**:
   - Recording → PCM → Opus → WebSocket → Server
   - Server → WebSocket → Opus → PCM → Playback

## Files Changed

1. ✅ `Sources/SpeqAI/Services/OpusEncoder.swift` (new)
2. ✅ `Sources/SpeqAI/ViewModels/ChatViewModel.swift` (modified)

## Next Steps

- Build and test on device/simulator
- Verify server receives Opus-encoded audio
- Check connection status and audio playback
