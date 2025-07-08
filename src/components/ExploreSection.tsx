
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import LazyVideoCard from './LazyVideoCard';
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

const ExploreSection = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Reduced limit for better performance - load smaller chunks more frequently
  const limit = 8;

  // Memoize the initial load function
  const loadInitialVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('videos')
        .select(`
          id,
          title,
          thumbnail,
          views,
          created_at,
          creator:profiles(
            id,
            name,
            avatar
          )
        `)
        .eq('is_approved', true) // Only load approved videos
        .order('created_at', { ascending: false })
        .range(0, limit - 1);

      if (error) {
        console.error('Error fetching initial videos:', error);
        setError('Failed to load videos');
        setHasMore(false);
      } else {
        const formattedVideos = data?.map(video => ({
          id: video.id,
          title: video.title,
          thumbnail: video.thumbnail,
          views: video.views || 0,
          created_at: video.created_at,
          creator: {
            id: video.creator?.id || '',
            name: video.creator?.name || 'Unknown',
            avatar: video.creator?.avatar
          }
        })) || [];

        setVideos(formattedVideos);
        setOffset(limit);
        
        if (formattedVideos.length < limit) {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error('Error loading initial videos:', error);
      setError('Failed to load videos');
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  // Memoize the fetch more function with debouncing
  const fetchMoreVideos = useCallback(async () => {
    if (!hasMore || loading) return;

    try {
      const { data, error } = await supabase
        .from('videos')
        .select(`
          id,
          title,
          thumbnail,
          views,
          created_at,
          creator:profiles(
            id,
            name,
            avatar
          )
        `)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching more videos:', error);
      } else {
        const formattedVideos = data?.map(video => ({
          id: video.id,
          title: video.title,
          thumbnail: video.thumbnail,
          views: video.views || 0,
          created_at: video.created_at,
          creator: {
            id: video.creator?.id || '',
            name: video.creator?.name || 'Unknown',
            avatar: video.creator?.avatar
          }
        })) || [];

        setVideos(prev => [...prev, ...formattedVideos]);
        setOffset(prev => prev + limit);

        if (formattedVideos.length < limit) {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error('Error loading more videos:', error);
    }
  }, [hasMore, loading, offset, limit]);

  // Load initial videos
  useEffect(() => {
    loadInitialVideos();
  }, [loadInitialVideos]);

  // Memoize the video grid to prevent unnecessary re-renders
  const videoGrid = useMemo(() => {
    return videos.map((video, index) => (
      <LazyVideoCard 
        key={video.id} 
        video={video} 
        priority={index < 4} // First 4 videos load immediately
      />
    ));
  }, [videos]);

  if (loading) {
    return (
      <section id="explore" className="py-12 sm:py-16 lg:py-20 px-4">
        <div className="container-responsive">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="heading-responsive font-bold text-white mb-4">
              Explore Educational Content
            </h2>
            <p className="text-gray-400 text-responsive max-w-2xl mx-auto">
              Discover a vast collection of educational videos carefully curated by expert educators
            </p>
          </div>

          {/* Optimized skeleton loader */}
          <div className="grid-responsive">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-700 aspect-video rounded-xl mb-3"></div>
                <div className="flex gap-3">
                  <div className="w-9 h-9 bg-gray-700 rounded-full flex-shrink-0"></div>
                  <div className="space-y-2 flex-1">
                    <div className="bg-gray-700 h-4 rounded w-3/4"></div>
                    <div className="bg-gray-700 h-3 rounded w-1/2"></div>
                    <div className="bg-gray-700 h-3 rounded w-1/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="explore" className="py-12 sm:py-16 lg:py-20 px-4">
        <div className="container-responsive">
          <div className="text-center py-16 sm:py-20">
            <div className="rounded-card p-8 sm:p-12 max-w-md mx-auto">
              <div className="text-4xl sm:text-6xl mb-4">⚠️</div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Error Loading Videos</h3>
              <p className="text-gray-400 text-sm sm:text-base mb-4">{error}</p>
              <button 
                onClick={loadInitialVideos}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (videos.length === 0) {
    return (
      <section id="explore" className="py-12 sm:py-16 lg:py-20 px-4">
        <div className="container-responsive">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="heading-responsive font-bold text-white mb-4">
              Explore Educational Content
            </h2>
            <p className="text-gray-400 text-responsive max-w-2xl mx-auto">
              Discover a vast collection of educational videos carefully curated by expert educators
            </p>
          </div>
          
          <div className="text-center py-16 sm:py-20">
            <div className="rounded-card p-8 sm:p-12 max-w-md mx-auto">
              <div className="text-4xl sm:text-6xl mb-4">📹</div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No videos available</h3>
              <p className="text-gray-400 text-sm sm:text-base">
                Be the first to upload educational content to this platform!
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="explore" className="py-12 sm:py-16 lg:py-20 px-4">
      <div className="container-responsive">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="heading-responsive font-bold text-white mb-4">
            Explore Educational Content
          </h2>
          <p className="text-gray-400 text-responsive max-w-2xl mx-auto">
            Discover a vast collection of educational videos carefully curated by expert educators
          </p>
        </div>

        <InfiniteScroll
          dataLength={videos.length}
          next={fetchMoreVideos}
          hasMore={hasMore}
          loader={
            <div className="col-span-full text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-400 mt-2 text-sm">Loading more videos...</p>
            </div>
          }
          endMessage={
            <div className="col-span-full text-center py-8 text-gray-400">
              <p>🎉 You've seen all available videos!</p>
            </div>
          }
          // Optimize scroll performance
          style={{ overflow: 'visible' }}
        >
          <div className="grid-responsive">
            {videoGrid}
          </div>
        </InfiniteScroll>
      </div>
    </section>
  );
};

export default ExploreSection;
