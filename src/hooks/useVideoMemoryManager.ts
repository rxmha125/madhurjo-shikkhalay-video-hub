
import { useEffect, useRef } from 'react';

interface VideoMemoryManagerOptions {
  maxCachedVideos?: number;
  cleanupThreshold?: number;
}

export const useVideoMemoryManager = (
  options: VideoMemoryManagerOptions = {}
) => {
  const { maxCachedVideos = 50, cleanupThreshold = 100 } = options;
  const videoRefsMap = useRef<Map<string, HTMLVideoElement>>(new Map());
  const visibilityMap = useRef<Map<string, boolean>>(new Map());

  const registerVideo = (videoId: string, videoElement: HTMLVideoElement) => {
    videoRefsMap.current.set(videoId, videoElement);
  };

  const unregisterVideo = (videoId: string) => {
    const videoElement = videoRefsMap.current.get(videoId);
    if (videoElement) {
      // Pause and clear the video to free memory
      videoElement.pause();
      videoElement.src = '';
      videoElement.load();
    }
    videoRefsMap.current.delete(videoId);
    visibilityMap.current.delete(videoId);
  };

  const updateVisibility = (videoId: string, isVisible: boolean) => {
    visibilityMap.current.set(videoId, isVisible);
    
    // If we have too many cached videos, cleanup invisible ones
    if (videoRefsMap.current.size > cleanupThreshold) {
      cleanupInvisibleVideos();
    }
  };

  const cleanupInvisibleVideos = () => {
    const invisibleVideos: string[] = [];
    
    visibilityMap.current.forEach((isVisible, videoId) => {
      if (!isVisible) {
        invisibleVideos.push(videoId);
      }
    });

    // Remove oldest invisible videos if we exceed the cache limit
    if (invisibleVideos.length > maxCachedVideos) {
      const videosToRemove = invisibleVideos.slice(0, invisibleVideos.length - maxCachedVideos);
      videosToRemove.forEach(videoId => {
        unregisterVideo(videoId);
      });
    }
  };

  const forceCleanup = () => {
    visibilityMap.current.forEach((isVisible, videoId) => {
      if (!isVisible) {
        unregisterVideo(videoId);
      }
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      videoRefsMap.current.forEach((_, videoId) => {
        unregisterVideo(videoId);
      });
    };
  }, []);

  return {
    registerVideo,
    unregisterVideo,
    updateVisibility,
    forceCleanup,
    getCachedVideoCount: () => videoRefsMap.current.size,
  };
};
