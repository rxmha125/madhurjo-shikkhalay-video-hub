
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Upload, Facebook, Youtube, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import AuthModal from './AuthModal';
import UploadModal from './UploadModal';
import NotificationDropdown from './NotificationDropdown';
import ProfileDropdown from './ProfileDropdown';

const Navbar = () => {
  const location = useLocation();
  const { profile } = useAuth();
  const { unreadCount } = useNotifications();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    setIsMobileMenuOpen(false);
    
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
        <div className="container-responsive">
          <div className="flex justify-between items-center h-16">
            {/* Left Section */}
            <div className="flex items-center space-x-3 sm:space-x-6">
              <Link 
                to="/" 
                className="brand-font text-lg sm:text-xl xl:text-2xl text-white glow-hover transition-all duration-300"
              >
                Ma Madhurjo Shikkhalay
              </Link>
              
              {/* Desktop Social Links */}
              <div className="hidden md:flex items-center space-x-4">
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
            </div>

            {/* Center Section - Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-6">
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
            <div className="flex items-center space-x-2 sm:space-x-4">
              {profile && (
                <>
                  {/* Notifications */}
                  <div className="relative">
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="relative p-2 text-gray-300 hover:text-white transition-all duration-300 rounded-lg hover:bg-white/10 hover:scale-110"
                    >
                      <Bell size={18} />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
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
                    className="p-2 text-gray-300 hover:text-white transition-all duration-300 rounded-lg hover:bg-white/10 hover:scale-110"
                  >
                    <Upload size={18} />
                  </button>
                </>
              )}

              {profile ? (
                <div className="flex items-center space-x-2 sm:space-x-3">
                  {/* Sir's Profile Button (only for non-admin users) */}
                  {!profile.is_admin && (
                    <Link 
                      to="/info" 
                      className="btn-secondary text-xs sm:text-sm hidden sm:block"
                    >
                      Sir's Profile
                    </Link>
                  )}
                  
                  {/* Profile Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowProfile(!showProfile)}
                      className="flex items-center space-x-2 p-1 rounded-lg hover:bg-white/10 transition-all duration-300 hover:scale-105"
                    >
                      <img
                        src={profile.avatar || '/lovable-uploads/824dd225-357b-421b-af65-b70d6610c554.png'}
                        alt={profile.name}
                        className="w-8 h-8 rounded-full object-cover border-2 border-transparent hover:border-blue-500/50 transition-all duration-300"
                      />
                      <span className="text-white text-sm font-medium hidden sm:block max-w-24 truncate">
                        {profile.name}
                      </span>
                    </button>
                    <ProfileDropdown 
                      isOpen={showProfile} 
                      onClose={() => setShowProfile(false)} 
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="btn-secondary text-xs sm:text-sm"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="btn-primary text-xs sm:text-sm"
                  >
                    Sign Up
                  </button>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-white/10"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-white/10 animate-fade-in">
              <div className="flex flex-col space-y-2">
                <button 
                  onClick={() => scrollToSection('hero')}
                  className="nav-link text-left"
                >
                  Home
                </button>
                
                <button 
                  onClick={() => scrollToSection('explore')}
                  className="nav-link text-left"
                >
                  Explore
                </button>
                
                <Link 
                  to="/info" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="nav-link text-left"
                >
                  Info
                </Link>

                {/* Mobile Social Links */}
                <div className="pt-4 border-t border-white/10 md:hidden">
                  <div className="flex space-x-4">
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
                </div>
              </div>
            </div>
          )}
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
