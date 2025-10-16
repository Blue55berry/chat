import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaSignOutAlt, FaUser, FaComment } from 'react-icons/fa';

const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getImageUrl = (path) => {
    if (!path) return 'https://placehold.co/150';
    if (path.startsWith('http') || path.startsWith('blob:')) {
      return path;
    }
    return `http://localhost:5000${path}`;
  };

  const handleLogout = () => {
    try {
      // Simple synchronous logout
      logout();
      // Navigate to login page
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
      // Simple alert for errors
      alert("Failed to logout. Please try again.");
    }
  };

  return (
    <nav className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-xl font-bold flex items-center text-black">
            <FaComment className="mr-2 text-black" />
            ChatApp
          </Link>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Remove Notification component if it's causing errors */}
                <div className="flex items-center">
                  <Link to="/profile" className="flex items-center">
                    <img 
                      src={getImageUrl(user.profilePic)}
                      alt={user.username || "User"} 
                      className="w-8 h-8 rounded-full object-cover mr-2 bg-red-400"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/150";
                      }}
                    />
                    <span className='text-black font-md font-serif hover:bg-gray-300 p-3 rounded-lg '>{user.username || "User"}</span>
                  </Link>
                </div>
                <button 
                  onClick={handleLogout}
                  className="text-black hover:text-green-500 flex items-center"
                >
                  <FaSignOutAlt className="mr-1" /> Logout
                </button>
              </>
            ) : (
              <div className="flex space-x-4">
                <Link to="/login" className="text-white hover:text-gray-200 flex items-center">
                  <FaUser className="mr-1" /> Login
                </Link>
                <Link to="/register" className="btn btn-primary bg-white text-primary hover:bg-gray-100">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;