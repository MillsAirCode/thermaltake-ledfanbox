# SpeqAI Audio & Connection Fixes

## Issues Summary
1. Audio not playing after connection
2. Frequent disconnections
3. Disconnection during response
4. "All servers busy" error

## Root Causes Identified

### 1. Audio Playback Issues
- Audio context not properly initialized
- WebSocket message listener not properly bound to audio player
- Missing audio state management
- No audio error handling

### 2. Connection Stability Issues
- No reconnection logic with exponential backoff
- Missing heartbeat/ping-pong mechanism
- No proper error handling for transient failures
- Server-side idle timeouts

### 3. Server Management Issues
- No connection pooling or server selection
- No rate limiting
- No fallback to other servers

## Fixes to Implement

### Fix 1: Robust Audio Playback
- Initialize audio context on connection
- Add proper message-to-audio binding
- Implement audio state management
- Add comprehensive error handling

### Fix 2: Connection Reconnection Logic
- Implement exponential backoff retry
- Add heartbeat/ping-pong mechanism
- Proper error handling with retry
- Connection state management

### Fix 3: Server Selection & Rate Limiting
- Implement server selection logic
- Add client-side rate limiting
- Implement fallback to other servers
- Connection pooling

## New Features

### Feature 1: Voice Selector (Rolodex)
- UI component for voice selection
- Voice list with scroll
- Selection feedback
- Persistent selection

### Feature 2: Prompt Selector
- UI component with pre-selected prompts
- Configurable backend prompts
- Easy switching between prompts
- Prompt history

## Implementation Order
1. Fix audio playback
2. Fix connection stability
3. Add reconnection logic
4. Add server selection
5. Add voice selector UI
6. Add prompt selector UI
