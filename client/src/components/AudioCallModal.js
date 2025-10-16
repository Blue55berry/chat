import React, { useState, useEffect } from 'react';
import { useAudioCall } from '../context/AudioCallContext';
import { FaPhoneSlash, FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';

const AudioCallModal = () => {
  const {
    call,
    callAccepted,
    callEnded,
    stream,
    endCall,
  } = useAudioCall();

  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);

  const getImageUrl = (path) => {
    if (!path) return 'https://placehold.co/150';
    if (path.startsWith('http') || path.startsWith('blob:')) {
      return path;
    }
    return `http://localhost:5000${path}`;
  };

  useEffect(() => {
    let timer;
    if (callAccepted && !callEnded) {
      timer = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      clearInterval(timer);
      setDuration(0);
    };
  }, [callAccepted, callEnded]);

  if (!callAccepted || callEnded) {
    return null;
  }

  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 text-white rounded-lg shadow-xl p-8 w-full max-w-sm text-center">
        <h2 className="text-2xl font-bold mb-2">Audio Call</h2>
        <p className="text-gray-400 mb-4">
          Call with <span className="font-semibold">{call.name || '...'}</span>
        </p>
        
        <div className="my-8">
            <div className="w-32 h-32 bg-gray-700 rounded-full mx-auto flex items-center justify-center overflow-hidden pulse-ring">
                <img src={getImageUrl(call.profilePic)} alt={call.name} className="w-full h-full object-cover" />
            </div>
        </div>

        <p className="text-2xl font-mono mb-8">{formatDuration(duration)}</p>

        <div className="flex justify-center gap-6 mt-4">
            <button
              onClick={toggleMute}
              className={`${isMuted ? 'bg-gray-600' : 'bg-blue-500 hover:bg-blue-600'} text-white p-4 rounded-full`}>
              {isMuted ? <FaMicrophoneSlash className="text-xl" /> : <FaMicrophone className="text-xl" />}
            </button>
            <button
              onClick={endCall}
              className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full">
              <FaPhoneSlash className="text-xl" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default AudioCallModal;