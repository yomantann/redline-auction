import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io({
      path: '/socket.io',
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    let hasConnectedBefore = false;
    
    socketInstance.on('connect', () => {
      console.log('[Socket.IO] Connected to server:', socketInstance.id);
      setIsConnected(true);
      
      if (hasConnectedBefore) {
        console.log('[Socket.IO] Reconnected - dispatching reconnect event');
        window.dispatchEvent(new CustomEvent('socket_reconnected'));
      }
      hasConnectedBefore = true;
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('[Socket.IO] Disconnected from server:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('[Socket.IO] Connection error:', error.message);
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (!socketInstance.connected) {
          console.log('[Socket.IO] Tab became visible, reconnecting...');
          socketInstance.connect();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    setSocket(socketInstance);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
