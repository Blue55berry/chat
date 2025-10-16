import React, { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { FaTimes, FaUserPlus, FaPen, FaTrash } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const GroupChatInfoModal = ({ isOpen, onClose, chat }) => {
  const [groupName, setGroupName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const { setSelectedChat, setChats } = useChat();

  const getImageUrl = (path) => {
    if (!path) return 'https://placehold.co/150';
    if (path.startsWith('http') || path.startsWith('blob:')) {
      return path;
    }
    return `http://localhost:5000${path}`;
  };
  
  useEffect(() => {
    if (chat) {
      setGroupName(chat.chatName);
    }
  }, [chat]);
  
  if (!isOpen || !chat) return null;
  
  const isAdmin = chat.groupAdmin && chat.groupAdmin._id === user._id;
  
  const handleRename = async () => {
    if (!groupName) return;
    
    try {
      setLoading(true);
      const { data } = await api.put('/api/chat/rename', {
        chatId: chat._id,
        chatName: groupName
      });
      
      // Update chat list and selected chat
      setChats(prev => prev.map(c => c._id === data._id ? data : c));
      setSelectedChat(data);
      setIsRenaming(false);
    } catch (error) {
      console.error("Error renaming group:", error);
      alert("Failed to rename the group");
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query) {
      setSearchResults([]);
      return;
    }
    
    try {
      setLoading(true);
      const { data } = await api.get(`/api/users?search=${query}`);
      
      const filteredResults = data.filter(
        searchUser => !chat.users.some(u => u._id === searchUser._id)
      );
      
      setSearchResults(filteredResults);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddUser = async (userToAdd) => {
    if (chat.users.find(u => u._id === userToAdd._id)) {
      alert("User already in the group");
      return;
    }
    
    if (!isAdmin) {
      alert("Only admins can add users");
      return;
    }
    
    try {
      setLoading(true);
      const { data } = await api.put('/api/chat/groupadd', {
        chatId: chat._id,
        userId: userToAdd._id
      });
      
      setChats(prev => prev.map(c => c._id === data._id ? data : c));
      setSelectedChat(data);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error("Error adding user to group:", error);
      alert("Failed to add user to group");
    } finally {
      setLoading(false);
    }
  };
  
  const handleRemoveUser = async (userToRemove) => {
    if (!isAdmin && userToRemove._id !== user._id) {
      alert("Only admins can remove other users");
      return;
    }
    
    try {
      setLoading(true);
      const { data } = await api.put('/api/chat/groupremove', {
        chatId: chat._id,
        userId: userToRemove._id
      });
      
      if (userToRemove._id === user._id) {
        setSelectedChat(null);
      } else {
        setSelectedChat(data);
      }
      
      setChats(prev => prev.map(c => c._id === data._id ? data : c));
    } catch (error) {
      console.error("Error removing user from group:", error);
      alert("Failed to remove user from group");
    } finally {
      setLoading(false);
    }
  };
  
  const handleLeaveGroup = () => {
    handleRemoveUser({ _id: user._id });
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-semibold">Group Information</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="p-4">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-gray-700">Group Name</h4>
              {isAdmin && (
                <button 
                  onClick={() => setIsRenaming(!isRenaming)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <FaPen />
                </button>
              )}
            </div>
            
            {isRenaming ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="flex-1 p-2 border rounded-md"
                />
                <button 
                  onClick={handleRename}
                  className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600"
                  disabled={loading}
                >
                  Save
                </button>
              </div>
            ) : (
              <p className="p-2 bg-gray-100 rounded-md">{chat.chatName}</p>
            )}
          </div>
          
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-2">{chat.users.length} Members</h4>
            <div className="max-h-48 overflow-y-auto border rounded-md">
              {chat.users.map(groupUser => (
                <div 
                  key={groupUser._id} 
                  className="p-2 flex items-center justify-between border-b last:border-0 hover:bg-gray-50"
                >
                  <Link to={`/user/${groupUser._id}`} className="flex items-center flex-grow" onClick={onClose}>
                    <div className="w-10 h-10 bg-gray-200 rounded-full mr-3 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      <img src={getImageUrl(groupUser.profilePic)} alt={groupUser.username} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow">
                      <p className="font-medium">{groupUser.username}</p>
                      <p className="text-sm text-gray-600">{groupUser.email}</p>
                    </div>
                  </Link>
                  <div className="text-sm text-gray-500 mr-4 flex-shrink-0">
                    {chat.groupAdmin?._id === groupUser._id && "Admin"}
                  </div>
                  {(isAdmin && user._id !== groupUser._id) && (
                    <button 
                      onClick={() => handleRemoveUser(groupUser)}
                      className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 flex-shrink-0"
                      disabled={loading}
                      title="Remove user"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {isAdmin && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Add Users</h4>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search users to add..."
                className="w-full p-2 border rounded-md mb-2"
              />
              
              {searchQuery && (
                <div className="max-h-40 overflow-y-auto border rounded-md">
                  {loading ? (
                    <div className="p-2 text-center">Loading...</div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map(searchUser => (
                      <div 
                        key={searchUser._id} 
                        className="p-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-200 rounded-full mr-2 flex items-center justify-center overflow-hidden">
                            {searchUser.profilePic ? (
                              <img src={getImageUrl(searchUser.profilePic)} alt={searchUser.username} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs">{searchUser.username.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{searchUser.username}</p>
                            <p className="text-xs text-gray-500">{searchUser.email}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleAddUser(searchUser)}
                          className="text-blue-500 hover:text-blue-700"
                          disabled={loading}
                        >
                          <FaUserPlus />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-center text-gray-500">No users found</div>
                  )}
                </div>
              )}
            </div>
          )}
          
          <button
            onClick={handleLeaveGroup}
            className="w-full p-2 bg-red-500 text-white rounded-md hover:bg-red-600 mt-4"
            disabled={loading}
          >
            Leave Group
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupChatInfoModal;
