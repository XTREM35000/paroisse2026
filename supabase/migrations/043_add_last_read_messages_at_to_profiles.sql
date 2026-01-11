-- MIGRATION: Add last_read_messages_at column to profiles table and force schema refresh

-- Add the column if it doesn't exist
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_read_messages_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_profiles_last_read_messages_at ON public.profiles(last_read_messages_at);

-- Update comment to force PostgREST cache refresh
COMMENT ON TABLE public.profiles IS 'User profiles with last_read_messages_at tracking';

-- Force schema introspection refresh
NOTIFY pgrst, 'reload schema';

-- Additional wait to ensure cache is cleared
SELECT pg_sleep(0.1);

-- Notify again for good measure
NOTIFY pgrst, 'reload schema';
