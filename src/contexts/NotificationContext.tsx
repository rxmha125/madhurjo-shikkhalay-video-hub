
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface Notification {
  _id: string;
  type: 'like' | 'comment' | 'upload_review' | 'follow';
  message: string;
  read: boolean;
  createdAt: Date;
  data?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, '_id' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Load notifications from localStorage
      const saved = localStorage.getItem(`notifications_${user._id}`);
      if (saved) {
        const parsed = JSON.parse(saved).map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt)
        }));
        setNotifications(parsed);
      }
    }
  }, [user]);

  const saveNotifications = (notifs: Notification[]) => {
    if (user) {
      localStorage.setItem(`notifications_${user._id}`, JSON.stringify(notifs));
    }
  };

  const addNotification = (notification: Omit<Notification, '_id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      _id: Date.now().toString(),
      createdAt: new Date()
    };
    
    const updated = [newNotification, ...notifications];
    setNotifications(updated);
    saveNotifications(updated);
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map(n => 
      n._id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    saveNotifications(updated);
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    saveNotifications(updated);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
