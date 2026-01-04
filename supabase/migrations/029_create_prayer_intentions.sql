-- Create prayer_intentions table
CREATE TABLE IF NOT EXISTS public.prayer_intentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  submitted_by_name text,
  submitted_by_email text,
  is_anonymous boolean DEFAULT false,
  category text DEFAULT 'autre',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'archived')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.prayer_intentions ENABLE ROW LEVEL SECURITY;

-- Allow admins to CRUD all prayers
CREATE POLICY "Admins can CRUD prayer_intentions"
  ON public.prayer_intentions
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

-- Allow everyone to INSERT prayer intentions (submit)
CREATE POLICY "Anyone can submit prayer intentions"
  ON public.prayer_intentions
  FOR INSERT
  WITH CHECK (true);

-- Allow everyone to SELECT approved prayers
CREATE POLICY "Anyone can view approved prayer intentions"
  ON public.prayer_intentions
  FOR SELECT
  USING (status = 'approved');

-- Create index for performance
CREATE INDEX idx_prayer_intentions_status ON public.prayer_intentions(status);
CREATE INDEX idx_prayer_intentions_created_at ON public.prayer_intentions(created_at DESC);
CREATE INDEX idx_prayer_intentions_category ON public.prayer_intentions(category);
