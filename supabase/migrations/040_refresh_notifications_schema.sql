-- MIGRATION: Refresh notifications schema cache and ensure columns exist

-- This migration ensures the notifications table has all required columns.
-- Supabase caches the schema, so if you added columns manually, you may need to restart/refresh.

-- Verify and ensure all columns exist
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS body TEXT;

-- Ensure message column doesn't conflict (in case there's confusion)
-- The table uses 'body', not 'message'

-- Grant permissions to authenticated users and admins
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;

-- Force schema cache refresh by adding a comment
COMMENT ON TABLE public.notifications IS 'Stores notifications sent to users with columns: id, user_id, title, body, is_read, metadata, created_at';

-- Verify structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'notifications'
ORDER BY ordinal_position;
