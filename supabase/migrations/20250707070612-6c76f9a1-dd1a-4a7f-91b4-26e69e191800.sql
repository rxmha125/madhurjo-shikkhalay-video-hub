
-- Create thumbnails table for proper thumbnail storage
CREATE TABLE public.thumbnails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL,
  thumbnail_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (video_id) REFERENCES public.videos(id) ON DELETE CASCADE
);

-- Create follows table for follow system
CREATE TABLE public.follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (follower_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  UNIQUE(follower_id, following_id)
);

-- Create video_views table to track unique views per user
CREATE TABLE public.video_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL,
  user_id UUID,
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (video_id) REFERENCES public.videos(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  UNIQUE(video_id, user_id, session_id)
);

-- Enable RLS on new tables
ALTER TABLE public.thumbnails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_views ENABLE ROW LEVEL SECURITY;

-- RLS policies for thumbnails
CREATE POLICY "Users can view all thumbnails" ON public.thumbnails
FOR SELECT USING (true);

CREATE POLICY "Users can insert thumbnails for their videos" ON public.thumbnails
FOR INSERT WITH CHECK (video_id IN (
  SELECT id FROM public.videos WHERE creator_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Users can update thumbnails for their videos" ON public.thumbnails
FOR UPDATE USING (video_id IN (
  SELECT id FROM public.videos WHERE creator_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
));

-- RLS policies for follows
CREATE POLICY "Users can view all follows" ON public.follows
FOR SELECT USING (true);

CREATE POLICY "Users can follow others" ON public.follows
FOR INSERT WITH CHECK (follower_id IN (
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can unfollow others" ON public.follows
FOR DELETE USING (follower_id IN (
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
));

-- RLS policies for video_views
CREATE POLICY "Users can view all video views" ON public.video_views
FOR SELECT USING (true);

CREATE POLICY "Anyone can insert video views" ON public.video_views
FOR INSERT WITH CHECK (true);

-- Enable realtime for new tables
ALTER TABLE public.thumbnails REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.thumbnails;

ALTER TABLE public.follows REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.follows;

ALTER TABLE public.video_views REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.video_views;

-- Add video_url column to videos_for_approval if it doesn't exist
ALTER TABLE public.videos_for_approval 
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Create policy for users to delete their own videos
CREATE POLICY "Users can delete their own videos" ON public.videos
FOR DELETE USING (creator_id IN (
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
));

-- Allow notifications to be inserted programmatically
CREATE POLICY "System can insert notifications" ON public.notifications
FOR INSERT WITH CHECK (true);
