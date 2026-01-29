import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  RECONNECTING = 'RECONNECTING',
  ERROR = 'ERROR',
}

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

const DEFAULT_OPTIONS: Required<UseWebSocketOptions> = {
  url: '',
  protocols: [],
  autoReconnect: true,
  maxReconnectAttempts: 5,
  reconnectDelayMs: 1000,
  pingIntervalMs: 30000,
  pongTimeoutMs: 5000,
  onStateChange: () => {},
  onConnect: () => {},
  onDisconnect: () => {},
  onError: () => {},
};

export function useWebSocket(options: UseWebSocketOptions) {
  const {
    url,
    protocols,
    autoReconnect = DEFAULT_OPTIONS.autoReconnect,
    maxReconnectAttempts = DEFAULT_OPTIONS.maxReconnectAttempts,
    reconnectDelayMs = DEFAULT_OPTIONS.reconnectDelayMs,
    pingIntervalMs = DEFAULT_OPTIONS.pingIntervalMs,
    pongTimeoutMs = DEFAULT_OPTIONS.pongTimeoutMs,
    onStateChange = DEFAULT_OPTIONS.onStateChange,
    onConnect = DEFAULT_OPTIONS.onConnect,
    onDisconnect = DEFAULT_OPTIONS.onDisconnect,
    onError = DEFAULT_OPTIONS.onError,
  } = options;

  const [state, setState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>({
    quality: 'unavailable',
    latencyMs: 0,
  });

  const wsRef = useRef<WebSocketRef>({ ws: null, reconnectAttempts: 0 });
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pongTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPongTimeRef = useRef<number>(0);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Helper function to set state and callbacks
  const setStateWithCallbacks = useCallback(
    (newState: ConnectionState, callbacks?: { onConnect?: () => void; onDisconnect?: (reason: string) => void }) => {
      setState(newState);
      onStateChange(newState);

      if (newState === ConnectionState.CONNECTED && callbacks?.onConnect) {
        callbacks.onConnect();
      }

      if (newState === ConnectionState.DISCONNECTED && callbacks?.onDisconnect) {
        callbacks.onDisconnect('Connection closed');
      }
    },
    [onStateChange, onConnect, onDisconnect]
  );

  // Exponential backoff delay calculation
  const getBackoffDelay = useCallback((attempt: number): number => {
    const delay = Math.min(reconnectDelayMs * Math.pow(2, attempt), 30000); // Max 30s
    // Add some jitter to prevent thundering herd
    return delay * (0.8 + Math.random() * 0.4);
  }, [reconnectDelayMs]);

  // Clean up WebSocket and timers
  const cleanup = useCallback(() => {
    if (wsRef.current.ws) {
      wsRef.current.ws.close();
      wsRef.current.ws = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (pingTimeoutRef.current) {
      clearTimeout(pingTimeoutRef.current);
      pingTimeoutRef.current = null;
    }

    if (pongTimeoutRef.current) {
      clearTimeout(pongTimeoutRef.current);
      pongTimeoutRef.current = null;
    }

    setConnectionQuality({ quality: 'unavailable', latencyMs: 0 });
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!url) {
      console.error('[useWebSocket] No URL provided');
      return;
    }

    cleanup();

    setStateWithCallbacks(ConnectionState.CONNECTING);

    try {
      const ws = new WebSocket(url, protocols || undefined);

      wsRef.current.ws = ws;

      ws.onopen = () => {
        console.log('[useWebSocket] Connected');
        setReconnectAttempts(0);
        setConnectionQuality({ quality: 'excellent', latencyMs: 0 });
        setStateWithCallbacks(ConnectionState.CONNECTED, { onConnect });
      };

      ws.onclose = (event) => {
        console.log('[useWebSocket] Closed:', event.code, event.reason);
        cleanup();

        if (event.code === 1000 || event.code === 1001) {
          // Normal close
          setStateWithCallbacks(ConnectionState.DISCONNECTED, { onDisconnect });
        } else {
          // Unexpected close - trigger reconnection if enabled
          if (autoReconnect && reconnectAttempts < maxReconnectAttempts) {
            setStateWithCallbacks(ConnectionState.RECONNECTING);
            const delay = getBackoffDelay(reconnectAttempts);
            reconnectTimeoutRef.current = setTimeout(() => {
              setReconnectAttempts((prev) => {
                const next = prev + 1;
                connect();
                return next;
              });
            }, delay);
          } else {
            setStateWithCallbacks(ConnectionState.DISCONNECTED, { onDisconnect });
          }
        }
      };

      ws.onerror = (error) => {
        console.error('[useWebSocket] Error:', error);
        onError(new Error('WebSocket error occurred'));
        cleanup();

        if (autoReconnect && reconnectAttempts < maxReconnectAttempts) {
          setStateWithCallbacks(ConnectionState.RECONNECTING);
          const delay = getBackoffDelay(reconnectAttempts);
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts((prev) => {
              const next = prev + 1;
              connect();
              return next;
            });
          }, delay);
        } else {
          setStateWithCallbacks(ConnectionState.ERROR);
        }
      };

      ws.onmessage = (event) => {
        // Reset pong timer on any message
        if (pongTimeoutRef.current) {
          clearTimeout(pongTimeoutRef.current);
          pongTimeoutRef.current = null;
        }

        // Measure latency
        const now = Date.now();
        if (lastPongTimeRef.current > 0) {
          const latency = now - lastPongTimeRef.current;
          const quality = latency < 100 ? 'excellent' : latency < 300 ? 'good' : latency < 1000 ? 'fair' : 'poor';
          setConnectionQuality({ quality, latencyMs: latency });
        }

        // Update last pong time
        lastPongTimeRef.current = now;
      };
    } catch (error) {
      console.error('[useWebSocket] Failed to create WebSocket:', error);
      onError(error as Error);
      cleanup();
      setStateWithCallbacks(ConnectionState.ERROR);
    }
  }, [
    url,
    protocols,
    autoReconnect,
    maxReconnectAttempts,
    reconnectAttempts,
    reconnectDelayMs,
    cleanup,
    setStateWithCallbacks,
    getBackoffDelay,
    onConnect,
    onDisconnect,
    onError,
  ]);

  // Send data through WebSocket
  const send = useCallback((data: string | ArrayBuffer | Blob) => {
    if (wsRef.current.ws?.readyState === WebSocket.OPEN) {
      wsRef.current.ws.send(data);
      return true;
    }
    console.warn('[useWebSocket] Cannot send - WebSocket not connected');
    return false;
  }, []);

  // Send audio data
  const sendAudio = useCallback((audioData: ArrayBuffer) => {
    return send(audioData);
  }, [send]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    cleanup();
    setReconnectAttempts(0);
    setStateWithCallbacks(ConnectionState.DISCONNECTED, { onDisconnect });
  }, [cleanup, setStateWithCallbacks, onDisconnect]);

  // Manual reconnection
  const manualReconnect = useCallback(() => {
    console.log('[useWebSocket] Manual reconnect requested');
    setReconnectAttempts(0);
    connect();
  }, [connect]);

  // Start ping/pong health monitoring
  const startHealthMonitoring = useCallback(() => {
    if (wsRef.current.ws?.readyState !== WebSocket.OPEN) {
      return;
    }

    // Send ping every 30 seconds
    pingTimeoutRef.current = setInterval(() => {
      if (wsRef.current.ws?.readyState === WebSocket.OPEN) {
        const pingMessage = JSON.stringify({ type: 'ping' });
        wsRef.current.ws.send(pingMessage);
        console.log('[useWebSocket] Ping sent');

        // Set timeout for pong response
        pongTimeoutRef.current = setTimeout(() => {
          console.warn('[useWebSocket] No pong received - triggering reconnect');
          disconnect();
        }, pongTimeoutMs);
      }
    }, pingIntervalMs);
  }, [pingIntervalMs, pongTimeoutMs, disconnect]);

  // Stop health monitoring
  const stopHealthMonitoring = useCallback(() => {
    if (pingTimeoutRef.current) {
      clearInterval(pingTimeoutRef.current);
      pingTimeoutRef.current = null;
    }

    if (pongTimeoutRef.current) {
      clearTimeout(pongTimeoutRef.current);
      pongTimeoutRef.current = null;
    }
  }, []);

  // Handle AppState changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      console.log('[useWebSocket] AppState changed:', nextAppState);
      appStateRef.current = nextAppState;

      // Reconnect if app returns to foreground and we were connected
      if (
        appStateRef.current === 'active' &&
        state === ConnectionState.CONNECTED &&
        !wsRef.current.ws?.readyState
      ) {
        console.log('[useWebSocket] App returned to foreground, reconnecting');
        disconnect();
        setTimeout(connect, 100);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [state, connect, disconnect]);

  // Initialize connection
  useEffect(() => {
    if (url && autoReconnect) {
      connect();
    }

    return () => {
      cleanup();
    };
  }, [url, autoReconnect, connect, cleanup]);

  // Monitor connection state for health checks
  useEffect(() => {
    if (state === ConnectionState.CONNECTED) {
      startHealthMonitoring();
    } else {
      stopHealthMonitoring();
    }

    return () => {
      stopHealthMonitoring();
    };
  }, [state, startHealthMonitoring, stopHealthMonitoring]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    // Connection state
    state,
    isConnected: state === ConnectionState.CONNECTED,
    isConnecting: state === ConnectionState.CONNECTING || state === ConnectionState.RECONNECTING,
    isDisconnected: state === ConnectionState.DISCONNECTED,
    hasError: state === ConnectionState.ERROR,

    // Connection info
    reconnectAttempts,
    connectionQuality,

    // Actions
    connect,
    disconnect,
    send,
    sendAudio,
    manualReconnect,

    // Ref for external access
    ws: wsRef.current.ws,
  };
}
