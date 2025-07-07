
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Clock, Check, X, Play } from 'lucide-react';
import { formatTimeAgo } from '../utils/timeUtils';

interface PendingVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  video_url: string;
  created_at: string;
  creator: {
    id: string;
    name: string;
    avatar: string;
  };
}

const AdminApprovals = () => {
  const { profile } = useAuth();
  const { refreshPendingCount, addNotification } = useNotifications();
  const [pendingVideos, setPendingVideos] = useState<PendingVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingVideos, setProcessingVideos] = useState<string[]>([]);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [videoThumbnails, setVideoThumbnails] = useState<{[key: string]: string}>({});

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

      const formattedVideos = data?.map(video => ({
        id: video.id,
        title: video.title,
        description: video.description || '',
        thumbnail: video.thumbnail || '/lovable-uploads/544d0b71-3b60-4f04-81da-d190b8007a11.png',
        video_url: video.video_url || '',
        created_at: video.created_at,
        creator: {
          id: video.creator?.id || '',
          name: video.creator?.name || 'Unknown',
          avatar: video.creator?.avatar || '/lovable-uploads/544d0b71-3b60-4f04-81da-d190b8007a11.png'
        }
      })) || [];

      console.log('Formatted pending videos:', formattedVideos);
      setPendingVideos(formattedVideos);

      // Fetch actual thumbnails for each video
      const thumbnailPromises = formattedVideos.map(async (video) => {
        try {
          const { data: thumbnailData } = await supabase
            .from('thumbnails')
            .select('thumbnail_url')
            .eq('video_id', video.id)
            .eq('is_active', true)
            .single();

          return {
            videoId: video.id,
            thumbnailUrl: thumbnailData?.thumbnail_url || video.thumbnail
          };
        } catch (error) {
          return {
            videoId: video.id,
            thumbnailUrl: video.thumbnail
          };
        }
      });

      const thumbnailResults = await Promise.all(thumbnailPromises);
      const thumbnailMap = thumbnailResults.reduce((acc, result) => {
        acc[result.videoId] = result.thumbnailUrl;
        return acc;
      }, {} as {[key: string]: string});

      setVideoThumbnails(thumbnailMap);

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

      const { error: deleteError } = await supabase
        .from('videos_for_approval')
        .delete()
        .eq('id', videoId);

      if (deleteError) {
        console.error('Error deleting from approval table:', deleteError);
        toast.error('Failed to clean up approval table');
        return;
      }

      // Notify the creator about approval
      await addNotification({
        user_id: videoData.creator_id,
        type: 'approval',
        title: 'Video Approved',
        content: `Your video "${videoData.title}" has been approved and published!`,
        video_id: videoId
      });

      setPendingVideos(prev => prev.filter(video => video.id !== videoId));
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
      // Get video data for notification
      const { data: videoData } = await supabase
        .from('videos_for_approval')
        .select('*')
        .eq('id', videoId)
        .single();

      const { error } = await supabase
        .from('videos_for_approval')
        .delete()
        .eq('id', videoId);

      if (error) {
        console.error('Error declining video:', error);
        toast.error('Failed to decline video');
        return;
      }

      // Notify the creator about decline
      if (videoData) {
        await addNotification({
          user_id: videoData.creator_id,
          type: 'decline',
          title: 'Video Declined',
          content: `Your video "${videoData.title}" was not approved for publication.`
        });
      }

      setPendingVideos(prev => prev.filter(video => video.id !== videoId));
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400">You don't have permission to access this page.</p>
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
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <Clock className="text-yellow-500" size={32} />
          <h1 className="text-3xl font-bold text-white">Videos for Approval</h1>
          <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-3 py-1 rounded-full text-sm font-medium">
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
              <div key={video.id} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden shadow-2xl">
                <div className="relative">
                  {playingVideo === video.id && video.video_url ? (
                    <video
                      src={video.video_url}
                      controls
                      autoPlay
                      className="w-full h-48 object-cover bg-black"
                      onEnded={() => setPlayingVideo(null)}
                      preload="metadata"
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="relative">
                      <img
                        src={videoThumbnails[video.id] || video.thumbnail}
                        alt={video.title}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/lovable-uploads/544d0b71-3b60-4f04-81da-d190b8007a11.png';
                        }}
                      />
                      {video.video_url && (
                        <button
                          onClick={() => setPlayingVideo(video.id)}
                          className="absolute inset-0 flex items-center justify-center bg-black/50 hover:bg-black/70 transition-all duration-300 group"
                        >
                          <Play size={48} className="text-white group-hover:scale-110 transition-transform" />
                        </button>
                      )}
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs px-2 py-1 rounded-full font-medium">
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
                      className="w-6 h-6 rounded-full object-cover border border-gray-600"
                    />
                    <span className="text-sm text-gray-300">{video.creator.name}</span>
                  </div>

                  <div className="text-xs text-gray-500 mb-4">
                    Uploaded: {formatTimeAgo(video.created_at)}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApproveVideo(video.id)}
                      disabled={processingVideos.includes(video.id)}
                      className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 text-white py-2 px-3 rounded-lg transition-all duration-300 text-sm shadow-lg shadow-green-500/25"
                    >
                      <Check size={16} />
                      <span>Approve</span>
                    </button>
                    
                    <button
                      onClick={() => handleDeclineVideo(video.id)}
                      disabled={processingVideos.includes(video.id)}
                      className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-700 text-white py-2 px-3 rounded-lg transition-all duration-300 text-sm shadow-lg shadow-red-500/25"
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
