
import React from 'react';
import { Link } from 'react-router-dom';
import { User, LogOut, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ isOpen, onClose }) => {
  const { profile, logout } = useAuth();
  const { pendingVideosCount } = useNotifications();

  if (!isOpen || !profile) return null;

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  return (
    <div className="absolute top-12 right-0 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 animate-fade-in">
      <div className="p-2">
        <Link
          to={`/profile/${profile.id}`}
          onClick={onClose}
          className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-300 hover:scale-105"
        >
          <User size={16} />
          <span>Profile</span>
        </Link>
        
        {/* Admin For Approval - Mobile */}
        {profile.is_admin && (
          <Link
            to="/admin/approvals"
            onClick={onClose}
            className="flex items-center justify-between w-full px-3 py-2 text-sm text-yellow-400 hover:text-yellow-300 hover:bg-gray-800/50 rounded-lg transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-center space-x-2">
              <Clock size={16} />
              <span>For Approval</span>
            </div>
            {pendingVideosCount > 0 && (
              <span className="bg-yellow-600 text-white text-xs px-2 py-1 rounded-full">
                {pendingVideosCount}
              </span>
            )}
          </Link>
        )}
        
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-300 hover:scale-105"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default ProfileDropdown;
