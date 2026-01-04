-- Create homilies table
CREATE TABLE IF NOT EXISTS public.homilies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  priest_name text NOT NULL,
  description text,
  homily_date date NOT NULL,
  video_url text,
  image_url text,
  transcript text,
  duration_minutes integer,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.homilies ENABLE ROW LEVEL SECURITY;

-- Allow admins to CRUD all homilies
CREATE POLICY "Admins can CRUD homilies"
  ON public.homilies
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin', 'administrateur')
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin', 'administrateur')
    )
  );

-- Allow everyone to SELECT (view) homilies
CREATE POLICY "Anyone can view homilies"
  ON public.homilies
  FOR SELECT
  USING (true);

-- Create index for performance
CREATE INDEX idx_homilies_date ON public.homilies(homily_date DESC);
CREATE INDEX idx_homilies_priest ON public.homilies(priest_name);
