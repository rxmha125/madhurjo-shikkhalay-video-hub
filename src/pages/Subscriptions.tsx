
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { UserMinus, Users } from 'lucide-react';
import { useFollowSystem } from '../hooks/useFollowSystem';

interface FollowedUser {
  id: string;
  name: string;
  avatar: string;
  description: string;
  followerCount: number;
  videoCount: number;
}

const Subscriptions = () => {
  const { profile } = useAuth();
  const [followedUsers, setFollowedUsers] = useState<FollowedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      loadFollowedUsers();
    }
  }, [profile]);

  const loadFollowedUsers = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          following_id,
          profiles!follows_following_id_fkey (
            id,
            name,
            avatar,
            description
          )
        `)
        .eq('follower_id', profile.id);

      if (error) throw error;

      const followedUsersData = await Promise.all(
        data.map(async (follow) => {
          const user = follow.profiles;
          
          // Get follower count
          const { count: followerCount } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', user.id);

          // Get video count
          const { count: videoCount } = await supabase
            .from('videos')
            .select('*', { count: 'exact', head: true })
            .eq('creator_id', user.id);

          return {
            id: user.id,
            name: user.name,
            avatar: user.avatar || '/lovable-uploads/544d0b71-3b60-4f04-81da-d190b8007a11.png',
            description: user.description || 'No description available.',
            followerCount: followerCount || 0,
            videoCount: videoCount || 0
          };
        })
      );

      setFollowedUsers(followedUsersData);
    } catch (error) {
      console.error('Error loading followed users:', error);
    } finally {
      setLoading(false);
    }
  };

  const FollowedUserCard = ({ user }: { user: FollowedUser }) => {
    const { toggleFollow, isLoading } = useFollowSystem(user.id);

    const handleUnfollow = async () => {
      await toggleFollow();
      setFollowedUsers(prev => prev.filter(u => u.id !== user.id));
    };

    return (
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:bg-gray-800/70 transition-all duration-300">
        <div className="flex items-start space-x-4">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-gray-600"
          />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1">{user.name}</h3>
            <p className="text-gray-400 text-sm mb-3 line-clamp-2">{user.description}</p>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
              <span>{user.followerCount} followers</span>
              <span>{user.videoCount} videos</span>
            </div>

            <button
              onClick={handleUnfollow}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded-lg transition-all duration-300"
            >
              <UserMinus size={16} />
              <span>{isLoading ? 'Unfollowing...' : 'Unfollow'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please Log In</h1>
          <p className="text-gray-400">You need to be logged in to view your subscriptions.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <Users className="text-blue-500" size={32} />
          <h1 className="text-3xl font-bold text-white">My Subscriptions</h1>
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            {followedUsers.length}
          </span>
        </div>

        {followedUsers.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">👥</div>
            <h2 className="text-2xl font-bold text-white mb-4">No Subscriptions Yet</h2>
            <p className="text-gray-400">
              Start following creators to see them here and get notified about their new videos!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {followedUsers.map((user) => (
              <FollowedUserCard key={user.id} user={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscriptions;
