
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
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    if (id) {
      fetchVideo();
      incrementViews();
      fetchLikes();
      checkUserLike();
    }
  }, [id, profile]);

  useEffect(() => {
    if (!id) return;

    // Real-time subscription for likes
    const channel = supabase
      .channel(`video_likes_${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'video_likes',
          filter: `video_id=eq.${id}`
        },
        () => {
          fetchLikes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  const fetchLikes = async () => {
    if (!id) return;
    
    try {
      const { count, error } = await supabase
        .from('video_likes')
        .select('*', { count: 'exact', head: true })
        .eq('video_id', id);

      if (error) throw error;
      setLikeCount(count || 0);
    } catch (error) {
      console.error('Error fetching likes:', error);
    }
  };

  const checkUserLike = async () => {
    if (!id || !profile) return;

    try {
      const { data, error } = await supabase
        .from('video_likes')
        .select('id')
        .eq('video_id', id)
        .eq('user_id', profile.id)
        .single();

      setHasLiked(!!data);
    } catch (error) {
      // User hasn't liked the video
      setHasLiked(false);
    }
  };

  const incrementViews = async () => {
    try {
      if (id) {
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
    if (!profile || !video || isLiking) return;

    setIsLiking(true);

    try {
      if (hasLiked) {
        // Unlike the video
        const { error } = await supabase
          .from('video_likes')
          .delete()
          .eq('video_id', video.id)
          .eq('user_id', profile.id);

        if (error) throw error;
        setHasLiked(false);
      } else {
        // Like the video
        const { error } = await supabase
          .from('video_likes')
          .insert({
            video_id: video.id,
            user_id: profile.id
          });

        if (error) throw error;
        setHasLiked(true);

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
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLiking(false);
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
      <div className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player Section */}
          <div className="lg:col-span-2">
            <div className="rounded-xl bg-black/60 backdrop-blur-sm border border-purple-500/20 overflow-hidden shadow-2xl">
              {video.video_url ? (
                <video
                  src={video.video_url}
                  poster={video.thumbnail}
                  controls
                  className="w-full aspect-video bg-black"
                  style={{ outline: 'none' }}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-purple-900/50 to-slate-900/50">
                  <Play size={64} className="text-purple-400" />
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="mt-6 space-y-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {video.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-purple-300 text-sm">
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
                    className="w-12 h-12 rounded-full object-cover border-2 border-purple-500/30"
                  />
                  <div>
                    <h3 className="font-semibold text-white">
                      {video.creator?.name}
                    </h3>
                    <p className="text-sm text-purple-300">Creator</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleLike}
                    disabled={!profile || isLiking}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                      hasLiked
                        ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg shadow-red-500/25'
                        : 'bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 text-purple-300 hover:bg-purple-900/30 hover:border-purple-400/30'
                    } disabled:opacity-50`}
                  >
                    <Heart size={18} className={hasLiked ? 'fill-current' : ''} />
                    <span>{likeCount}</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 text-purple-300 hover:bg-purple-900/30 hover:border-purple-400/30 rounded-xl transition-all duration-300"
                  >
                    <Share2 size={18} />
                    <span>Share</span>
                  </button>
                </div>
              </div>

              {video.description && (
                <div className="bg-gray-800/30 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
                  <h3 className="font-semibold text-white mb-3">Description</h3>
                  <p className="text-purple-100 leading-relaxed whitespace-pre-wrap">
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
            <div className="bg-gray-800/30 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                Related Videos
              </h3>
              <div className="text-purple-300 text-center py-8">
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
