-- Create campaigns table
CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  goal_amount numeric(15,2) NOT NULL,
  raised_amount numeric(15,2) DEFAULT 0,
  image_url text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  start_date date NOT NULL,
  end_date date,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Allow admins to CRUD all campaigns
CREATE POLICY "Admins can CRUD campaigns"
  ON public.campaigns
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

-- Allow everyone to SELECT (view) campaigns
CREATE POLICY "Anyone can view campaigns"
  ON public.campaigns
  FOR SELECT
  USING (true);

-- Create index for performance
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_campaigns_start_date ON public.campaigns(start_date DESC);
