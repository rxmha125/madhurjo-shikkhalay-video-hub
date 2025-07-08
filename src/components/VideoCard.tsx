
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Calendar } from 'lucide-react';
import { formatTimeAgo } from '../utils/timeUtils';
import { supabase } from '@/integrations/supabase/client';

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
  const [actualThumbnail, setActualThumbnail] = useState<string | null>(null);

  useEffect(() => {
    const fetchThumbnail = async () => {
      try {
        const { data: thumbnailData } = await supabase
          .from('thumbnails')
          .select('thumbnail_url')
          .eq('video_id', video.id)
          .eq('is_active', true)
          .single();

        if (thumbnailData?.thumbnail_url) {
          setActualThumbnail(thumbnailData.thumbnail_url);
        } else if (video.thumbnail) {
          setActualThumbnail(video.thumbnail);
        }
      } catch (error) {
        console.log('No custom thumbnail found, using default');
        if (video.thumbnail) {
          setActualThumbnail(video.thumbnail);
        }
      }
    };

    fetchThumbnail();
  }, [video.id, video.thumbnail]);

  const thumbnailToShow = actualThumbnail || '/lovable-uploads/544d0b71-3b60-4f04-81da-d190b8007a11.png';

  const TITLE_LIMIT = 60;
  const shouldTruncateTitle = video.title.length > TITLE_LIMIT;
  const displayTitle = shouldTruncateTitle ? `${video.title.substring(0, TITLE_LIMIT)}...` : video.title;

  return (
    <Link to={`/watch/${video.id}`} className="group block">
      <div className="bg-transparent hover:bg-gray-800/20 rounded-xl overflow-hidden transition-all duration-200 cursor-pointer">
        {/* Thumbnail Container */}
        <div className="relative aspect-video mb-3">
          <img
            src={thumbnailToShow}
            alt={video.title}
            className="w-full h-full object-cover rounded-xl group-hover:rounded-lg transition-all duration-200"
            onError={(e) => {
              e.currentTarget.src = '/lovable-uploads/544d0b71-3b60-4f04-81da-d190b8007a11.png';
            }}
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl group-hover:rounded-lg" />
        </div>
        
        {/* Content Container */}
        <div className="flex gap-3">
          {/* Creator Avatar */}
          <div className="flex-shrink-0 pt-1">
            <img
              src={video.creator?.avatar || '/lovable-uploads/544d0b71-3b60-4f04-81da-d190b8007a11.png'}
              alt={video.creator.name}
              className="w-9 h-9 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/lovable-uploads/544d0b71-3b60-4f04-81da-d190b8007a11.png';
              }}
            />
          </div>
          
          {/* Video Info */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 
              className="font-medium text-white text-sm leading-5 mb-1 group-hover:text-blue-400 transition-colors duration-200"
              title={video.title}
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {video.title}
            </h3>
            
            {/* Creator Name */}
            <Link 
              to={`/profile/${video.creator.id}`}
              className="text-sm text-gray-400 hover:text-white transition-colors duration-200 block mb-1"
              onClick={(e) => e.stopPropagation()}
            >
              {video.creator.name}
            </Link>
            
            {/* Views and Date */}
            <div className="flex items-center text-xs text-gray-400 space-x-1">
              <span>{video.views} views</span>
              <span>•</span>
              <span>{formatTimeAgo(video.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default VideoCard;
