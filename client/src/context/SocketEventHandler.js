
import { useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { useChat } from './ChatContext';

const SocketEventHandler = () => {
  const socket = useSocket();
  const { user, login } = useAuth();
  const { setChats, setSelectedChat } = useChat();

  useEffect(() => {
    if (!socket) return;

    const handleProfileUpdate = (data) => {
      const { userId, ...updatedData } = data;
      if (!userId || Object.keys(updatedData).length === 0) return;

      // Update AuthContext if it's the current user
      if (user && user._id === userId) {
        const updatedUser = { ...user, ...updatedData };
        login(updatedUser);
      }

      // Function to update a user within a chat object
      const updateUserInChat = (chat) => {
        if (!chat || !chat.users) return chat;
        const userIndex = chat.users.findIndex(u => u && u._id === userId);
        if (userIndex > -1) {
          const updatedUsers = [...chat.users];
          updatedUsers[userIndex] = { ...updatedUsers[userIndex], ...updatedData };
          return { ...chat, users: updatedUsers };
        }
        return chat;
      };

      setChats(prevChats => prevChats.map(updateUserInChat));
      setSelectedChat(prevSelectedChat => updateUserInChat(prevSelectedChat));
    };

    socket.on('profile_updated', handleProfileUpdate);

    return () => {
      socket.off('profile_updated', handleProfileUpdate);
    };
  }, [socket, user, login, setChats, setSelectedChat]);

  return null;
};

export default SocketEventHandler;
