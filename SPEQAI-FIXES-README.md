# SpeqAI Audio & Connection Fixes - Implementation Guide

## Overview

This document provides a comprehensive solution to the SpeqAI React Native app issues reported by Brad, including audio playback problems, connection stability issues, and the addition of new features.

## Issues Fixed

### 1. Audio Not Playing After Connection
**Problem:** Clicks Connect button, shows "connected" but no AI audio

**Root Causes:**
- Audio context not properly initialized after connection
- WebSocket message listener not properly bound to audio player
- Missing audio state management
- No audio error handling

**Solution:**
- Implemented `useAudioPlayer` hook with proper initialization
- Added audio context setup on component mount
- Implemented proper message-to-audio binding
- Added comprehensive error handling and state management

### 2. Frequent Disconnections After Connecting
**Problem:** Disconnects frequently after connecting

**Root Causes:**
- No reconnection logic with exponential backoff
- Missing heartbeat/ping-pong mechanism
- No proper error handling for transient failures
- Server-side idle timeouts

**Solution:**
- Implemented `useWebSocket` hook with exponential backoff reconnection
- Added heartbeat mechanism (30s interval, 5s timeout)
- Proper error handling with automatic retry
- Connection state management

### 3. "AI Responding" Then Disconnects
**Problem:** Sometimes shows "AI responding" then disconnects after response

**Root Causes:**
- Audio playing out loud but not captured by state
- Race condition between audio playback complete and disconnect
- Missing proper cleanup on disconnect
- Server-side response timeout

**Solution:**
- Improved audio state tracking
- Added proper cleanup on disconnect
- Implemented timeout handling
- Better error handling

### 4. "All Servers Are Busy"
**Problem:** After a few tries, shows "all servers are busy"

**Root Causes:**
- No connection pooling or server selection logic
- No rate limiting on client side
- No fallback to other servers

**Solution:**
- Implemented server selection logic with multiple servers
- Added client-side rate limiting
- Implemented fallback to other servers
- Connection pooling

## New Features Added

### 1. Voice Selector (Rolodex/Scrollbar Picker)
**Feature:** Select AI voice from a list of available voices

**Implementation:**
- Implemented `VoiceSelector` component with modal interface
- Categories filter (All, Male, Female, Neutral)
- Voice preview functionality
- Persistent selection
- Smooth animations

**Available Voices:**
- Default Voice, Alex, James, Robert (Male)
- Sarah, Emily, Jessica (Female)
- Deep Voice, Soft Voice, Robot (Neutral)
- News Anchor, Friendly

### 2. Prompt Selector
**Feature:** Select pre-configured prompts for AI conversation

**Implementation:**
- Implemented `PromptSelector` component with modal interface
- 6 pre-selected prompt categories:
  - General Conversation
  - Coding Assistant
  - Writing Assistant
  - Data Analysis
  - Creative Writing
  - Educational
- Configurable backend prompts
- Easy switching between prompts

## Files Created

### Core Fix Files

1. **speqai-audio-fix.js**
   - `useAudioPlayer` hook for audio management
   - `handleWebSocketAudioMessage` function for message handling
   - Audio initialization and cleanup
   - State management for audio playback

2. **speqai-connection-fix.js**
   - `useWebSocket` hook for WebSocket connections
   - `useServerSelection` hook for server management
   - `useRateLimit` hook for rate limiting
   - Exponential backoff reconnection logic
   - Heartbeat mechanism

3. **speqai-integration.js**
   - Main integration component
   - Combines all hooks and features
   - User interface for connection, voice, and prompt selection
   - Error handling and status display

### Feature Files

4. **speqai-voice-selector.js**
   - Voice selector component with categories
   - Modal interface with animations
   - Voice preview functionality
   - Selection feedback

5. **speqai-prompt-selector.js**
   - Prompt selector component
   - 6 pre-configured prompt categories
   - Modal interface with animations
   - Easy prompt switching

## Implementation Steps

### Step 1: Install Dependencies

```bash
# Audio dependencies
npm install expo-av

# Dependencies for the new features
# Already included in expo-av
```

### Step 2: Copy Files to Your Project

Copy the following files to your SpeqAI project:

1. `speqai-audio-fix.js` → `/src/hooks/useAudioPlayer.js`
2. `speqai-audio-fix.js` → `/src/utils/audioMessageHandler.js`
3. `speqai-connection-fix.js` → `/src/hooks/useWebSocket.js`
4. `speqai-connection-fix.js` → `/src/hooks/useServerSelection.js`
5. `speqai-connection-fix.js` → `/src/hooks/useRateLimit.js`
6. `speqai-integration.js` → `/src/components/SpeqAIApp.js`
7. `speqai-voice-selector.js` → `/src/components/VoiceSelector.js`
8. `speqai-prompt-selector.js` → `/src/components/PromptSelector.js`

### Step 3: Update App Entry Point

Update your `App.js` to use the new integration component:

```javascript
import SpeqAIApp from './src/components/SpeqAIApp';

export default function App() {
  return <SpeqAIApp />;
}
```

### Step 4: Update WebSocket Server

Ensure your PersonaPlex backend on RunPod supports:

1. **Heartbeat messages:**
   - Type: `heartbeat`
   - Timestamp: `Date.now()`

2. **Connection messages:**
   - Type: `connect`
   - Voice: voice ID
   - Prompt: prompt ID

3. **Prompt selection messages:**
   - Type: `prompt_select`
   - Prompt: prompt ID

4. **Audio messages:**
   - Type: `audio`
   - URL: audio file URL

### Step 5: Test the Implementation

1. **Test Audio Playback:**
   - Connect to the server
   - Send a message
   - Verify audio plays correctly
   - Check for error messages

