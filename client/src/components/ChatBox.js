import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useVideoCall } from '../context/VideoCallContext';
import { useAudioCall } from '../context/AudioCallContext';
import api from '../utils/api';
import { FaPaperPlane, FaArrowLeft, FaPaperclip, FaFile, FaImage, FaTimes, FaPhoneAlt, FaVideo, FaMicrophone } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import GroupChatInfoModal from './GroupChatInfoModal';

let selectedChatCompare;

const ChatBox = () => {
  const { user } = useAuth();
  const { selectedChat, setSelectedChat, notifications = [], setNotifications, chats = [], setChats } = useChat();
  const socket = useSocket();
  const { callUser: callUserForVideo } = useVideoCall();
  const { callUser: callUserForAudio } = useAudioCall();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isGroupInfoModalOpen, setIsGroupInfoModalOpen] = useState(false);
  const messageEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const getImageUrl = (path) => {
    if (!path) return 'https://placehold.co/150';
    if (path.startsWith('http') || path.startsWith('blob:')) {
      return path;
    }
    return `http://localhost:5000${path}`;
  };

  useEffect(() => {
    if (!socket) return;

    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));

  }, [socket, user]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages();
      selectedChatCompare = selectedChat;
    }
    
    return () => {
      selectedChatCompare = null;
    };
  }, [selectedChat]);

  useEffect(() => {
    if (!socket) return;
    
    socket.on("message received", (newMessageReceived) => {
      if (!selectedChatCompare || selectedChatCompare._id !== newMessageReceived.chat._id) {
        if (setNotifications && Array.isArray(notifications) && !notifications.includes(newMessageReceived)) {
          setNotifications([newMessageReceived, ...notifications]);
          
          if (setChats && Array.isArray(chats)) {
            const updatedChats = chats.map(chat => 
              chat._id === newMessageReceived.chat._id 
                ? { ...chat, latestMessage: newMessageReceived }
                : chat
            );
            setChats(updatedChats);
          }
        }
      } else {
        setMessages(prev => [...prev, newMessageReceived]);
      }
    });
  }, [socket, selectedChatCompare, messages, notifications, chats, setNotifications, setChats]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    if (!selectedChat) return;

    try {
      setLoading(true);
      const { data } = await api.get(`/api/message/${selectedChat._id}`);
      setMessages(data || []);
      
      socket.emit("join chat", selectedChat._id);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setUploadedFiles([...uploadedFiles, ...files]);
    }
  };

  const removeFile = (index) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === "" && uploadedFiles.length === 0) return;
    
    socket.emit("stop typing", selectedChat._id);
    
    try {
      const formData = new FormData();
      formData.append("content", newMessage);
      formData.append("chatId", selectedChat._id);
      
      uploadedFiles.forEach(file => {
        formData.append("files", file);
      });
      
      setNewMessage("");
      setUploadedFiles([]);
      
      const { data } = await api.post("/api/message", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      socket.emit("new message", data);
      setMessages([...messages, data]);
      
      if (setChats && Array.isArray(chats)) {
        const updatedChats = chats.map(chat => 
          chat._id === selectedChat._id 
            ? { ...chat, latestMessage: data }
            : chat
        );
        setChats(updatedChats);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }

    let lastTypingTime = new Date().getTime();
    const timerLength = 3000;
    
    setTimeout(() => {
      const timeNow = new Date().getTime();
      const timeDiff = timeNow - lastTypingTime;
      
      if (timeDiff >= timerLength && typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  const handleVoiceRecording = async () => {
    if (isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        setMediaRecorder(recorder);
        recorder.start();

        const audioChunks = [];
        recorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        recorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const audioFile = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' });
          setUploadedFiles([audioFile]);
          stream.getTracks().forEach(track => track.stop());
        };

        setIsRecording(true);
      } catch (error) {
        console.error("Error accessing microphone:", error);
      }
    }
  };

  const getFileIcon = (mimetype) => {
    if (mimetype && mimetype.startsWith('image/')) return <FaImage className="text-blue-500" />;
    if (mimetype && mimetype.startsWith('audio/')) return <FaMicrophone className="text-purple-500" />;
    return <FaFile className="text-gray-500" />;
  };

  const getFilePreview = (file) => {
    if ((file.mimetype && file.mimetype.startsWith('image/')) || 
        (file.type && file.type.startsWith('image/'))) {
      return (
        <img 
          src={file.path || URL.createObjectURL(file)} 
          alt={file.originalname || file.name} 
          className="max-w-[200px] max-h-[200px] rounded-md"
        />
      );
    }

    if ((file.mimetype && file.mimetype.startsWith('audio/')) ||
        (file.type && file.type.startsWith('audio/'))) {
        return (
            <div className="flex items-center p-2 bg-gray-100 rounded-md">
                <FaMicrophone className="text-purple-500" />
                <span className="ml-2 text-sm truncate max-w-[150px]">
                    {file.originalname || file.name}
                </span>
            </div>
        );
    }
    
    return (
      <div className="flex items-center p-2 bg-gray-100 rounded-md">
        {getFileIcon(file.mimetype || file.type)}
        <span className="ml-2 text-sm truncate max-w-[150px]">
          {file.originalname || file.name}
        </span>
      </div>
    );
  };

  const getChatName = (chat) => {
    if (!chat || !chat.users) return "";
    
    try {
      const otherUser = chat.users.find(u => u && user && u._id !== user._id);
      return !chat.isGroupChat 
        ? (otherUser && otherUser.username) || "User"
        : chat.chatName || "Group Chat";
    } catch (error) {
      return "Chat";
    }
  };

  const getChatImage = (chat) => {
    if (!chat || !chat.users) return "";
    const defaultImg = "https://placehold.co/150";
    
    try {
      const otherUser = chat.users.find(u => u && user && u._id !== user._id);
      return !chat.isGroupChat 
        ? getImageUrl((otherUser && otherUser.profilePic) || defaultImg)
        : "https://placehold.co/150";
    } catch (error) {
      return defaultImg;
    }
  };

  const handleVideoCall = () => {
    const otherUser = selectedChat.users.find(u => u && user && u._id !== user._id);
    if (otherUser) {
      callUserForVideo(otherUser._id);
    }
  };

  const handleAudioCall = () => {
    const otherUser = selectedChat.users.find(u => u && user && u._id !== user._id);
    if (otherUser) {
      callUserForAudio(otherUser);
    }
  };

  return (
    <div className="flex flex-col h-full bg-green-800 rounded-lg shadow-md">
      {selectedChat ? (
        <>
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center">
              <button 
                className="md:hidden mr-2 text-gray-500"
                onClick={() => setSelectedChat(null)}
              >
                <FaArrowLeft />
              </button>
              
              {selectedChat.isGroupChat ? (
                <img 
                  src={getChatImage(selectedChat)} 
                  alt={getChatName(selectedChat)} 
                  className="w-10 h-10 rounded-full mr-3 cursor-pointer"
                  onClick={() => setIsGroupInfoModalOpen(true)}
                />
              ) : (
                <Link to={`/user/${selectedChat.users.find(u => u && user && u._id !== user._id)?._id}`}>
                  <img 
                    src={getChatImage(selectedChat)} 
                    alt={getChatName(selectedChat)} 
                    className="w-10 h-10 rounded-full mr-3"
                    onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/150"; }}
                  />
                </Link>
              )}

              <div 
                onClick={() => selectedChat.isGroupChat && setIsGroupInfoModalOpen(true)}
                className={selectedChat.isGroupChat ? 'cursor-pointer' : ''}
              >
                {selectedChat.isGroupChat ? (
                    <h2 className="text-xl font-extrabold tracking-wide text-white">{getChatName(selectedChat)}</h2>
                ) : (
                    <Link to={`/user/${selectedChat.users.find(u => u && user && u._id !== user._id)?._id}`}>
                        <h2 className="text-xl font-extrabold tracking-wide text-white">{getChatName(selectedChat)}</h2>
                    </Link>
                )}

                {!selectedChat.isGroupChat && selectedChat.users.find(u => u && user && u._id !== user._id)?.bio && (
                  <p className="text-sm text-gray-500">
                    {selectedChat.users.find(u => u && user && u._id !== user._id).bio}
                  </p>
                )}
                {selectedChat.isGroupChat && selectedChat.users && (
                  <p className="text-md text-gray-500">
                    {selectedChat.users.length} members
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {selectedChat.isGroupChat ? (
                <button onClick={() => alert('Group video calls are not yet supported.')} className="p-2 text-white hover:bg-gray-700 rounded-full">
                    <FaVideo />
                </button>
              ) : (
                <>
                  <button onClick={handleAudioCall} className="p-2 text-white hover:bg-gray-700 rounded-full">
                    <FaPhoneAlt />
                  </button>
                  <button onClick={handleVideoCall} className="p-2 text-white hover:bg-gray-700 rounded-full">
                    <FaVideo />
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div className="overflow-y-auto p-4 bg-gray-50" style={{height: "65vh"}}>
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <p>Loading messages...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages && messages.length > 0 ? (
                  messages.map((msg, index) => {
                    const isMyMessage = msg.sender && user && msg.sender._id === user._id;
                    const showAvatarAndName = !isMyMessage && (index === 0 || messages[index - 1].sender._id !== msg.sender._id);

                    return (
                      <div 
                        key={index}
                        className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                        <div className="w-8 h-8 mr-2 self-end flex-shrink-0">
                          {!isMyMessage && (
                            <img 
                              src={getImageUrl(msg.sender.profilePic)} 
                              alt={msg.sender.username || "User"} 
                              className={`w-8 h-8 rounded-full ${showAvatarAndName ? 'visible' : 'invisible'}`}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://placehold.co/150";
                              }}
                            />
                          )}
                        </div>
                        <div 
                          className={`max-w-[70%] p-3 rounded-lg bg-green-400 ${
                            isMyMessage 
                              ? 'bg-primary text-black rounded-br-none' 
                              : 'bg-gray-200 text-dark rounded-bl-none'
                          }`}
                        >
                          {showAvatarAndName && (
                            <p className="text-xs font-bold mb-1">
                              {msg.sender.username || "User"}
                            </p>
                          )}
                          {msg.content && <p>{msg.content}</p>}
                          
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2 space-y-2 ">
                              {msg.attachments.map((file, i) => (
                                <div key={i} className="message-attachment">
                                  {file.mimetype && file.mimetype.startsWith('image/') ? (
                                    <a href={`http://localhost:5000${file.path}`} target="_blank" rel="noopener noreferrer">
                                      <img 
                                        src={`http://localhost:5000${file.path}`} 
                                        alt={file.originalname} 
                                        className="max-w-[200px] max-h-[200px] rounded-md"
                                      />
                                    </a>
                                  ) : file.mimetype && file.mimetype.startsWith('audio/') ? (
                                    <audio controls src={`http://localhost:5000${file.path}`} className="w-full max-w-xs" />
                                  ) : (
                                    <a 
                                      href={`http://localhost:5000${file.path}`} 
                                      download={file.originalname}
                                      className="flex items-center p-2 bg-gray-100 rounded-md text-primary"
                                    >
                                      {getFileIcon(file.mimetype)}
                                      <span className="ml-2 text-sm">
                                        {file.originalname}
                                      </span>
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <p className="text-xs mt-1 text-right opacity-70">
                            {msg.createdAt && new Date(msg.createdAt).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="flex justify-center items-center h-full text-gray-500">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                )}
                {isTyping && (
                  <div className="flex items-center">
                    <div className="bg-gray-200 p-3 rounded-lg">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messageEndRef} />
              </div>
            )}
          </div>
          
          {uploadedFiles.length > 0 && (
            <div className="p-2 border-t border-b flex flex-wrap gap-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="relative">
                  {getFilePreview(file)}
                  <button 
                    onClick={() => removeFile(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                    type="button"
                  >
                    <FaTimes size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <form onSubmit={sendMessage} className="p-4 border-t">
            <div className="flex items-center">
              <button 
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="p-2 text-gray-500 hover:text-primary"
              >
                <FaPaperclip className='text-white mr-3'/>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                className="hidden"
              />
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={typingHandler}
                className="input rounded-xl p-3  focus:z-10 flex-1"
              />
              <button
                type="button"
                onClick={handleVoiceRecording}
                className={`p-2 text-white ${isRecording ? 'text-red-500' : ''}`}>
                <FaMicrophone />
              </button>
              <button 
                type="submit"
                className="btn btn-primary text-white rounded-l-none h-[42px] px-4"
              >
                <FaPaperPlane />
              </button>
            </div>
          </form>

          {selectedChat.isGroupChat && (
            <GroupChatInfoModal 
              isOpen={isGroupInfoModalOpen}
              onClose={() => setIsGroupInfoModalOpen(false)}
              chat={selectedChat}
            />
          )}
        </>
      ) : (
        <div className="flex flex-col justify-center items-center h-full text-gray-500">
          <img 
            src="https://img.icons8.com/bubbles/100/000000/chat.png" 
            alt="Chat" 
            className="w-24 h-24 mb-4 opacity-50"
          />
          <p className="text-xl font-medium">Select a chat to start messaging</p>
        </div>
      )}
    </div>
  );
};

export default ChatBox;