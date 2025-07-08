
import React, { useState } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import VideoCard from './VideoCard';

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

interface LazyVideoCardProps {
  video: Video;
  priority?: boolean; // For above-the-fold videos
}

const LazyVideoCard: React.FC<LazyVideoCardProps> = ({ video, priority = false }) => {
  const [hasError, setHasError] = useState(false);
  const { elementRef, isVisible, hasBeenVisible } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px', // Start loading 100px before coming into view
    triggerOnce: true, // Once loaded, keep it loaded
  });

  // For priority videos (first few), render immediately
  const shouldRender = priority || hasBeenVisible;

  return (
    <div 
      ref={elementRef} 
      className="min-h-[280px] w-full" // Reserve space to prevent layout shift
    >
      {shouldRender ? (
        <VideoCard video={video} />
      ) : (
        // Skeleton loader while not visible
        <div className="animate-pulse">
          <div className="bg-gray-700 aspect-video rounded-xl mb-3"></div>
          <div className="flex gap-3">
            <div className="w-9 h-9 bg-gray-700 rounded-full flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2"></div>
              <div className="h-3 bg-gray-700 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LazyVideoCard;
