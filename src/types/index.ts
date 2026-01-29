export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  RECONNECTING = 'RECONNECTING',
  ERROR = 'ERROR',
}

export type ConnectionStateType = ConnectionState[keyof ConnectionState];

export interface UseWebSocketOptions {
  url: string;
  protocols?: string | string[];
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelayMs?: number;
  pingIntervalMs?: number;
  pongTimeoutMs?: number;
  onStateChange?: (state: ConnectionState) => void;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
}

export interface ConnectionQuality {
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'unavailable';
  latencyMs: number;
  packetLoss?: number;
}

export interface WebSocketRef {
  ws: WebSocket | null;
  reconnectAttempts: number;
}

export interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp?: number;
}

export interface WebSocketAudioMessage {
  type: 'audio';
  audioData: ArrayBuffer;
  format?: string;
}

export interface WebSocketPingMessage {
  type: 'ping';
  timestamp: number;
}

export interface WebSocketPongMessage {
  type: 'pong';
  timestamp: number;
}

export interface WebSocketErrorResponse {
  type: 'error';
  error: string;
  code?: number;
  details?: any;
}

export type WebSocketIncomingMessage =
  | WebSocketAudioMessage
  | WebSocketPingMessage
  | WebSocketPongMessage
  | WebSocketErrorResponse;

export interface WebSocketConfig {
  url: string;
  protocols?: string | string[];
  reconnectEnabled?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  pingInterval?: number;
  pongTimeout?: number;
  autoReconnectOnForeground?: boolean;
}
