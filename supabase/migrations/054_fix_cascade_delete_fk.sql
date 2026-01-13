-- Migration: Fix foreign key constraint on donations.donor_id to enable cascade delete

BEGIN;

-- Drop the existing constraint that prevents deletion
ALTER TABLE public.donations
DROP CONSTRAINT IF EXISTS donations_donor_id_fkey;

-- Recreate with ON DELETE CASCADE
ALTER TABLE public.donations
ADD CONSTRAINT donations_donor_id_fkey
FOREIGN KEY (donor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

COMMIT;
