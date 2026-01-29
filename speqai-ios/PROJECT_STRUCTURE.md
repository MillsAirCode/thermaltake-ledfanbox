# SpeqAI iOS Project Structure

## File Overview

### Core Application Files
- **Package.swift** - SPM manifest with dependencies
- **Info.plist** - iOS app configuration and permissions
- **Podfile** - CocoaPods dependencies (alternative to SPM)
- **README.md** - Project documentation

### Main Entry Points
- **SpeqAIDelegate.swift** - iOS 15+ App delegate using SwiftUI
- **SpeqAIApp.swift** - SwiftUI app entry point

### Models
- **AppState.swift** - Observable state for UI updates
  - `AppState` class with published properties
  - `ConnectionStatus` enum
  - `Transcript` struct

- **Config.swift** - Configuration constants
  - WebSocket URL
  - Audio settings (sample rate, channels, bit rate)
  - Opus codec settings
  - Connection timeout
  - Retry settings

### Services (MVVM Architecture)
- **WebSocketService.swift** - WebSocket communication
  - Binary message handling (handshake, audio, text)
  - Reconnection logic
  - Heartbeat mechanism

- **OpusDecoder.swift** - Opus codec decoder
  - Audio decoding to PCM
  - AVAudioEngine integration
  - Real-time playback

- **AudioService.swift** - Audio recording/playback
  - Microphone recording (AAC)
  - PCM data extraction
  - Audio level metering

### ViewModels
- **ChatViewModel.swift** - Main chat logic
  - Manages WebSocket, audio, and decoder
  - Observable state for UI
  - User actions (connect, record, send text)

### Views
- **ContentView.swift** - Main UI
  - Header with animated orb
  - Connection controls
  - Voice/personality selectors
  - Prompt inputs
  - Transcript display
  - Action buttons

- **VoiceOrbView.swift** - Animated components
  - `VoiceOrbView` - Animated connection orb
  - `ConnectionStatusIndicator` - Status display
  - `VoiceSelector` - Voice picker
  - `PersonalitySelector` - Personality picker

## Architecture

```
┌─────────────────┐
│    ContentView  │  (UI Layer)
├─────────────────┤
│ ChatViewModel   │  (ViewModel Layer)
├─────────────────┤
│ Services        │  (Service Layer)
│ - WebSocket     │
│ - OpusDecoder   │
│ - AudioService  │
├─────────────────┤
│    Models       │  (Data Layer)
└─────────────────┘
```

## Dependencies

1. **swift-opus** - Opus audio codec implementation
2. **AsyncHTTPClient** - WebSocket support
3. **Logging** - Logging utilities

## WebSocket Protocol

```
Binary Message Format:
[Type Byte][Payload]

Type Bytes:
0x00 - Handshake (JSON)
0x01 - Audio (Opus encoded)
0x02 - Text (UTF-8 string)
```

## Audio Pipeline

```
Microphone → AudioService (AAC recording)
             ↓
         PCM Data extraction
             ↓
         WebSocketService (send)
             ↓
         PersonaPlex Backend
             ↓
         WebSocketService (receive)
             ↓
         OpusDecoder (decode to PCM)
             ↓
         AVAudioEngine (playback)
```

## Key Features

✓ iOS 15+ compatibility
✓ SwiftUI-based UI
✓ Dark theme
✓ Animated connection orb
✓ Full-duplex voice
✓ Opus audio codec
✓ Real-time audio playback
✓ Customizable personalities
✓ WebSocket reconnection
✓ Microphone recording
