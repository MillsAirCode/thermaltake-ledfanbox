// WebSocket connection fix for SpeqAI
// This module handles robust WebSocket connections with reconnection logic

import { useState, useEffect, useRef } from 'react';

// Server configuration
const SERVERS = [
  { host: 'ws://localhost', port: 8998 },
  { host: 'ws://localhost', port: 8999 },
  { host: 'ws://localhost', port: 9000 },
];

const DEFAULT_SERVER = SERVERS[0];

// Reconnection configuration
const RECONNECT_CONFIG = {
  maxRetries: 5,
  initialDelay: 1000,
  maxDelay: 30000,
  delayMultiplier: 2,
};

// Heartbeat configuration
const HEARTBEAT_CONFIG = {
  enabled: true,
  interval: 30000, // 30 seconds
  timeout: 5000, // 5 seconds
};

export const useWebSocket = ({ server = DEFAULT_SERVER, onMessage, onError, onConnected, onDisconnected }) => {
  const [ws, setWs] = useState(null);
  const [status, setStatus] = useState('disconnected');
  const [reconnectCount, setReconnectCount] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const reconnectTimerRef = useRef(null);
  const heartbeatTimerRef = useRef(null);
  const heartbeatTimeoutRef = useRef(null);
  const wsRef = useRef(null);

  // Connect to WebSocket server
  const connect = async () => {
    try {
      console.log(`Connecting to ${server.host}:${server.port}...`);

      const wsUrl = `${server.host}:${server.port}`;
      const ws = new WebSocket(wsUrl);

      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setStatus('connected');
        setReconnectCount(0);
        setIsReconnecting(false);

        if (onConnected) {
          onConnected();
        }

        // Start heartbeat
        if (HEARTBEAT_CONFIG.enabled) {
          startHeartbeat();
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          if (onMessage) {
            onMessage(data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          if (onError) {
            onError(error);
          }
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (onError) {
          onError(error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setStatus('disconnected');
        setIsReconnecting(false);
        stopHeartbeat();

        if (onDisconnected) {
          onDisconnected(event.code, event.reason);
        }

        // Attempt reconnection if not explicitly closed
        if (!event.wasClean && reconnectCount < RECONNECT_CONFIG.maxRetries) {
          scheduleReconnection();
        }
      };

      setWs(ws);

    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      if (onError) {
        onError(error);
      }

      // Schedule reconnection attempt
      scheduleReconnection();
    }
  };

  // Schedule reconnection with exponential backoff
  const scheduleReconnection = () => {
    if (isReconnecting) {
      return;
    }

    setIsReconnecting(true);

    const delay = Math.min(
      RECONNECT_CONFIG.initialDelay * Math.pow(RECONNECT_CONFIG.delayMultiplier, reconnectCount),
      RECONNECT_CONFIG.maxDelay
    );

    console.log(`Scheduling reconnection in ${delay}ms (attempt ${reconnectCount + 1}/${RECONNECT_CONFIG.maxRetries})`);

    reconnectTimerRef.current = setTimeout(() => {
      setReconnectCount(prev => prev + 1);
      connect();
    }, delay);
  };

  // Stop reconnection attempts
  const stopReconnection = () => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    setIsReconnecting(false);
  };

  // Send message through WebSocket
  const send = (data) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
      console.log('Sent message:', data);
      return true;
    } else {
      console.error('WebSocket not connected');
      return false;
    }
  };

  // Heartbeat management
  const startHeartbeat = () => {
    stopHeartbeat();

    // Send heartbeat immediately
    sendHeartbeat();

    // Schedule periodic heartbeats
    heartbeatTimerRef.current = setInterval(() => {
      sendHeartbeat();
    }, HEARTBEAT_CONFIG.interval);
  };

  const stopHeartbeat = () => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
  };

  const sendHeartbeat = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const heartbeatData = {
      type: 'heartbeat',
      timestamp: Date.now(),
    };

    ws.send(JSON.stringify(heartbeatData));

    // Set timeout for heartbeat response
    heartbeatTimeoutRef.current = setTimeout(() => {
      console.error('Heartbeat timeout');
      if (ws) {
        ws.close(1000, 'Heartbeat timeout');
      }
    }, HEARTBEAT_CONFIG.timeout);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      stopReconnection();
      stopHeartbeat();

      if (ws) {
        ws.close(1000, 'Component unmount');
      }
    };
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();

    return () => {
      stopReconnection();
      stopHeartbeat();

      if (ws) {
        ws.close(1000, 'Component unmount');
      }
    };
  }, [server]);

  return {
    status,
    isReconnecting,
    reconnectCount,
    send,
    connect,
    disconnect: () => {
      stopReconnection();
      stopHeartbeat();

      if (ws) {
        ws.close(1000, 'Manual disconnect');
      }
    },
  };
};

// Server selection hook
export const useServerSelection = (servers = SERVERS) => {
  const [selectedServer, setSelectedServer] = useState(servers[0]);

  const selectServer = (server) => {
    setSelectedServer(server);
  };

  const getNextServer = () => {
    const currentIndex = servers.findIndex(s => s.host === selectedServer.host && s.port === selectedServer.port);
    const nextIndex = (currentIndex + 1) % servers.length;
    return servers[nextIndex];
  };

  return {
    selectedServer,
    selectServer,
    getNextServer,
    servers,
  };
};

// Rate limiting hook
export const useRateLimit = (maxRequests = 10, windowMs = 60000) => {
  const requestsRef = useRef(new Map());

  const canMakeRequest = () => {
    const now = Date.now();

    // Clean up old requests
    requestsRef.current.forEach((timestamp, key) => {
      if (now - timestamp > windowMs) {
        requestsRef.current.delete(key);
      }
    });

    // Check rate limit
    if (requestsRef.current.size >= maxRequests) {
      return false;
    }

    return true;
  };

  const recordRequest = (key) => {
    requestsRef.current.set(key, Date.now());
  };

  return {
    canMakeRequest,
    recordRequest,
  };
};
