
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { generateSessionId } from '../utils/timeUtils';

export const useViewTracking = (videoId: string) => {
  const { profile } = useAuth();

  useEffect(() => {
    if (!videoId) return;

    const trackView = async () => {
      try {
        const sessionId = localStorage.getItem('session_id') || generateSessionId();
        localStorage.setItem('session_id', sessionId);

        // Check if this user/session has already viewed this video
        const { data: existingView } = await supabase
          .from('video_views')
          .select('id')
          .eq('video_id', videoId)
          .eq('session_id', sessionId)
          .eq('user_id', profile?.id || null)
          .single();

        if (existingView) return; // Already viewed

        // Insert new view
        const { error } = await supabase
          .from('video_views')
          .insert({
            video_id: videoId,
            user_id: profile?.id || null,
            session_id: sessionId
          });

        if (error) throw error;

        // Update video views count
        const { data: viewCount } = await supabase
          .from('video_views')
          .select('id', { count: 'exact' })
          .eq('video_id', videoId);

        if (viewCount) {
          await supabase
            .from('videos')
            .update({ views: viewCount.length })
            .eq('id', videoId);
        }
      } catch (error) {
        console.error('Error tracking view:', error);
      }
    };

    const timer = setTimeout(trackView, 1000); // Track after 1 second
    return () => clearTimeout(timer);
  }, [videoId, profile]);
};
