
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2, UserPlus, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import CommentSection from '../components/CommentSection';

interface VideoData {
  _id: string;
  title: string;
  description: string;
  videoUrl: string;
  views: number;
  likes: number;
  createdAt: Date;
  creator: {
    _id: string;
    name: string;
    avatar?: string;
    followers: number;
  };
}

const VideoWatch = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [video, setVideo] = useState<VideoData | null>(null);
  const [liked, setLiked] = useState(false);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVideo();
  }, [id]);

  const loadVideo = () => {
    // In real app, this would fetch video data from MongoDB
    // For demo, we'll show a placeholder
    setTimeout(() => {
      setVideo({
        _id: id || '',
        title: 'Sample Educational Video',
        description: 'This is a sample educational video description that would be loaded from the database.',
        videoUrl: 'https://sample-video-url.mp4',
        views: 1234,
        likes: 89,
        createdAt: new Date(),
        creator: {
          _id: 'teacher-id',
          name: 'Harez Uddin Hero',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face',
          followers: 256
        }
      });
      setLoading(false);
    }, 1000);
  };

  const handleLike = () => {
    if (!user) return;
    
    setLiked(!liked);
    setVideo(prev => prev ? {
      ...prev,
      likes: liked ? prev.likes - 1 : prev.likes + 1
    } : null);

    // Send notification to video creator
    if (!liked && video && video.creator._id !== user._id) {
      addNotification({
        type: 'like',
        message: `${user.name} liked your video "${video.title}"`,
        read: false
      });
    }
  };

  const handleFollow = () => {
    if (!user) return;
    setFollowing(!following);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: video?.title,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Video link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="bg-gray-800 aspect-video rounded-xl mb-6"></div>
            <div className="bg-gray-800 h-8 rounded w-3/4 mb-4"></div>
            <div className="bg-gray-800 h-4 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Video not found</h1>
          <Link to="/" className="btn-primary">
            Go Back Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Video Player and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <div className="rounded-xl overflow-hidden bg-black aspect-video relative">
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="text-center">
                  <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <div className="w-0 h-0 border-l-[15px] border-l-white border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent ml-1"></div>
                  </div>
                  <p className="text-white/60">Video player would be embedded here</p>
                  <p className="text-sm text-white/40 mt-2">In production, this would show the actual video</p>
                </div>
              </div>
            </div>

            {/* Video Info */}
            <div className="space-y-4">
              <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                {video.title}
              </h1>

              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-4 text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Eye size={16} />
                    <span>{video.views.toLocaleString()} views</span>
                  </div>
                  <span>•</span>
                  <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleLike}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
                      liked 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                        : 'bg-gray-800/50 text-gray-400 hover:text-white border border-gray-600/50'
                    }`}
                  >
                    <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
                    <span>{video.likes}</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gray-800/50 text-gray-400 hover:text-white border border-gray-600/50 transition-colors"
                  >
                    <Share2 size={16} />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Creator Info */}
            <div className="rounded-card p-6">
              <div className="flex items-center justify-between">
                <Link 
                  to={`/profile/${video.creator._id}`}
                  className="flex items-center space-x-4 group"
                >
                  <img
                    src={video.creator.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face'}
                    alt={video.creator.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {video.creator.name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {video.creator.followers} followers
                    </p>
                  </div>
                </Link>

                {user && video.creator._id !== user._id && (
                  <button
                    onClick={handleFollow}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
                      following
                        ? 'bg-gray-800/50 text-gray-400 border border-gray-600/50'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    <UserPlus size={16} />
                    <span>{following ? 'Following' : 'Follow'}</span>
                  </button>
                )}
              </div>

              {video.description && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-gray-300 leading-relaxed">
                    {video.description}
                  </p>
                </div>
              )}
            </div>

            {/* Comments Section */}
            <CommentSection videoId={video._id} />
          </div>

          {/* Recommended Videos Sidebar */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white">Recommended</h3>
            
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors cursor-pointer p-3">
                  <div className="flex space-x-3">
                    <div className="bg-gray-700 aspect-video rounded w-32 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white text-sm line-clamp-2 mb-1">
                        Sample Recommended Video Title
                      </h4>
                      <p className="text-xs text-gray-400 mb-1">Educational Channel</p>
                      <p className="text-xs text-gray-500">1.2K views • 2 days ago</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoWatch;
