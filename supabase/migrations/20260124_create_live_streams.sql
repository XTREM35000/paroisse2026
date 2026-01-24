-- Create live_streams table
CREATE TABLE IF NOT EXISTS public.live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  stream_url TEXT NOT NULL,
  stream_type TEXT NOT NULL CHECK (stream_type IN ('tv', 'radio')),
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT for all authenticated users
CREATE POLICY "live_streams_select_authenticated"
  ON public.live_streams
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: INSERT only for admins
CREATE POLICY "live_streams_insert_admin"
  ON public.live_streams
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: UPDATE only for admins
CREATE POLICY "live_streams_update_admin"
  ON public.live_streams
  FOR UPDATE
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

-- Policy: DELETE only for admins
CREATE POLICY "live_streams_delete_admin"
  ON public.live_streams
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create index for is_active and updated_at (useful for queries)
CREATE INDEX IF NOT EXISTS idx_live_streams_is_active
  ON public.live_streams(is_active DESC, updated_at DESC);
