// src/components/GroupChatModal.js
import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { FaTimes } from 'react-icons/fa';

const GroupChatModal = ({ isOpen, onClose }) => {
  const [groupChatName, setGroupChatName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const { setChats } = useChat();
  const { user } = useAuth();

  if (!isOpen) return null;

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.get(`/api/users?search=${query}`);
      setSearchResults(data);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = (userToAdd) => {
    if (selectedUsers.find(u => u._id === userToAdd._id)) return;
    setSelectedUsers([...selectedUsers, userToAdd]);
  };

  const handleRemoveUser = (userToRemove) => {
    setSelectedUsers(selectedUsers.filter(sel => sel._id !== userToRemove._id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!groupChatName || selectedUsers.length < 2) {
      alert("Please enter a group name and select at least 2 users");
      return;
    }

    try {
      const { data } = await api.post('/api/chat/group', {
        name: groupChatName,
        users: JSON.stringify(selectedUsers.map(u => u._id)),
      });

      setChats(prevChats => [data, ...prevChats]);
      onClose();
      
      // Reset state
      setGroupChatName('');
      setSelectedUsers([]);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error("Error creating group chat:", error);
      alert("Failed to create the group chat");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-semibold">Create Group Chat</h3>
          <button onClick={onClose} className="text-gray-500">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="block mb-2">Group Chat Name</label>
            <input
              type="text"
              value={groupChatName}
              onChange={(e) => setGroupChatName(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter a name for your group"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2">Add Users</label>
            <input
              type="text"
              placeholder="Search users..."
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Selected Users */}
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedUsers.map(user => (
              <div key={user._id} className="bg-blue-100 px-2 py-1 rounded-md flex items-center gap-1">
                <span>{user.username}</span>
                <button type="button" onClick={() => handleRemoveUser(user)}>
                  <FaTimes className="text-xs" />
                </button>
              </div>
            ))}
          </div>

          {/* Search Results */}
          {searchQuery && (
            <div className="mb-4 max-h-40 overflow-y-auto border rounded">
              {searchResults.map(user => (
                <div 
                  key={user._id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleAddUser(user)}
                >
                  {user.username}
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create Group Chat
          </button>
        </form>
      </div>
    </div>
  );
};

export default GroupChatModal;
