
import React from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';

interface VideoCardProps {
  video: {
    _id: string;
    title: string;
    thumbnail: string;
    views: number;
    createdAt: Date;
    creator: {
      _id: string;
      name: string;
      avatar?: string;
    };
  };
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  return (
    <div className="video-card">
      <Link to={`/watch/${video._id}`}>
        <div className="relative mb-4">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full aspect-video object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-black/20 rounded-lg group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
              <div className="w-0 h-0 border-l-[12px] border-l-white border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-1"></div>
            </div>
          </div>
        </div>
      </Link>

      <div className="space-y-2">
        <Link to={`/watch/${video._id}`}>
          <h3 className="font-semibold text-white line-clamp-2 group-hover:text-blue-400 transition-colors">
            {video.title}
          </h3>
        </Link>

        <div className="flex items-center text-sm text-gray-400 space-x-2">
          <Eye size={14} />
          <span>{formatViews(video.views)} views</span>
          <span>•</span>
          <span>{formatTimeAgo(video.createdAt)}</span>
        </div>

        <Link 
          to={`/profile/${video.creator._id}`}
          className="flex items-center space-x-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <img
            src={video.creator.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=24&h=24&fit=crop&crop=face'}
            alt={video.creator.name}
            className="w-6 h-6 rounded-full object-cover"
          />
          <span>{video.creator.name}</span>
        </Link>
      </div>
    </div>
  );
};

export default VideoCard;
