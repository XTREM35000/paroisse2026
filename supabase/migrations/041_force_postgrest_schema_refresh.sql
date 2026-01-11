-- MIGRATION: Force PostgREST schema cache refresh for notifications table

-- Restart the schema cache by adding/modifying a comment (forces invalidation)
COMMENT ON TABLE public.notifications IS 'User notifications with columns: id, user_id, title, body, is_read, metadata (JSONB), created_at';

-- Ensure all columns exist and are correct type
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS user_id UUID;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS title TEXT;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS body TEXT;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS metadata JSONB;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Ensure foreign key constraint exists
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_user_id_fkey CASCADE;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Recreate index
DROP INDEX IF EXISTS idx_notifications_user_is_read;
CREATE INDEX idx_notifications_user_is_read ON public.notifications(user_id, is_read);

-- Force schema introspection refresh
NOTIFY pgrst, 'reload schema';
