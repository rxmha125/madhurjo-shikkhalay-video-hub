
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Heart, Share2, Eye, Calendar, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import CommentSection from '../components/CommentSection';

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail: string;
  views: number;
  created_at: string;
  creator_id: string;
  creator?: {
    name: string;
    avatar?: string;
  };
}

const VideoWatch = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { addNotification } = useNotifications();
  const [video, setVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    if (id) {
      fetchVideo();
      incrementViews();
    }
  }, [id]);

  const fetchVideo = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select(`
          *,
          profiles!videos_creator_id_fkey (
            name,
            avatar
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      setVideo({
        ...data,
        creator: {
          name: data.profiles?.name || 'Unknown Creator',
          avatar: data.profiles?.avatar
        }
      });
    } catch (error) {
      console.error('Error fetching video:', error);
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const incrementViews = async () => {
    try {
      if (id) {
        // Get current video to increment views
        const { data: currentVideo } = await supabase
          .from('videos')
          .select('views')
          .eq('id', id)
          .single();

        if (currentVideo) {
          const newViews = (currentVideo.views || 0) + 1;
          await supabase
            .from('videos')
            .update({ views: newViews })
            .eq('id', id);
        }
      }
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  };

  const handleLike = async () => {
    if (!profile || !video) return;

    try {
      // Notify video creator about the like
      if (video.creator_id !== profile.id) {
        await addNotification({
          user_id: video.creator_id,
          type: 'like',
          title: 'New Like',
          content: `${profile.name} liked your video "${video.title}"`,
          video_id: video.id
        });
      }

      setHasLiked(true);
    } catch (error) {
      console.error('Error liking video:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: video?.title,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading video...</div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Video not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container-responsive py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player Section */}
          <div className="lg:col-span-2">
            <div className="rounded-card bg-black/50 overflow-hidden">
              {video.video_url ? (
                <video
                  src={video.video_url}
                  poster={video.thumbnail}
                  controls
                  className="w-full aspect-video"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="aspect-video flex items-center justify-center bg-gray-800">
                  <Play size={64} className="text-gray-400" />
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="mt-6 space-y-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {video.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-gray-300 text-sm">
                <div className="flex items-center space-x-1">
                  <Eye size={16} />
                  <span>{video.views} views</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar size={16} />
                  <span>{new Date(video.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={video.creator?.avatar || '/lovable-uploads/544d0b71-3b60-4f04-81da-d190b8007a11.png'}
                    alt={video.creator?.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-white">
                      {video.creator?.name}
                    </h3>
                    <p className="text-sm text-gray-400">Creator</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleLike}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                      hasLiked
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                    }`}
                  >
                    <Heart size={18} className={hasLiked ? 'fill-current' : ''} />
                    <span>Like</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 rounded-lg transition-all duration-300"
                  >
                    <Share2 size={18} />
                    <span>Share</span>
                  </button>
                </div>
              </div>

              {video.description && (
                <div className="bg-gray-800/30 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">Description</h3>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {video.description}
                  </p>
                </div>
              )}
            </div>

            {/* Comments Section */}
            <CommentSection 
              videoId={video.id} 
              videoTitle={video.title}
              videoCreatorId={video.creator_id}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="rounded-card p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                Related Videos
              </h3>
              <div className="text-gray-400 text-center py-8">
                No related videos available
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoWatch;
