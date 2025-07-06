
import React from 'react';
import { Check, Clock, Heart, MessageCircle, Upload } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const { user } = useAuth();

  if (!isOpen) return null;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart size={16} className="text-red-400" />;
      case 'comment':
        return <MessageCircle size={16} className="text-blue-400" />;
      case 'upload_review':
        return <Upload size={16} className="text-yellow-400" />;
      default:
        return <Clock size={16} className="text-gray-400" />;
    }
  };

  const handleApproval = (notificationId: string, approved: boolean) => {
    // Handle video approval/rejection
    markAsRead(notificationId);
    // In real app, this would make API call to approve/reject video
    console.log(`Video ${approved ? 'approved' : 'rejected'}`);
  };

  return (
    <div className="absolute top-12 right-0 w-80 rounded-card shadow-xl z-50 max-h-96 overflow-hidden">
      <div className="p-4 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-white">Notifications</h3>
          {notifications.some(n => !n.read) && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="overflow-y-auto max-h-80">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            <Clock size={32} className="mx-auto mb-2 opacity-50" />
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification._id}
              className={`p-4 border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors ${
                !notification.read ? 'bg-blue-500/5 border-l-2 border-l-blue-500' : ''
              }`}
              onClick={() => markAsRead(notification._id)}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </p>

                  {/* Admin Review Actions */}
                  {notification.type === 'upload_review' && user?.isAdmin && !notification.read && (
                    <div className="flex items-center space-x-2 mt-3">
                      {notification.data?.thumbnail && (
                        <img
                          src={notification.data.thumbnail}
                          alt="Video thumbnail"
                          className="w-16 h-9 object-cover rounded"
                        />
                      )}
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApproval(notification._id, true);
                          }}
                          className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApproval(notification._id, false);
                          }}
                          className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {!notification.read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
