import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Play, Heart, Share2, Eye, Calendar, User, UserPlus, UserMinus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useFollowSystem } from '../hooks/useFollowSystem';
import { useViewTracking } from '../hooks/useViewTracking';
import { formatTimeAgo } from '../utils/timeUtils';
import CommentSection from '../components/CommentSection';
import CustomVideoPlayer from '../components/CustomVideoPlayer';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import { toast } from 'sonner';

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [actualThumbnail, setActualThumbnail] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFullTitle, setShowFullTitle] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const { isFollowing, followerCount, isLoading: followLoading, toggleFollow } = useFollowSystem(video?.creator_id);
  useViewTracking(id || '');

  const isOwnVideo = profile?.id === video?.creator_id;

  useEffect(() => {
    if (id) {
      fetchVideo();
      fetchLikes();
      checkUserLike();
    }
  }, [id, profile]);

  useEffect(() => {
    if (video?.id) {
      fetchActualThumbnail();
    }
  }, [video?.id]);

  const fetchActualThumbnail = async () => {
    if (!video?.id) return;
    
    try {
      const { data: thumbnailData } = await supabase
        .from('thumbnails')
        .select('thumbnail_url')
        .eq('video_id', video.id)
        .eq('is_active', true)
        .single();

      if (thumbnailData?.thumbnail_url) {
        setActualThumbnail(thumbnailData.thumbnail_url);
      }
    } catch (error) {
      console.log('No custom thumbnail found');
    }
  };

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
      setHasLiked(false);
    }
  };

  const handleLike = async () => {
    if (!profile || !video || isLiking) return;

    setIsLiking(true);
    
    // Optimistic update
    const wasLiked = hasLiked;
    setHasLiked(!hasLiked);
    setLikeCount(prev => wasLiked ? prev - 1 : prev + 1);

    try {
      if (wasLiked) {
        const { error } = await supabase
          .from('video_likes')
          .delete()
          .eq('video_id', video.id)
          .eq('user_id', profile.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('video_likes')
          .insert({
            video_id: video.id,
            user_id: profile.id
          });

        if (error) throw error;

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
      // Revert optimistic update on error
      setHasLiked(wasLiked);
      setLikeCount(prev => wasLiked ? prev + 1 : prev - 1);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDeleteVideo = async () => {
    if (!video || !profile || !isOwnVideo) return;

    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', video.id);

      if (error) throw error;
      
      toast.success('Video deleted successfully');
      navigate('/');
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Failed to delete video');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
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
      toast.success('Link copied to clipboard');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading video...</div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Video not found</div>
      </div>
    );
  }

  const thumbnailToShow = actualThumbnail || video.thumbnail || '/lovable-uploads/544d0b71-3b60-4f04-81da-d190b8007a11.png';

  // Title and description limits
  const TITLE_LIMIT = 80;
  const DESCRIPTION_LIMIT = 150;
  
  const shouldTruncateTitle = video.title.length > TITLE_LIMIT;
  const shouldTruncateDescription = video.description && video.description.length > DESCRIPTION_LIMIT;
  
  const displayTitle = showFullTitle || !shouldTruncateTitle ? video.title : `${video.title.substring(0, TITLE_LIMIT)}...`;
  const displayDescription = showFullDescription || !shouldTruncateDescription ? video.description : `${video.description?.substring(0, DESCRIPTION_LIMIT)}...`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="rounded-xl bg-black/60 backdrop-blur-sm border border-gray-700 overflow-hidden shadow-2xl">
              {video.video_url ? (
                <CustomVideoPlayer
                  src={video.video_url}
                  poster={thumbnailToShow}
                  className="aspect-video"
                />
              ) : (
                <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                  <div className="text-center">
                    <Play size={64} className="text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">Video not available</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <h1 
                  className={`text-2xl sm:text-3xl font-bold text-white ${
                    shouldTruncateTitle ? 'cursor-pointer hover:text-blue-400' : ''
                  } transition-colors duration-300`}
                  onClick={() => shouldTruncateTitle && setShowFullTitle(!showFullTitle)}
                >
                  {displayTitle}
                </h1>
                {shouldTruncateTitle && (
                  <button
                    onClick={() => setShowFullTitle(!showFullTitle)}
                    className="text-sm text-blue-400 hover:text-blue-300 mt-1"
                  >
                    {showFullTitle ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-gray-400 text-sm">
                <div className="flex items-center space-x-1">
                  <Eye size={16} />
                  <span>{video.views} views</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar size={16} />
                  <span>{formatTimeAgo(video.created_at)}</span>
                </div>
              </div>

              {/* Mobile-first responsive layout */}
              <div className="space-y-4">
                {/* Creator Info */}
                <div className="flex items-start space-x-3">
                  <img
                    src={video.creator?.avatar || '/lovable-uploads/544d0b71-3b60-4f04-81da-d190b8007a11.png'}
                    alt={video.creator?.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-600 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={`/profile/${video.creator_id}`}
                      className="font-semibold text-white hover:text-blue-400 transition-colors truncate block"
                    >
                      {video.creator?.name}
                    </Link>
                    <p className="text-sm text-gray-400">{followerCount} followers</p>
                  </div>
                  
                  {!isOwnVideo && profile && (
                    <button
                      onClick={toggleFollow}
                      disabled={followLoading}
                      className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm transition-all duration-300 flex-shrink-0 ${
                        isFollowing
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      } disabled:opacity-50`}
                    >
                      {isFollowing ? <UserMinus size={16} /> : <UserPlus size={16} />}
                      <span className="hidden sm:inline">{isFollowing ? 'Unfollow' : 'Follow'}</span>
                    </button>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleLike}
                      disabled={!profile || isLiking}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-300 ${
                        hasLiked
                          ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg shadow-red-500/25'
                          : 'bg-gray-800/50 backdrop-blur-sm border border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500'
                      } disabled:opacity-50`}
                    >
                      <Heart size={18} className={hasLiked ? 'fill-current' : ''} />
                      <span>{likeCount}</span>
                    </button>

                    <button
                      onClick={handleShare}
                      className="flex items-center space-x-2 px-3 py-2 bg-gray-800/50 backdrop-blur-sm border border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 rounded-xl transition-all duration-300"
                    >
                      <Share2 size={18} />
                      <span className="hidden sm:inline">Share</span>
                    </button>
                  </div>

                  {isOwnVideo && (
                    <button
                      onClick={() => setShowDeleteDialog(true)}
                      disabled={isDeleting}
                      className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded-xl transition-all duration-300"
                    >
                      <Trash2 size={16} />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  )}
                </div>
              </div>

              {video.description && (
                <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                  <h3 className="font-semibold text-white mb-3">Description</h3>
                  <div>
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {displayDescription}
                    </p>
                    {shouldTruncateDescription && (
                      <button
                        onClick={() => setShowFullDescription(!showFullDescription)}
                        className="text-sm text-blue-400 hover:text-blue-300 mt-2 block"
                      >
                        {showFullDescription ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <CommentSection 
              videoId={video.id} 
              videoTitle={video.title}
              videoCreatorId={video.creator_id}
            />
          </div>

          <div className="lg:col-span-1">
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
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
      
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteVideo}
        title="Delete Video"
        message="Are you confirming to delete this video? This action cannot be undone."
        isLoading={isDeleting}
      />
    </div>
  );
};

export default VideoWatch;
