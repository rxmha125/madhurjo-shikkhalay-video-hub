
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
  video_id?: string;
  user_id: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'created_at' | 'is_read'>) => void;
  pendingVideosCount: number;
  refreshPendingCount: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pendingVideosCount, setPendingVideosCount] = useState(0);
  const { profile } = useAuth();

  const loadNotifications = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading notifications:', error);
        return;
      }

      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadPendingVideosCount = async () => {
    if (!profile?.is_admin) return;

    try {
      const { count, error } = await supabase
        .from('videos')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', false);

      if (error) {
        console.error('Error loading pending videos count:', error);
        return;
      }

      setPendingVideosCount(count || 0);
    } catch (error) {
      console.error('Error loading pending videos count:', error);
    }
  };

  const refreshPendingCount = () => {
    loadPendingVideosCount();
  };

  useEffect(() => {
    if (profile) {
      loadNotifications();
      loadPendingVideosCount();
    }
  }, [profile]);

  // Real-time subscription for notifications
  useEffect(() => {
    if (!profile) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`
        },
        (payload) => {
          console.log('New notification received:', payload);
          setNotifications(prev => [payload.new as Notification, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`
        },
        (payload) => {
          console.log('Notification updated:', payload);
          setNotifications(prev => 
            prev.map(notif => 
              notif.id === payload.new.id ? payload.new as Notification : notif
            )
          );
        }
      )
      .subscribe();

    // Real-time subscription for pending videos count (admin only)
    let videoChannel;
    if (profile.is_admin) {
      videoChannel = supabase
        .channel('videos')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'videos'
          },
          () => {
            loadPendingVideosCount();
          }
        )
        .subscribe();
    }

    return () => {
      supabase.removeChannel(channel);
      if (videoChannel) {
        supabase.removeChannel(videoChannel);
      }
    };
  }, [profile]);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', profile.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return;
      }

      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const addNotification = async (notification: Omit<Notification, 'id' | 'created_at' | 'is_read'>) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          ...notification,
          is_read: false
        });

      if (error) {
        console.error('Error adding notification:', error);
      }
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      addNotification,
      pendingVideosCount,
      refreshPendingCount
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
