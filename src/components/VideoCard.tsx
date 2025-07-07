
import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Calendar } from 'lucide-react';
import { formatTimeAgo } from '../utils/timeUtils';

interface Video {
  id: string;
  title: string;
  thumbnail: string | null;
  views: number;
  created_at: string;
  creator: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface VideoCardProps {
  video: Video;
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  return (
    <Link to={`/watch/${video.id}`} className="group block">
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden shadow-lg hover:shadow-xl hover:border-gray-600 hover:bg-gray-800/70 transition-all duration-300">
        <div className="relative aspect-video">
          <img
            src={video.thumbnail || '/lovable-uploads/544d0b71-3b60-4f04-81da-d190b8007a11.png'}
            alt={video.title}
            className="w-full h-full object-cover group-hover:brightness-110 transition-all duration-300"
            onError={(e) => {
              e.currentTarget.src = '/lovable-uploads/544d0b71-3b60-4f04-81da-d190b8007a11.png';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors duration-300">
            {video.title}
          </h3>
          
          <div className="flex items-center space-x-2 mb-3">
            <img
              src={video.creator?.avatar || '/lovable-uploads/544d0b71-3b60-4f04-81da-d190b8007a11.png'}
              alt={video.creator.name}
              className="w-6 h-6 rounded-full object-cover border border-gray-600"
              onError={(e) => {
                e.currentTarget.src = '/lovable-uploads/544d0b71-3b60-4f04-81da-d190b8007a11.png';
              }}
            />
            <span className="text-sm text-gray-400 hover:text-gray-300 transition-colors">
              {video.creator.name}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <Eye size={12} />
              <span>{video.views} views</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar size={12} />
              <span>{formatTimeAgo(video.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default VideoCard;