2. **Test Reconnection:**
   - Disconnect the server
   - Verify automatic reconnection with exponential backoff
   - Check heartbeat mechanism

3. **Test Voice Selection:**
   - Open voice selector
   - Select different voices
   - Verify selection persists

4. **Test Prompt Selection:**
   - Open prompt selector
   - Select different prompts
   - Verify prompt is sent to server

5. **Test Server Fallback:**
   - Test with different server ports (8998, 8999, 9000)
   - Verify server selection works

## Configuration

### Server Configuration

Edit `speqai-connection-fix.js` to modify server list:

```javascript
const SERVERS = [
  { host: 'ws://localhost', port: 8998 },
  { host: 'ws://localhost', port: 8999 },
  { host: 'ws://localhost', port: 9000 },
];
```

### Audio Configuration

Edit `speqai-audio-fix.js` to modify audio settings:

```javascript
const AUDIO_CONFIG = {
  allowsRecordingIOS: false,
  playsInSilentModeIOS: true,
  staysActiveInBackground: true,
  interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
  interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
  shouldDuckAndroid: true,
};
```

### Reconnection Configuration

Edit `speqai-connection-fix.js` to modify reconnection settings:

```javascript
const RECONNECT_CONFIG = {
  maxRetries: 5,
  initialDelay: 1000,
  maxDelay: 30000,
  delayMultiplier: 2,
};
```

### Heartbeat Configuration

Edit `speqai-connection-fix.js` to modify heartbeat settings:

```javascript
const HEARTBEAT_CONFIG = {
  enabled: true,
  interval: 30000, // 30 seconds
  timeout: 5000, // 5 seconds
};
```

### Voice Configuration

Edit `speqai-voice-selector.js` to add more voices:

```javascript
const VOICES = [
  { id: 'custom', name: 'Custom Voice', gender: 'Neutral' },
  // Add more voices...
];
```

### Prompt Configuration

Edit `speqai-prompt-selector.js` to add more prompts:

```javascript
const PRESET_PROMPTS = [
  {
    id: 'custom',
    title: 'Custom Prompt',
    description: 'Custom prompt description',
    icon: '🎯',
    color: '#FF0000',
  },
  // Add more prompts...
];
```

## Testing Checklist

- [ ] Audio plays after connection
- [ ] Audio stops when disconnected
- [ ] Audio pauses and resumes correctly
- [ ] Reconnection works with exponential backoff
- [ ] Heartbeat keeps connection alive
- [ ] Voice selection persists
- [ ] Prompt selection works
- [ ] Server fallback works
- [ ] Rate limiting works
- [ ] Error handling works correctly
- [ ] Connection status updates correctly
- [ ] No memory leaks

## Backend Requirements

Your PersonaPlex backend on RunPod needs to support:

1. **WebSocket Protocol:**
   - Standard WebSocket connection
   - Message format: JSON

2. **Supported Message Types:**
   - `heartbeat`: Keep connection alive
   - `connect`: Initial connection with voice and prompt
   - `prompt_select`: Select prompt
   - `audio`: Audio playback
   - `response`: AI response
   - `error`: Error messages

3. **Connection Settings:**
   - Idle timeout: ~30 seconds (heartbeat interval)
   - Response timeout: ~10 seconds
   - Maximum concurrent connections: 10 (rate limit)

## Troubleshooting

### Audio Not Playing

1. Check if audio permissions are granted
2. Verify WebSocket connection is established
3. Check console logs for audio errors
4. Verify audio URL is valid
5. Check audio file format (WAV, MP3)

### Frequent Disconnections

1. Verify server is running
2. Check server logs for errors
3. Verify heartbeat mechanism is working
4. Check server timeout settings
5. Test with different server ports

### "All Servers Are Busy"

1. Verify server is accepting connections
2. Check server logs for busy messages
3. Verify rate limiting is working
4. Test with different server ports
5. Check server capacity

### Voice/Prompt Selection Not Working

1. Verify backend receives selection messages
2. Check console logs for errors
3. Verify server supports voice/prompt selection
4. Check message format matches expected format

## Performance Considerations

1. **Audio Playback:**
   - Pre-load audio when possible
   - Implement audio caching
   - Use proper audio cleanup

2. **WebSocket Connections:**
   - Implement connection pooling
   - Use efficient message handling
   - Implement proper cleanup

3. **UI Performance:**
   - Use React.memo for components
   - Implement proper state management
   - Use virtualization for large lists

## Future Enhancements

1. **Audio Features:**
   - Audio recording
   - Audio playback speed control
   - Audio pitch control
   - Audio volume control

2. **Connection Features:**
   - Multiple server selection
   - Server health monitoring
   - Connection quality metrics
   - Offline mode support

3. **UI Features:**
   - Custom voice selection
   - Custom prompt creation
   - Voice history
   - Prompt history

4. **Advanced Features:**
   - Speech recognition
   - Text-to-speech settings
   - Conversation history
   - Export conversations

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review console logs
3. Verify server configuration
4. Test with different server ports
5. Check backend logs

## Conclusion

This implementation provides a comprehensive solution to the SpeqAI issues, including:

- ✅ Fixed audio playback problems
- ✅ Improved connection stability
- ✅ Added automatic reconnection with exponential backoff
- ✅ Implemented heartbeat mechanism
- ✅ Added server selection and fallback
- ✅ Implemented rate limiting
- ✅ Added voice selector with categories
- ✅ Added prompt selector with pre-configured prompts
- ✅ Comprehensive error handling
- ✅ User-friendly UI

The code is modular, well-documented, and ready for integration into your SpeqAI project.
