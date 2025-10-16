import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import UserProfilePage from './pages/UserProfilePage';
import Navigation from './components/Navigation';
import SocketEventHandler from './context/SocketEventHandler';

function App() {
  return (
    <Router>
      <SocketEventHandler />
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navigation />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/user/:id" element={<UserProfilePage />} />
          </Routes>
        </main>
        {/* <footer className="py-4 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} ChatApp. All rights reserved.
        </footer> */}
      </div>
    </Router>
  );
}

export default App;
