import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { SocketProvider } from './context/SocketContext';
import { VideoCallProvider } from './context/VideoCallContext';
import { AudioCallProvider } from './context/AudioCallContext';
import process from 'process';

window.process = process;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <AuthProvider>
    <SocketProvider>
      <ChatProvider>
        <VideoCallProvider>
          <AudioCallProvider>
            <App />
          </AudioCallProvider>
        </VideoCallProvider>
      </ChatProvider>
    </SocketProvider>
  </AuthProvider>
);
