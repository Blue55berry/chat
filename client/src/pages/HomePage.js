import React, { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ChatList from '../components/ChatList';
import ChatBox from '../components/ChatBox';
import { useVideoCall } from '../context/VideoCallContext';
import { useAudioCall } from '../context/AudioCallContext';
import AudioCallModal from '../components/AudioCallModal';
import VideoCallModal from '../components/VideoCallModal';
import IncomingCallNotification from '../components/IncomingCallNotification';
import { useChat } from '../context/ChatContext';

const HomePage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { selectedChat } = useChat();
  const { 
    isReceivingCall: isReceivingVideoCall, 
    call: videoCall, 
    callAccepted: videoCallAccepted,
    myVideo,
    userVideo,
    stream: videoStream,
    remoteStream: remoteVideoStream
  } = useVideoCall();
  const { 
    isReceivingCall: isReceivingAudioCall, 
    call: audioCall, 
    callAccepted: audioCallAccepted, 
    audioStream 
  } = useAudioCall();

  const audioPlayer = useRef();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (audioStream && audioPlayer.current) {
        audioPlayer.current.srcObject = audioStream;
    }
  }, [audioStream]);

  useEffect(() => {
    if (videoCallAccepted && myVideo.current && videoStream) {
      myVideo.current.srcObject = videoStream;
    }
  }, [videoCallAccepted, myVideo, videoStream]);

  useEffect(() => {
    if (videoCallAccepted && userVideo.current && remoteVideoStream) {
      userVideo.current.srcObject = remoteVideoStream;
    }
  }, [videoCallAccepted, userVideo, remoteVideoStream]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="md:grid md:grid-cols-12 md:gap-6 h-[calc(100vh-180px)]">
        <div className={`md:col-span-4 h-full mb-4 md:mb-0 ${selectedChat ? 'hidden md:block' : 'block'}`}>
          <ChatList />
        </div>
        <div className={`md:col-span-8 h-full ${selectedChat ? 'block' : 'hidden md:block'}`}>
          <ChatBox />
        </div>
      </div>

      {(isReceivingVideoCall && !videoCallAccepted) && (
        <IncomingCallNotification call={videoCall} />
      )}

      {(isReceivingAudioCall && !audioCallAccepted) && (
        <IncomingCallNotification call={audioCall} isAudioCall />
      )}

      {videoCallAccepted && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex flex-col items-center justify-center p-4">
            <video
              ref={userVideo}
              playsInline
              autoPlay
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
            {videoStream && (
              <video
                ref={myVideo}
                muted
                playsInline
                autoPlay
                className="w-1/4 h-1/4 object-cover absolute bottom-4 right-4"
                style={{ transform: "scaleX(-1)" }}
              />
            )}
          <VideoCallModal />
        </div>
      )}

      <AudioCallModal />

      {audioStream && <audio playsInline autoPlay ref={audioPlayer} />}
    </div>
  );
};

export default HomePage;