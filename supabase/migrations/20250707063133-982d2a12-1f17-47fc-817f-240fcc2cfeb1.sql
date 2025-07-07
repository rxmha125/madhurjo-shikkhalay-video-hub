
-- Create video_likes table for real-time like system
CREATE TABLE public.video_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (video_id) REFERENCES public.videos(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  UNIQUE(video_id, user_id)
);

-- Enable RLS on video_likes table
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for video_likes
CREATE POLICY "Users can view all video likes" ON public.video_likes
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own likes" ON public.video_likes
FOR INSERT WITH CHECK (user_id IN (
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete their own likes" ON public.video_likes
FOR DELETE USING (user_id IN (
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
));

-- Enable realtime for video_likes table
ALTER TABLE public.video_likes REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.video_likes;

-- Enable realtime for comments table for real-time comment updates
ALTER TABLE public.comments REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.comments;

-- Enable realtime for videos_for_approval table for admin count updates
ALTER TABLE public.videos_for_approval REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.videos_for_approval;
