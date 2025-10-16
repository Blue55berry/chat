// CameraTest.js
import React, { useEffect, useRef, useState } from 'react';

const CameraTest = () => {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const [stream, setStream] = useState(null);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      console.log("Got media stream:", mediaStream);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Camera Test</h1>
      
      <div className="mb-4 bg-gray-200 rounded overflow-hidden" style={{width: '640px', height: '480px'}}>
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          style={{width: '100%', height: '100%'}}
        />
      </div>
      
      <div className="flex gap-4 mb-4">
        <button 
          onClick={startCamera} 
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Start Camera
        </button>
        <button 
          onClick={stopCamera} 
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Stop Camera
        </button>
      </div>
      
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}
      
      {stream && (
        <div className="p-4 bg-green-100 text-green-700 rounded">
          <p>Camera active: {stream.getVideoTracks()[0]?.label}</p>
          <p>Microphone active: {stream.getAudioTracks()[0]?.label}</p>
        </div>
      )}
    </div>
  );
};

export default CameraTest;
