
import React, { useState, useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import VideoCard from './VideoCard';

interface Video {
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
  approved: boolean;
}

const ExploreSection = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = () => {
    // Simulate loading videos from MongoDB
    // In real app, this would fetch from your backend API
    setTimeout(() => {
      const newVideos: Video[] = [];
      
      // Add some sample videos if needed for demonstration
      // Note: Real app should only show approved videos
      
      setVideos(prev => [...prev, ...newVideos]);
      setHasMore(false); // No more videos to load for now
      setLoading(false);
    }, 1000);
  };

  const fetchMoreVideos = () => {
    if (videos.length >= 20) {
      setHasMore(false);
      return;
    }
    loadVideos();
  };

  return (
    <section id="explore" className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Explore Educational Content
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Discover a vast collection of educational videos carefully curated by expert educators
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
          <div className="text-center py-20">
            <div className="rounded-card p-12 max-w-md mx-auto">
              <div className="text-6xl mb-4">📹</div>
              <h3 className="text-xl font-semibold text-white mb-2">No videos available</h3>
              <p className="text-gray-400">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video) => (
                <VideoCard key={video._id} video={video} />
              ))}
            </div>
          </InfiniteScroll>
        )}
      </div>
    </section>
  );
};

export default ExploreSection;
