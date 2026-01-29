import SwiftUI

// Animated voice orb for connection state
struct VoiceOrbView: View {
    let status: ConnectionStatus
    let isRecording: Bool
    let pulseIntensity: CGFloat
    
    var body: some View {
        ZStack {
            // Outer glow
            Circle()
                .fill(statusColor.opacity(0.3))
                .frame(width: pulseIntensity * 80, height: pulseIntensity * 80)
            
            // Middle glow
            Circle()
                .fill(statusColor.opacity(0.5))
                .frame(width: pulseIntensity * 50, height: pulseIntensity * 50)
            
            // Core orb
            Circle()
                .fill(statusColor)
                .frame(width: pulseIntensity * 25, height: pulseIntensity * 25)
            
            // Recording indicator
            if isRecording {
                Rectangle()
                    .fill(Color.red)
                    .frame(width: 4, height: 20)
                    .cornerRadius(2)
            }
        }
        .animation(.easeInOut(duration: 2).repeatForever(autoreverses: true), value: pulseIntensity)
        .animation(.easeInOut(duration: 0.3).repeatForever(autoreverses: true), value: isRecording)
    }
    
    private var statusColor: Color {
        switch status {
        case .disconnected:
            return Color.gray.opacity(0.5)
        case .connecting:
            return Color.orange.opacity(0.6)
        case .connected:
            return Color.green.opacity(0.8)
        case .error(let message):
            return Color.red.opacity(0.8)
        }
    }
}

// Connection status indicator
struct ConnectionStatusIndicator: View {
    let status: ConnectionStatus
    
    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(statusColor)
                .frame(width: 8, height: 8)
            
            Text(statusText)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
    
    private var statusColor: Color {
        switch status {
        case .disconnected:
            return Color.gray
        case .connecting:
            return Color.orange
        case .connected:
            return Color.green
        case .error:
            return Color.red
        }
    }
    
    private var statusText: String {
        switch status {
        case .disconnected:
            return "Disconnected"
        case .connecting:
            return "Connecting..."
        case .connected:
            return "Connected"
        case .error(let message):
            return message
        }
    }
}

// Voice selector
struct VoiceSelector: View {
    @Binding var selectedVoice: String
    let voices: [String]
    
    var body: some View {
        Picker("Voice", selection: $selectedVoice) {
            ForEach(voices, id: \.self) { voice in
                Text(voice).tag(voice)
            }
        }
        .pickerStyle(SegmentedPickerStyle())
    }
}

// Personality selector
struct PersonalitySelector: View {
    @Binding var selectedPersonality: String
    let personalities: [String]
    
    var body: some View {
        Picker("Personality", selection: $selectedPersonality) {
            ForEach(personalities, id: \.self) { personality in
                Text(personality).tag(personality)
            }
        }
        .pickerStyle(SegmentedPickerStyle())
    }
}
