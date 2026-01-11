-- MIGRATION: Add is_active column to profiles table

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Backfill existing profiles to be active
UPDATE public.profiles
SET is_active = TRUE
WHERE is_active IS NULL;

-- Make is_active NOT NULL after backfill
ALTER TABLE public.profiles
  ALTER COLUMN is_active SET NOT NULL;

-- Index for faster queries on active profiles
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- Comment for documentation
COMMENT ON COLUMN public.profiles.is_active IS 'Indicates whether the profile account is active for receiving notifications and participating in the community.';
