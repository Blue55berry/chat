import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import io from 'socket.io-client';

const OnlineStatusContext = createContext();

export const OnlineStatusProvider = ({ children }) => {
  const [onlineUsers, setOnlineUsers] = useState({});
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Connect to socket server
    const socket = io('http://localhost:5000');
    
    // Set up user as online
    socket.emit('user:online', { userId: user._id });

    // Listen for online users updates
    socket.on('online:users', (users) => {
      console.log("Online users updated:", users);
      setOnlineUsers(users);
    });

    // Cleanup on unmount
    return () => {
      socket.emit('user:offline', { userId: user._id });
      socket.disconnect();
    };
  }, [user]);

  return (
    <OnlineStatusContext.Provider value={{ onlineUsers }}>
      {children}
    </OnlineStatusContext.Provider>
  );
};

export const useOnlineStatus = () => {
  const context = useContext(OnlineStatusContext);
  if (!context) {
    throw new Error('useOnlineStatus must be used within an OnlineStatusProvider');
  }
  return context;
};
