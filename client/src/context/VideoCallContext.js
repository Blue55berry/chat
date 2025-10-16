import React, { createContext, useState, useRef, useEffect, useContext } from 'react';
import Peer from 'simple-peer';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const VideoCallContext = createContext();

export const useVideoCall = () => {
  return useContext(VideoCallContext);
};

export const VideoCallProvider = ({ children }) => {
  const { user } = useAuth();
  const socket = useSocket();
  
  const [call, setCall] = useState({});
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [isReceivingCall, setIsReceivingCall] = useState(false);
  const [caller, setCaller] = useState('');
  const [callerSignal, setCallerSignal] = useState();
  const [cameraError, setCameraError] = useState(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    if (user && socket) {
      console.log("Socket is ready, setting up callUser listener");
      socket.on('callUser', (data) => {
        console.log("callUser event received:", data);
        setIsReceivingCall(true);
        setCaller(data.from);
        setCall({ name: data.name, from: data.from });
        setCallerSignal(data.signal);
      });

      socket.on('callEnded', () => {
        console.log("callEnded event received");
        setCallEnded(true);
        if (connectionRef.current) {
          connectionRef.current.destroy();
        }
        setCallAccepted(false);
        setIsReceivingCall(false);
        setCall({});
        setStream(null);
        setRemoteStream(null);
      });
    }
  }, [user, socket]);

    const startVideo = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      setIsVideoReady(true);
      return mediaStream;
    } catch (err) {
      setCameraError("Error accessing camera: " + err.message);
      return null;
    }
  };

  const callUser = async (id) => {
    console.log("callUser function called with id:", id);
    if (!socket) {
      console.error("Socket not available");
      return;
    }
    const localStream = await startVideo();
    if (!localStream) {
      alert("Could not start video. Please check camera permissions.");
      return;
    }

    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: localStream,
    });

    peer.on('signal', (data) => {
      socket.emit('callUser', {
        userToCall: id,
        signalData: data,
        from: user._id,
        name: user.username,
      });
    });

    peer.on('stream', (remoteStream) => {
      console.log("Received remote stream");
      setRemoteStream(remoteStream);
    });

    socket.on('callAccepted', (signal) => {
      console.log("callAccepted event received");
      setCallAccepted(true);
      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  const answerCall = async () => {
    console.log("answerCall function called");
    const localStream = await startVideo();
    if (!localStream) {
      alert("Could not start video. Please check camera permissions.");
      return;
    }
    
    setCallAccepted(true);
    setIsReceivingCall(false);

    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: localStream,
    });

    peer.on('signal', (data) => {
      socket.emit('answerCall', { signal: data, to: caller });
    });

    peer.on('stream', (remoteStream) => {
      console.log("Received remote stream in answerCall");
      setRemoteStream(remoteStream);
    });

    peer.signal(callerSignal);
    connectionRef.current = peer;
  };

  const endCall = () => {
    console.log("endCall function called");
    setCallEnded(true);
    setIsReceivingCall(false);
    setCallAccepted(false);

    if (socket) {
      socket.emit("callEnded", { to: call.from });
    }
    
    if (connectionRef.current) {
      connectionRef.current.destroy();
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setCall({});
    setStream(null);
    setRemoteStream(null);
  };

    const value = {
    call,
    callAccepted,
    myVideo,
    userVideo,
    stream,
    remoteStream,
    callEnded,
    isReceivingCall,
    cameraError,
    isVideoReady,
    startVideo,
    callUser,
    answerCall,
    endCall,
  };

  return (
    <VideoCallContext.Provider value={value}>
      {children}
    </VideoCallContext.Provider>
  );
};
