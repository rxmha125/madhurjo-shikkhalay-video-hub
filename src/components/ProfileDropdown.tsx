
import React from 'react';
import { Link } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  if (!isOpen || !user) return null;

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <div className="absolute top-12 right-0 w-48 rounded-card shadow-xl z-50">
      <div className="p-2">
        <Link
          to={`/profile/${user._id}`}
          onClick={onClose}
          className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
        >
          <User size={16} />
          <span>Profile</span>
        </Link>
        
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default ProfileDropdown;
