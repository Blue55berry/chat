import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { FaSave } from 'react-icons/fa';

const ProfilePage = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const getImageUrl = (path) => {
    if (!path) return 'https://placehold.co/150';
    if (path.startsWith('http') || path.startsWith('blob:')) {
      return path;
    }
    return `http://localhost:5000${path}`;
  };

  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [bio, setBio] = useState(user.bio || '');
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || '');
  const [profilePic, setProfilePic] = useState(getImageUrl(user.profilePic));
  const [newProfilePic, setNewProfilePic] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e) => {
    setNewProfilePic(e.target.files[0]);
    setProfilePic(URL.createObjectURL(e.target.files[0])); // For instant preview
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('username', username);
    formData.append('email', email);
    formData.append('bio', bio);
    formData.append('phoneNumber', phoneNumber);
    if (newProfilePic) {
      formData.append('profilePic', newProfilePic);
    }

    try {
      const { data } = await api.put('/api/users/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      login(data); // Update user in context and session storage
      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        navigate('/'); // Automatically navigate to chat area
      }, 1200); // Show success for 1.2s before navigating
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
        <div className="flex items-center mb-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mr-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            &#8592; Back
          </button>
          <h2 className="flex-1 text-center text-3xl font-extrabold text-gray-900">
            Profile Settings
          </h2>
        </div>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-center">{error}</div>}
        {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative text-center">{success}</div>}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="flex flex-col items-center">
            <img
              src={profilePic}
              alt="Profile Pic"
              className="w-32 h-32 rounded-full object-cover mb-4 border-4 border-gray-200"
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="input rounded-md w-full p-3 border"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className='pt-4'>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="input p-3 rounded-md w-full border"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className='pt-4'>
              <label htmlFor="bio" className="sr-only">Bio</label>
              <textarea
                id="bio"
                name="bio"
                rows="3"
                className="input p-3 rounded-md w-full border"
                placeholder="Tell us about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
            <div className='pt-4'>
              <label htmlFor="phoneNumber" className="sr-only">Phone Number</label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="text"
                className="input w-full p-3 rounded-md border"
                placeholder="Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="btn btn-primary w-full flex justify-center items-center"
              disabled={loading}
            >
              {loading ? 'Updating...' : (
                <>
                  <FaSave className="mr-2" />
                  Update Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
