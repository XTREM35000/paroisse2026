-- 2026-02-02: Ajouter colonnes slug/seo/content aux événements et backfill des slugs
-- Ajoute les colonnes `slug`, `seo_title`, `seo_description`, `content` sur `public.events`.
-- Génère des slugs uniques pour les événements existants et applique une contrainte unique.

BEGIN;

-- 1) Ajouter les colonnes si elles n'existent pas
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS slug TEXT;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS seo_title TEXT;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS seo_description TEXT;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS content TEXT;

-- 2) Backfill: générer des slugs lisibles et uniques pour les événements sans slug
DO $$
DECLARE
  rec RECORD;
  base TEXT;
  candidate TEXT;
  idx INT;
BEGIN
  FOR rec IN SELECT id, COALESCE(title, '') AS title FROM public.events WHERE slug IS NULL OR slug = '' ORDER BY created_at NULLS FIRST LOOP
    base := lower(
      regexp_replace(
        regexp_replace(rec.title, '[^a-z0-9\s\-]', '', 'gi'),
        '[\s\-]+', '-', 'g'
      )
    );

    IF base IS NULL OR base = '' THEN
      base := 'event-' || rec.id::text;
    END IF;

    candidate := base;
    idx := 1;

    WHILE EXISTS (SELECT 1 FROM public.events WHERE slug = candidate) LOOP
      candidate := base || '-' || idx;
      idx := idx + 1;
    END LOOP;

    UPDATE public.events SET slug = candidate WHERE id = rec.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3) S'assurer de l'unicité et de la non-nullité du slug
ALTER TABLE public.events
  ALTER COLUMN slug SET NOT NULL;

ALTER TABLE public.events
  ADD CONSTRAINT events_slug_unique UNIQUE (slug);

-- 4) Commentaires
COMMENT ON COLUMN public.events.slug IS 'Slug URL-friendly pour l''URL de la page d''événement';
COMMENT ON COLUMN public.events.seo_title IS 'Titre SEO optionnel pour la page d''événement';
COMMENT ON COLUMN public.events.seo_description IS 'Description SEO optionnelle';
COMMENT ON COLUMN public.events.content IS 'Contenu HTML/markdown optionnel pour la page d''événement';

COMMIT;
