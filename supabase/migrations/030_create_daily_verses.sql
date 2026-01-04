-- Create daily_verses table
CREATE TABLE IF NOT EXISTS public.daily_verses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book text NOT NULL,
  chapter integer NOT NULL,
  verse_start integer NOT NULL,
  verse_end integer,
  text text NOT NULL,
  commentary text,
  image_url text,
  featured_date date NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.daily_verses ENABLE ROW LEVEL SECURITY;

-- Allow admins to CRUD all verses
CREATE POLICY "Admins can CRUD daily_verses"
  ON public.daily_verses
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

-- Allow everyone to SELECT (view) verses
CREATE POLICY "Anyone can view daily_verses"
  ON public.daily_verses
  FOR SELECT
  USING (true);

-- Create index for performance
CREATE INDEX idx_daily_verses_featured_date ON public.daily_verses(featured_date DESC);
CREATE INDEX idx_daily_verses_book ON public.daily_verses(book);
