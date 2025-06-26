// WebSocket hook for real-time metrics
import { useEffect, useState, useRef, useCallback } from 'react';
import type { LiveMetrics, WebSocketMessage } from '../types';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000/metrics';

export function useWebSocket() {
  const [metrics, setMetrics] = useState<LiveMetrics | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    try {
      // Clean up existing connection
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage<LiveMetrics> = JSON.parse(event.data);
          if (message.type === 'metrics') {
            setMetrics(message.data);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;

        // Exponential backoff for reconnection
        const attempts = reconnectAttemptsRef.current;
        if (attempts < 5) {
          const delay = Math.min(1000 * Math.pow(2, attempts), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    // In development, use mock data if WebSocket fails
    if (import.meta.env.DEV) {
      // Simulate live metrics updates
      const interval = setInterval(() => {
        setMetrics({
          docsCreatedToday: Math.floor(Math.random() * 500) + 100,
          activeUsers: Math.floor(Math.random() * 2000) + 500,
          processingQueue: Math.floor(Math.random() * 30),
          timestamp: Date.now(),
        });
      }, 3000);

      // Still try to connect to real WebSocket
      connect();

      return () => {
        clearInterval(interval);
        clearTimeout(reconnectTimeoutRef.current);
        if (wsRef.current) {
          wsRef.current.close();
        }
      };
    } else {
      connect();

      return () => {
        clearTimeout(reconnectTimeoutRef.current);
        if (wsRef.current) {
          wsRef.current.close();
        }
      };
    }
  }, [connect]);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  return {
    metrics,
    isConnected,
    sendMessage,
  };
}