import React, { useState } from "react";
import { useVideoCall } from "../context/VideoCallContext";
import {
  FaPhoneSlash,
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
} from "react-icons/fa";

const VideoCallModal = () => {
  const {
    call,
    callAccepted,
    callEnded,
    stream,
    endCall,
  } = useVideoCall();

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

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

  const toggleCamera = () => {
    if (stream) {
      stream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff(!isCameraOff);
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <div className="flex justify-center gap-4 mt-4 bg-gray-800 p-4 rounded-lg">
            <button
              onClick={toggleMute}
              className={`${isMuted ? "bg-gray-600" : "bg-blue-500 hover:bg-blue-600"} text-white p-4 rounded-full`}>
              {isMuted ? <FaMicrophoneSlash className="text-xl" /> : <FaMicrophone className="text-xl" />}
            </button>
            <button
              onClick={() => endCall(stream)}
              className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full">
              <FaPhoneSlash className="text-xl" />
            </button>
            <button
              onClick={toggleCamera}
              className={`${isCameraOff ? "bg-gray-600" : "bg-blue-500 hover:bg-blue-600"} text-white p-4 rounded-full`}>
              {isCameraOff ? <FaVideoSlash className="text-xl" /> : <FaVideo className="text-xl" />}
            </button>
        </div>
    </div>
  );
};

export default VideoCallModal;
