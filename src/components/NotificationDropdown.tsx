
import React from 'react';
import { Check, Clock, Heart, MessageCircle, Upload } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();

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

  return (
    <div className="absolute top-12 right-0 w-80 max-w-[calc(100vw-2rem)] bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
      <div className="p-4 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-white">Notifications</h3>
          {notifications.some(n => !n.is_read) && (
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
              key={notification.id}
              className={`p-4 border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors cursor-pointer ${
                !notification.is_read ? 'bg-blue-500/5 border-l-2 border-l-blue-500' : ''
              }`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white mb-1">
                    {notification.title}
                  </p>
                  <p className="text-sm text-gray-300 break-words">
                    {notification.content}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notification.created_at).toLocaleDateString()}
                  </p>
                </div>

                {!notification.is_read && (
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
