
-- Create videos_for_approval table with same structure as videos table
CREATE TABLE public.videos_for_approval (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  video_url TEXT,
  creator_id UUID,
  views INTEGER DEFAULT 0,
  visibility TEXT DEFAULT 'public',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (creator_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Enable RLS on videos_for_approval table
ALTER TABLE public.videos_for_approval ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for videos_for_approval
CREATE POLICY "Users can view their own pending videos" ON public.videos_for_approval
FOR SELECT USING (creator_id IN (
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can view all pending videos" ON public.videos_for_approval
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Users can insert their own pending videos" ON public.videos_for_approval
FOR INSERT WITH CHECK (creator_id IN (
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete their own pending videos" ON public.videos_for_approval
FOR DELETE USING (creator_id IN (
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can delete any pending videos" ON public.videos_for_approval
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

-- Update videos table RLS to only show approved videos (remove is_approved logic)
DROP POLICY IF EXISTS "Users can view approved videos" ON public.videos;
CREATE POLICY "Users can view all videos" ON public.videos
FOR SELECT USING (true);

-- Add policy for admins to insert approved videos directly
CREATE POLICY "Admins can insert videos directly" ON public.videos
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);
