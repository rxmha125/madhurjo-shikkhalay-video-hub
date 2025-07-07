
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Clock, Check, X } from 'lucide-react';

interface PendingVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  created_at: string;
  creator: {
    id: string;
    name: string;
    avatar: string;
  };
}

const AdminApprovals = () => {
  const { profile } = useAuth();
  const { refreshPendingCount } = useNotifications();
  const [pendingVideos, setPendingVideos] = useState<PendingVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingVideos, setProcessingVideos] = useState<string[]>([]);

  useEffect(() => {
    if (profile?.is_admin) {
      loadPendingVideos();
    }
  }, [profile]);

  const loadPendingVideos = async () => {
    console.log('Loading pending videos from videos_for_approval table...');
    try {
      const { data, error } = await supabase
        .from('videos_for_approval')
        .select(`
          *,
          creator:profiles!videos_for_approval_creator_id_fkey(id, name, avatar)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading pending videos:', error);
        toast.error('Failed to load pending videos');
        return;
      }

      console.log('Raw pending videos data:', data);

      const formattedVideos = data?.map(video => ({
        id: video.id,
        title: video.title,
        description: video.description || '',
        thumbnail: video.thumbnail || '/lovable-uploads/544d0b71-3b60-4f04-81da-d190b8007a11.png',
        created_at: video.created_at,
        creator: {
          id: video.creator?.id || '',
          name: video.creator?.name || 'Unknown',
          avatar: video.creator?.avatar || '/lovable-uploads/544d0b71-3b60-4f04-81da-d190b8007a11.png'
        }
      })) || [];

      console.log('Formatted pending videos:', formattedVideos);
      setPendingVideos(formattedVideos);
    } catch (error) {
      console.error('Error loading pending videos:', error);
      toast.error('Failed to load pending videos');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveVideo = async (videoId: string) => {
    console.log('Approving video:', videoId);
    setProcessingVideos(prev => [...prev, videoId]);

    try {
      // Get the video data from videos_for_approval
      const { data: videoData, error: fetchError } = await supabase
        .from('videos_for_approval')
        .select('*')
        .eq('id', videoId)
        .single();

      if (fetchError) {
        console.error('Error fetching video for approval:', fetchError);
        toast.error('Failed to fetch video details');
        return;
      }

      // Insert into videos table (approved)
      const { error: insertError } = await supabase
        .from('videos')
        .insert({
          title: videoData.title,
          description: videoData.description,
          thumbnail: videoData.thumbnail,
          video_url: videoData.video_url,
          creator_id: videoData.creator_id,
          views: videoData.views,
          visibility: videoData.visibility
        });

      if (insertError) {
        console.error('Error inserting approved video:', insertError);
        toast.error('Failed to approve video');
        return;
      }

      // Delete from videos_for_approval table
      const { error: deleteError } = await supabase
        .from('videos_for_approval')
        .delete()
        .eq('id', videoId);

      if (deleteError) {
        console.error('Error deleting from approval table:', deleteError);
        toast.error('Failed to clean up approval table');
        return;
      }

      // Remove video from pending list
      setPendingVideos(prev => prev.filter(video => video.id !== videoId));
      
      // Refresh the pending count
      refreshPendingCount();

      toast.success('Video approved and published successfully!');
    } catch (error) {
      console.error('Error approving video:', error);
      toast.error('Failed to approve video');
    } finally {
      setProcessingVideos(prev => prev.filter(id => id !== videoId));
    }
  };

  const handleDeclineVideo = async (videoId: string) => {
    console.log('Declining video:', videoId);
    setProcessingVideos(prev => [...prev, videoId]);

    try {
      // Delete from videos_for_approval table
      const { error } = await supabase
        .from('videos_for_approval')
        .delete()
        .eq('id', videoId);

      if (error) {
        console.error('Error declining video:', error);
        toast.error('Failed to decline video');
        return;
      }

      // Remove video from pending list
      setPendingVideos(prev => prev.filter(video => video.id !== videoId));
      
      // Refresh the pending count
      refreshPendingCount();

      toast.success('Video declined and removed successfully');
    } catch (error) {
      console.error('Error declining video:', error);
      toast.error('Failed to decline video');
    } finally {
      setProcessingVideos(prev => prev.filter(id => id !== videoId));
    }
  };

  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <Clock className="text-yellow-500" size={32} />
          <h1 className="text-3xl font-bold text-white">Videos for Approval</h1>
          <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-medium">
            {pendingVideos.length}
          </span>
        </div>

        {pendingVideos.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-white mb-4">All caught up!</h2>
            <p className="text-gray-400">No videos pending approval at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingVideos.map((video) => (
              <div key={video.id} className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
                <div className="relative">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded font-medium">
                    Pending
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                    {video.title}
                  </h3>
                  
                  {video.description && (
                    <p className="text-gray-400 text-sm mb-3 line-clamp-3">
                      {video.description}
                    </p>
                  )}

                  <div className="flex items-center space-x-2 mb-4">
                    <img
                      src={video.creator.avatar}
                      alt={video.creator.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="text-sm text-gray-300">{video.creator.name}</span>
                  </div>

                  <div className="text-xs text-gray-500 mb-4">
                    Uploaded: {new Date(video.created_at).toLocaleDateString()}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApproveVideo(video.id)}
                      disabled={processingVideos.includes(video.id)}
                      className="flex-1 flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-2 px-3 rounded-lg transition-colors text-sm"
                    >
                      <Check size={16} />
                      <span>Approve</span>
                    </button>
                    
                    <button
                      onClick={() => handleDeclineVideo(video.id)}
                      disabled={processingVideos.includes(video.id)}
                      className="flex-1 flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white py-2 px-3 rounded-lg transition-colors text-sm"
                    >
                      <X size={16} />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminApprovals;
