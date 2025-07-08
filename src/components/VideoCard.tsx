
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
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden shadow-lg hover:shadow-xl hover:border-gray-600 hover:bg-gray-800/70 transition-all duration-300">
        <div className="relative aspect-video">
          <img
            src={thumbnailToShow}
            alt={video.title}
            className="w-full h-full object-cover group-hover:brightness-110 transition-all duration-300"
            onError={(e) => {
              e.currentTarget.src = '/lovable-uploads/544d0b71-3b60-4f04-81da-d190b8007a11.png';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        
        <div className="p-4">
          <h3 
            className="font-semibold text-white mb-2 transition-colors duration-300"
            title={video.title}
          >
            {displayTitle}
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
            <Link 
              to={`/profile/${video.creator.id}`}
              className="text-sm text-gray-400 hover:text-white transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {video.creator.name}
            </Link>
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
