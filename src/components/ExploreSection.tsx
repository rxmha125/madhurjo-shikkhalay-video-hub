
import React, { useState, useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import VideoCard from './VideoCard';
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
  const limit = 12;

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      // Only query videos table (approved videos)
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
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching videos:', error);
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

        if (offset === 0) {
          setVideos(formattedVideos);
        } else {
          setVideos(prev => [...prev, ...formattedVideos]);
        }

        if (formattedVideos.length < limit) {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error('Error loading videos:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchMoreVideos = () => {
    if (!hasMore) return;
    setOffset(prev => prev + limit);
    loadVideos();
  };

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

        {loading ? (
          <div className="grid-responsive">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-card p-4 animate-pulse">
                <div className="bg-gray-700 aspect-video rounded-lg mb-4"></div>
                <div className="space-y-2">
                  <div className="bg-gray-700 h-4 rounded w-3/4"></div>
                  <div className="bg-gray-700 h-3 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-16 sm:py-20">
            <div className="rounded-card p-8 sm:p-12 max-w-md mx-auto">
              <div className="text-4xl sm:text-6xl mb-4">📹</div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No videos available</h3>
              <p className="text-gray-400 text-sm sm:text-base">
                Be the first to upload educational content to this platform!
              </p>
            </div>
          </div>
        ) : (
          <InfiniteScroll
            dataLength={videos.length}
            next={fetchMoreVideos}
            hasMore={hasMore}
            loader={
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            }
            endMessage={
              <div className="text-center py-8 text-gray-400">
                No more videos available.
              </div>
            }
          >
            <div className="grid-responsive">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </InfiniteScroll>
        )}
      </div>
    </section>
  );
};

export default ExploreSection;
