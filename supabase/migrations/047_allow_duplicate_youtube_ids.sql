-- Remove UNIQUE constraint on youtube_id to allow duplicate videos for testing/demo
-- In production, you may want to restore this constraint

ALTER TABLE public.tutoriels DROP CONSTRAINT tutoriels_youtube_id_key;
