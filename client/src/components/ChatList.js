import React, { useEffect, useState } from "react";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import { useVideoCall } from '../context/VideoCallContext';
import { useAudioCall } from '../context/AudioCallContext';
import api from "../utils/api";
import { FaSearch, FaVideo, FaUsers, FaPlus, FaPhoneAlt } from "react-icons/fa";
import { Link } from 'react-router-dom';
import GroupChatModal from './GroupChatModal';

const ChatList = () => {
  const { selectedChat, setSelectedChat, chats, setChats } = useChat();
  const { user } = useAuth();
  const { callUser: callUserForVideo } = useVideoCall();
  const { callUser: callUserForAudio } = useAudioCall();
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isGroupChatModalOpen, setIsGroupChatModalOpen] = useState(false);
  
  // Mock online status data instead of using the context that's causing errors
  const [onlineUsers] = useState({});

  const getImageUrl = (path) => {
    if (!path) return 'https://placehold.co/150';
    if (path.startsWith('http') || path.startsWith('blob:')) {
      return path;
    }
    return `http://localhost:5000${path}`;
  };

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/chat");
      setChats(data);
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!search) return;
    try {
      setLoading(true);
      const { data } = await api.get(`/api/users?search=${search}`);
      setSearchResults(data);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const accessChat = async (userId) => {
    try {
      setLoading(true);
      const { data } = await api.post("/api/chat", { userId });

      if (!chats.find((c) => c._id === data._id)) {
        setChats([data, ...chats]);
      }

      setSelectedChat(data);
      setSearchResults([]);
      setSearch("");
    } catch (error) {
      console.error("Error accessing chat:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to check if a user is online
  const isUserOnline = (userId) => {
    return onlineUsers[userId] === true;
  };

  // Handler for video call
  const handleVideoCall = (userId, e) => {
    e.stopPropagation(); // Prevent chat selection
    callUserForVideo(userId);
  };

  const handleAudioCall = (userToCall, e) => {
    e.stopPropagation();
    callUserForAudio(userToCall);
  };

  // Function to open group chat modal
  const openGroupChatModal = () => {
    setIsGroupChatModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-gray-300 rounded-lg shadow-md">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-bold">Chats</h2>
        
        {/* Add New Group Chat Button */}
        <button
          onClick={openGroupChatModal}
          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
          title="Create Group Chat"
        >
          <FaUsers />
        </button>
      </div>

      <div className="p-4 border-b">
        <div className="relative">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2 pr-10 border rounded-md"
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
          <button
            onClick={handleSearch}
            className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
          >
            <FaSearch />
          </button>
        </div>
      </div>

      {/* Search Results */}
      {search && searchResults.length > 0 && (
        <div className="p-4 border-b">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Search Results</h3>
          <div className="space-y-2">
            {searchResults.map((searchUser) => (
              <div
                key={searchUser._id}
                onClick={() => accessChat(searchUser._id)}
                className="flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer"
              >
                <div className="relative">
                  <img
                    src={getImageUrl(searchUser.profilePic)}
                    alt={searchUser.username}
                    className="w-8 h-8 rounded-full mr-2"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 ${
                      isUserOnline(searchUser._id) ? 'bg-green-500' : 'bg-gray-400'
                    } rounded-full border-2 border-white`}
                  ></span>
                </div>
                <div className="flex-1">
                  <Link to={`/user/${searchUser._id}`}>
                    <p className="font-medium">{searchUser.username}</p>
                  </Link>
                  {searchUser.bio && <p className="text-sm text-gray-500 truncate">{searchUser.bio}</p>}
                  <p className="text-sm text-gray-500">{searchUser.email}</p>
                </div>
                <button
                  onClick={(e) => handleAudioCall(searchUser, e)}
                  className="p-2 text-green-500 hover:bg-green-50 rounded-full"
                  title="Audio Call"
                >
                  <FaPhoneAlt />
                </button>
                <button
                  onClick={(e) => handleVideoCall(searchUser._id, e)}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-full"
                  title="Video Call"
                >
                  <FaVideo />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <p>Loading...</p>
          </div>
        ) : chats.length > 0 ? (
          <div className="space-y-2">
            {chats.map((chat) => {
              const chatUser = chat.users?.find((u) => u?._id !== user?._id) || {};
              return (
                <div
                  key={chat._id}
                  onClick={() => setSelectedChat(chat)}
                  className={`flex items-center p-3 rounded-md cursor-pointer hover:bg-black hover:text-white ${
                    selectedChat && selectedChat._id === chat._id
                      ? "bg-blue-50 border-l-4 border-blue-500"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <div className="relative">
                    <img
                      src={
                        !chat.isGroupChat
                          ? getImageUrl(chatUser.profilePic)
                          : "https://placehold.co/150"
                      }
                      alt={chat.chatName || "Chat"}
                      className="w-10 h-10 rounded-full mr-3"
                    />
                    {!chat.isGroupChat && chatUser._id && (
                      <span
                        className={`absolute bottom-0 right-3 w-3 h-3 rounded-full border-2 border-white ${
                          isUserOnline(chatUser._id) ? "bg-green-500" : "bg-gray-400"
                        }`}
                      ></span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      {!chat.isGroupChat ? (
                        <Link to={`/user/${chatUser._id}`}>{chatUser.username || "User"}</Link>
                      ) : (
                        chat.chatName || "Group Chat"
                      )}
                    </p>
                    {!chat.isGroupChat && chatUser.bio && (
                      <p className="text-sm text-gray-500 truncate">
                        {chatUser.bio}
                      </p>
                    )}
                    {chat.latestMessage && (
                      <p className="text-sm text-gray-500 truncate">
                        <span className="font-medium">
                          {chat.latestMessage.sender?.username || "User"}:
                        </span>{" "}
                        {chat.latestMessage.content || "Sent an attachment"}
                      </p>
                    )}
                  </div>
                  {!chat.isGroupChat && chatUser._id && (
                    <>
                      <button
                        onClick={(e) => handleAudioCall(chatUser, e)}
                        className="p-2 text-green-500 hover:bg-green-50 rounded-full"
                        title="Audio Call"
                      >
                        <FaPhoneAlt />
                      </button>
                      <button
                        onClick={(e) => handleVideoCall(chatUser._id, e)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-full"
                        title="Video Call"
                      >
                        <FaVideo />
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-gray-500">
            <p>No chats yet</p>
            <p className="text-sm">Search for users to start chatting</p>
            <button
              onClick={openGroupChatModal}
              className="mt-4 flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              <FaPlus /> Create Group Chat
            </button>
          </div>
        )}
      </div>

      {/* Group Chat Modal */}
      <GroupChatModal
        isOpen={isGroupChatModalOpen}
        onClose={() => setIsGroupChatModalOpen(false)}
      />
    </div>
  );
};

export default ChatList;