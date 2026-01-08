-- Migration: 038_create_public_advertisements.sql
-- Create table public_advertisements with RLS and supporting objects
BEGIN;

-- Drop table if exists to allow re-runs
DROP TABLE IF EXISTS public_advertisements CASCADE;

CREATE TABLE public_advertisements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  content TEXT,
  image_url TEXT NOT NULL,
  pdf_url TEXT,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public_advertisements ENABLE ROW LEVEL SECURITY;

-- Public select policy: allow anyone to view active ads (no expiration check for simplicity)
CREATE POLICY "Public ads are viewable by everyone"
ON public_advertisements FOR SELECT
USING (is_active = TRUE);

-- Admin insert policy
CREATE POLICY "Admins can insert ads"
ON public_advertisements FOR INSERT
WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Admin update policy
CREATE POLICY "Admins can update ads"
ON public_advertisements FOR UPDATE
USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Admin delete policy
CREATE POLICY "Admins can delete ads"
ON public_advertisements FOR DELETE
USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Index to speed up active queries
CREATE INDEX IF NOT EXISTS idx_ads_active ON public_advertisements(is_active, priority DESC);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp ON public_advertisements;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public_advertisements
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Example data (insert test ad)
INSERT INTO public_advertisements (title, subtitle, content, image_url, is_active, priority)
VALUES (
  'Fête paroissiale 2026',
  'Célébration et repas communautaire',
  'Rejoignez-nous pour la fête annuelle de la paroisse. Dimanche 15 janvier à partir de 11h.',
  'https://images.unsplash.com/photo-1540575467063-178cb50ee898?w=800&h=400&fit=crop',
  TRUE,
  10
) ON CONFLICT DO NOTHING;

COMMIT;
