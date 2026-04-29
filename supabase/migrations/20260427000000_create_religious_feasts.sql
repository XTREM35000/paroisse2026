-- =====================================================
-- MIGRATION: Création de la table religious_feasts
-- Corrige les erreurs 404 sur /rest/v1/religious_feasts
-- =====================================================

-- 1) Table principale (alignée au schéma applicatif existant)
CREATE TABLE IF NOT EXISTS public.religious_feasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  feast_type VARCHAR(20) DEFAULT 'fixed',
  liturgy_color VARCHAR(7) DEFAULT '#8B0000',
  gospel_reference TEXT,
  homily_id UUID,
  prayer_text TEXT,
  reflection_text TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT religious_feasts_feast_type_check
    CHECK (feast_type IN ('fixed', 'movable'))
);

-- 2) Index utiles
CREATE INDEX IF NOT EXISTS idx_religious_feasts_date
  ON public.religious_feasts(date);

CREATE INDEX IF NOT EXISTS idx_religious_feasts_is_active
  ON public.religious_feasts(is_active);

-- 3) RLS
ALTER TABLE public.religious_feasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Religious feasts are viewable by everyone" ON public.religious_feasts;
DROP POLICY IF EXISTS "Only admins can manage religious feasts" ON public.religious_feasts;

CREATE POLICY "Religious feasts are viewable by everyone"
  ON public.religious_feasts
  FOR SELECT
  TO public
  USING (TRUE);

CREATE POLICY "Only admins can manage religious feasts"
  ON public.religious_feasts
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin', 'developer', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin', 'developer', 'admin')
    )
  );

-- 4) Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_religious_feasts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_religious_feasts_updated_at ON public.religious_feasts;
CREATE TRIGGER update_religious_feasts_updated_at
  BEFORE UPDATE ON public.religious_feasts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_religious_feasts_timestamp();

-- 5) Seed de fêtes fixes 2026
INSERT INTO public.religious_feasts (name, date, liturgy_color, is_active, feast_type) VALUES
  ('Nouvel An', '2026-01-01', '#E74C3C', TRUE, 'fixed'),
  ('Épiphanie', '2026-01-06', '#F39C12', TRUE, 'fixed'),
  ('Présentation de Jésus au Temple', '2026-02-02', '#F1C40F', TRUE, 'fixed'),
  ('Cendres', '2026-02-18', '#7F8C8D', TRUE, 'movable'),
  ('Saint Joseph', '2026-03-19', '#2ECC71', TRUE, 'fixed'),
  ('Annonciation', '2026-03-25', '#3498DB', TRUE, 'fixed'),
  ('Rameaux', '2026-03-29', '#9B59B6', TRUE, 'movable'),
  ('Pâques', '2026-04-05', '#E74C3C', TRUE, 'movable'),
  ('Ascension', '2026-05-14', '#3498DB', TRUE, 'movable'),
  ('Pentecôte', '2026-05-24', '#E74C3C', TRUE, 'movable'),
  ('Trinité', '2026-05-31', '#9B59B6', TRUE, 'movable'),
  ('Corpus Christi', '2026-06-11', '#F39C12', TRUE, 'movable'),
  ('Sacré-Cœur', '2026-06-19', '#E74C3C', TRUE, 'movable'),
  ('Assomption', '2026-08-15', '#3498DB', TRUE, 'fixed'),
  ('Toussaint', '2026-11-01', '#F1C40F', TRUE, 'fixed'),
  ('Christ-Roi', '2026-11-22', '#2ECC71', TRUE, 'movable'),
  ('Immaculée Conception', '2026-12-08', '#3498DB', TRUE, 'fixed'),
  ('Noël', '2026-12-25', '#E74C3C', TRUE, 'fixed')
ON CONFLICT DO NOTHING;
