-- Ensure image_url column exists in announcements table
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create index if not exists
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(created_at DESC);
