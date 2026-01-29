# SpeqAI iOS

A native iOS app for SpeqAI with real-time voice conversation using WebSocket and Opus audio codec.

## Features

- **Real-time Voice Conversation**: Full-duplex voice communication via WebSocket
- **Opus Audio Codec**: High-quality audio compression and decoding
- **SwiftUI Interface**: Modern, clean iOS UI
- **Dark Theme**: Matches the React Native version
- **Animated Orb**: Visual connection state indicator
- **Customizable Personalities**: Multiple voice and personality options

## Requirements

- iOS 15.0+
- Xcode 13.0+
- Swift 5.7+

## Installation

1. Clone the repository
2. Open `Package.swift` in Xcode
3. Add the package to your project

## Project Structure

```
speqai-ios/
├── Package.swift
├── README.md
└── Sources/
    └── SpeqAI/
        ├── SpeqAIDelegate.swift    # App delegate
        ├── SpeqAIApp.swift         # SwiftUI app entry
        ├── Models/
        │   ├── AppState.swift      # App state management
        │   └── Config.swift        # Configuration constants
        ├── Views/
        │   ├── ContentView.swift   # Main content view
        │   └── VoiceOrbView.swift  # Animated connection orb
        ├── ViewModels/
        │   └── ChatViewModel.swift # Chat and audio management
        └── Services/
            ├── AudioService.swift  # Audio recording/playback
            ├── OpusDecoder.swift   # Opus codec decoder
            └── WebSocketService.swift  # WebSocket communication
```

## Dependencies

- **swift-opus**: Opus audio codec implementation
- **AsyncHTTPClient**: WebSocket support
- **Logging**: Logging utilities

## Usage

### Basic Setup

```swift
// Initialize services
try await viewModel.initializeServices()

// Connect to WebSocket
await viewModel.connect()

// Start recording
await viewModel.startRecording()

// Stop recording
let audioURL = await viewModel.stopRecording()
```

### WebSocket Protocol

Binary messages with type byte prefix:

- `0x00`: Handshake
- `0x01`: Audio (Opus encoded)
- `0x02`: Text transcript

## Configuration

Edit `Config.swift` to customize:

- WebSocket URL
- Audio settings (sample rate, channels, bit rate)
- Opus codec settings
- Connection timeout
- Retry settings

## Building

1. Open the project in Xcode
2. Select your target device or simulator
3. Press Cmd+R to run

## Troubleshooting

### Microphone Permissions

Ensure your app has microphone permissions:
- Add `NSMicrophoneUsageDescription` to `Info.plist`
- Request permissions at runtime

### WebSocket Connection

- Ensure the backend URL is correct
- Check network connectivity
- Verify API credentials if required

## Development

### Adding New Voices

Edit `voicePrompts` in `ContentView.swift`:

```swift
var voicePrompts: [String: String] {
    [
        "new_voice": "You are a new type of assistant."
    ]
}
```

### Customizing UI

Edit views in `Views/` directory using SwiftUI.

## License

MIT License
