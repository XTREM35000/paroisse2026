-- MIGRATION: Fix notifications table schema - ensure message OR body column exists

-- Check if 'message' column exists (production might have it instead of 'body')
-- If it exists, make it nullable to avoid NOT NULL constraint violations
ALTER TABLE public.notifications
  ALTER COLUMN message DROP NOT NULL;

-- Ensure 'body' column also exists (for compatibility)
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS body TEXT;

-- If both exist, body is the primary column we use in the app
-- message might be deprecated but leaving it for backward compatibility

-- Update any existing rows with NULL message to use body if available
UPDATE public.notifications
SET message = body
WHERE message IS NULL AND body IS NOT NULL;

-- Recreate indexes
DROP INDEX IF EXISTS idx_notifications_user_is_read;
CREATE INDEX idx_notifications_user_is_read ON public.notifications(user_id, is_read);

-- Force schema cache refresh
COMMENT ON TABLE public.notifications IS 'User notifications - primary columns are: id, user_id, title, body (or message for legacy), is_read, metadata, created_at. Supports both body and message for compatibility.';

NOTIFY pgrst, 'reload schema';
