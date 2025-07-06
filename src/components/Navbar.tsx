
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Upload, Facebook, Youtube } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import AuthModal from './AuthModal';
import UploadModal from './UploadModal';
import NotificationDropdown from './NotificationDropdown';
import ProfileDropdown from './ProfileDropdown';

const Navbar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const scrollToSection = (sectionId: string) => {
    if (location.pathname !== '/') {
      window.location.href = `/?section=${sectionId}`;
      return;
    }
    
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left Section */}
            <div className="flex items-center space-x-6">
              <Link to="/" className="font-orbitron font-bold text-xl text-white glow-hover">
                Ma Madhurjo Shikkhalay
              </Link>
              
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="nav-link flex items-center space-x-2"
              >
                <Facebook size={16} />
                <span>Facebook</span>
              </a>
              
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="nav-link flex items-center space-x-2"
              >
                <Youtube size={16} />
                <span>YouTube</span>
              </a>
            </div>

            {/* Center Section */}
            <div className="hidden md:flex items-center space-x-6">
              <button 
                onClick={() => scrollToSection('hero')}
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
              >
                Home
              </button>
              
              <button 
                onClick={() => scrollToSection('explore')}
                className="nav-link"
              >
                Explore
              </button>
              
              <Link 
                to="/info" 
                className={`nav-link ${location.pathname === '/info' ? 'active' : ''}`}
              >
                Info
              </Link>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {user && (
                <>
                  {/* Notifications */}
                  <div className="relative">
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="relative p-2 text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                    >
                      <Bell size={20} />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>
                    <NotificationDropdown 
                      isOpen={showNotifications} 
                      onClose={() => setShowNotifications(false)} 
                    />
                  </div>

                  {/* Upload */}
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="p-2 text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                  >
                    <Upload size={20} />
                  </button>
                </>
              )}

              {user ? (
                <div className="flex items-center space-x-3">
                  {/* Sir's Profile Button (only for non-admin users) */}
                  {!user.isAdmin && (
                    <Link 
                      to="/info" 
                      className="btn-secondary text-sm"
                    >
                      Sir's Profile
                    </Link>
                  )}
                  
                  {/* Profile Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowProfile(!showProfile)}
                      className="flex items-center space-x-2 p-1 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <img
                        src={user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="text-white text-sm font-medium hidden sm:block">
                        {user.name}
                      </span>
                    </button>
                    <ProfileDropdown 
                      isOpen={showProfile} 
                      onClose={() => setShowProfile(false)} 
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="btn-secondary"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="btn-primary"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Modals */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
      <UploadModal 
        isOpen={showUploadModal} 
        onClose={() => setShowUploadModal(false)} 
      />
    </>
  );
};

export default Navbar;
