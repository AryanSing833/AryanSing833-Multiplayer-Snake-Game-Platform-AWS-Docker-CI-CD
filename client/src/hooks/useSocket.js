/**
 * useSocket Hook
 * 
 * React hook for managing Socket.IO connection lifecycle.
 * Provides reactive connection state and cleanup on unmount.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import socketService from '../services/socket';

/**
 * @param {object} options
 * @param {boolean} options.autoConnect - Whether to connect automatically
 * @param {string} options.serverUrl - Server URL override
 * @returns {object} Socket state and methods
 */
export function useSocket(options = {}) {
  const {
    autoConnect = false,
    serverUrl,
  } = options;

  const [connected, setConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  // Connect to server
  const connect = useCallback(() => {
    socketService.connect(serverUrl);

    socketService.onConnectionChange(({ connected: isConnected, id }) => {
      if (!mountedRef.current) return;
      setConnected(isConnected);
      setSocketId(isConnected ? id : null);
    });

    socketService.onError(({ message }) => {
      if (!mountedRef.current) return;
      setError(message);
    });
  }, [serverUrl]);

  // Disconnect
  const disconnect = useCallback(() => {
    socketService.disconnect();
    setConnected(false);
    setSocketId(null);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      // Don't auto-disconnect — let the service manage its lifecycle
    };
  }, [autoConnect, connect]);

  return {
    connected,
    socketId,
    error,
    connect,
    disconnect,
    socket: socketService,
  };
}
