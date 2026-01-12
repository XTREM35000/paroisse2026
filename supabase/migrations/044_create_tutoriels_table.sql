-- Create tutoriels table for admin tutorial videos
CREATE TABLE IF NOT EXISTS public.tutoriels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  youtube_id TEXT NOT NULL UNIQUE,
  duration TEXT DEFAULT '00:00',
  category TEXT NOT NULL DEFAULT 'videos' CHECK (category IN ('videos', 'images', 'pages', 'users', 'configuration')),
  difficulty TEXT NOT NULL DEFAULT 'débutant' CHECK (difficulty IN ('débutant', 'intermédiaire', 'avancé')),
  steps TEXT[] DEFAULT '{}',
  related_pages TEXT[] DEFAULT '{}',
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_tutoriels_category ON public.tutoriels(category);
CREATE INDEX idx_tutoriels_difficulty ON public.tutoriels(difficulty);
CREATE INDEX idx_tutoriels_created_at ON public.tutoriels(created_at DESC);

-- Enable RLS
ALTER TABLE public.tutoriels ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admins can do everything, others can only read
CREATE POLICY "Admin can view, insert, update, delete tutoriels"
  ON public.tutoriels
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Anyone can view tutoriels"
  ON public.tutoriels
  FOR SELECT
  USING (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tutoriels TO authenticated;
GRANT SELECT ON public.tutoriels TO anon;
