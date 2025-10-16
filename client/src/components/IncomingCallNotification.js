import React, { useEffect, useState } from 'react';
import { useVideoCall } from '../context/VideoCallContext';
import { useAudioCall } from '../context/AudioCallContext';
import { FaPhone, FaPhoneSlash } from 'react-icons/fa';

const IncomingCallNotification = ({ call, isAudioCall }) => {
  const { answerCall: answerVideoCall, endCall: endVideoCall } = useVideoCall();
  const { answerCall: answerAudioCall, endCall: endAudioCall } = useAudioCall();
  const [showModal, setShowModal] = useState(true);

  useEffect(() => {
    // Audio notification removed because the file '/notification.mp3' was missing.
  }, []);

  const handleAnswer = () => {
    if (isAudioCall) {
      answerAudioCall();
    } else {
      answerVideoCall();
    }
    setShowModal(false);
  };

  const handleDecline = () => {
    if (isAudioCall) {
      endAudioCall();
    } else {
      endVideoCall();
    }
    setShowModal(false);
  };

  if (!showModal) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl p-4 z-50 w-80">
      <div className="text-center">
        <h3 className="text-lg font-bold">{isAudioCall ? 'Incoming Audio Call' : 'Incoming Video Call'}</h3>
        <p className="text-gray-600">{call.name} is calling you</p>
        
        <div className="flex justify-center mt-4 space-x-4">
          <button 
            onClick={handleAnswer}
            className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full"
          >
            <FaPhone />
          </button>
          <button 
            onClick={handleDecline}
            className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full"
          >
            <FaPhoneSlash />
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallNotification;
