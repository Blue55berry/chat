import React, { createContext, useState, useRef, useEffect, useContext } from 'react';
import Peer from 'simple-peer';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const AudioCallContext = createContext();

export const useAudioCall = () => {
  return useContext(AudioCallContext);
};

export const AudioCallProvider = ({ children }) => {
  const { user } = useAuth();
  const socket = useSocket();

  const [call, setCall] = useState({});
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [isReceivingCall, setIsReceivingCall] = useState(false);
  const [caller, setCaller] = useState('');
  const [callerSignal, setCallerSignal] = useState();
  const [stream, setStream] = useState(null);
  const [audioStream, setAudioStream] = useState();

  const connectionRef = useRef();

  useEffect(() => {
    if (user && socket) {
      socket.on('audioCallUser', (data) => {
        console.log("audioCallUser event received:", data);
        setIsReceivingCall(true);
        setCaller(data.from);
        setCall({ name: data.name, from: data.from, profilePic: data.profilePic });
        setCallerSignal(data.signal);
      });

      socket.on('audioCallEnded', () => {
        console.log("audioCallEnded event received");
        setCallEnded(true);
        if (connectionRef.current) {
          connectionRef.current.destroy();
        }
        setCallAccepted(false);
        setIsReceivingCall(false);
        setCall({});
        setStream(null);
        setAudioStream(null);
      });
    }
  }, [user, socket]);

  const startAudio = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setStream(mediaStream);
      return mediaStream;
    } catch (err) {
      console.error("Error accessing microphone: ", err);
      return null;
    }
  };

  const callUser = async (userToCall) => {
    console.log("callUser for audio called with user:", userToCall);
    if (!socket) {
      console.error("Socket not available");
      return;
    }
    const localStream = await startAudio();
    if (!localStream) {
      alert("Could not start audio. Please check microphone permissions.");
      return;
    }

    setCall({ isCalling: true, name: userToCall.username, profilePic: userToCall.profilePic });

    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: localStream,
    });

    peer.on('signal', (data) => {
      socket.emit('audioCallUser', {
        userToCall: userToCall._id,
        signalData: data,
        from: user._id,
        name: user.username,
        profilePic: user.profilePic,
      });
    });

    peer.on('stream', (remoteStream) => {
        console.log("Received remote audio stream");
        setAudioStream(remoteStream);
    });

    socket.on('audioCallAccepted', (signal) => {
      console.log("audioCallAccepted event received");
      setCallAccepted(true);
      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  const answerCall = async () => {
    console.log("answerCall for audio called");
    const localStream = await startAudio();
    if (!localStream) {
      alert("Could not start audio. Please check microphone permissions.");
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
      socket.emit('answerAudioCall', { signal: data, to: caller });
    });

    peer.on('stream', (remoteStream) => {
        console.log("Received remote audio stream in answerCall");
        setAudioStream(remoteStream);
    });

    peer.signal(callerSignal);
    connectionRef.current = peer;
  };

  const endCall = () => {
    console.log("endCall for audio called");
    setCallEnded(true);
    setIsReceivingCall(false);
    setCallAccepted(false);

    if (socket) {
      socket.emit("audioCallEnded", { to: call.from });
    }

    if (connectionRef.current) {
      connectionRef.current.destroy();
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setCall({});
    setStream(null);
    setAudioStream(null);
  };

  const value = {
    call,
    callAccepted,
    stream,
    audioStream,
    callEnded,
    isReceivingCall,
    startAudio,
    callUser,
    answerCall,
    endCall,
  };

  return (
    <AudioCallContext.Provider value={value}>
      {children}
    </AudioCallContext.Provider>
  );
};