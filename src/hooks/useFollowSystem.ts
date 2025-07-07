
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

export const useFollowSystem = (targetUserId?: string) => {
  const { profile } = useAuth();
  const { addNotification } = useNotifications();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (targetUserId) {
      checkFollowStatus();
      loadFollowerCount();
    }
  }, [targetUserId, profile]);

  const checkFollowStatus = async () => {
    if (!profile || !targetUserId) return;

    try {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', profile.id)
        .eq('following_id', targetUserId)
        .single();

      setIsFollowing(!!data);
    } catch (error) {
      setIsFollowing(false);
    }
  };

  const loadFollowerCount = async () => {
    if (!targetUserId) return;

    try {
      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', targetUserId);

      if (error) throw error;
      setFollowerCount(count || 0);
    } catch (error) {
      console.error('Error loading follower count:', error);
    }
  };

  const toggleFollow = async () => {
    if (!profile || !targetUserId || isLoading) return;

    setIsLoading(true);

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', profile.id)
          .eq('following_id', targetUserId);

        if (error) throw error;
        setIsFollowing(false);
        setFollowerCount(prev => prev - 1);
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: profile.id,
            following_id: targetUserId
          });

        if (error) throw error;
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);

        // Add notification for the followed user
        await addNotification({
          user_id: targetUserId,
          type: 'follow',
          title: 'New Follower',
          content: `${profile.name} started following you`
        });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isFollowing,
    followerCount,
    isLoading,
    toggleFollow
  };
};
