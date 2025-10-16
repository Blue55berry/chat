import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { FaBell } from 'react-icons/fa';

const Notification = () => {
  const { notifications, setNotifications, setSelectedChat } = useChat();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleNotificationClick = (notification) => {
    setSelectedChat(notification.chat);
    setNotifications(notifications.filter(n => n !== notification));
    setShowNotifications(false);
  };

  return (
    <div className="relative">
      <div 
        className="cursor-pointer"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <FaBell className="text-xl" />
        {notifications.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
            {notifications.length}
          </span>
        )}
      </div>
      
      {showNotifications && notifications.length > 0 && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-10">
          <div className="py-1">
            <div className="px-4 py-2 text-sm text-gray-700 border-b">
              Notifications
            </div>
            {notifications.map((notification, index) => (
              <div 
                key={index} 
                onClick={() => handleNotificationClick(notification)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <p className="font-bold">{notification.sender.username}</p>
                <p className="truncate">{notification.content || "Sent an attachment"}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notification;
