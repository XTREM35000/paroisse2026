-- ============================================================================
-- Migration: Ajouter title et subtitle à page_hero_banners
-- À exécuter dans Supabase Dashboard → SQL Editor si besoin
-- ============================================================================

ALTER TABLE public.page_hero_banners
  ADD COLUMN IF NOT EXISTS title TEXT DEFAULT NULL;

ALTER TABLE public.page_hero_banners
  ADD COLUMN IF NOT EXISTS subtitle TEXT DEFAULT NULL;

COMMENT ON COLUMN public.page_hero_banners.title IS 'Titre du bandeau hero de la page';
COMMENT ON COLUMN public.page_hero_banners.subtitle IS 'Sous-titre du bandeau hero de la page';


-- ============================================================================
-- COMMANDES UTILES (SQL Editor – exécuter au besoin, une par une)
-- ============================================================================

-- ----- Supprimer tout le contenu d'une page (ATTENTION: irréversible) -----

-- Supprimer toutes les vidéos:
-- DELETE FROM public.videos;

-- Supprimer tous les événements:
-- DELETE FROM public.events;

-- Supprimer toutes les homélies:
-- DELETE FROM public.homilies;

-- Supprimer toutes les images de la galerie:
-- DELETE FROM public.gallery_images;

-- Supprimer toutes les intentions de prière:
-- DELETE FROM public.prayer_intentions;

-- (Adapter selon les tables réelles de votre projet.)

-- ----- Réinitialiser le hero d'une page aux valeurs par défaut -----

-- Exemple pour /videos:
-- INSERT INTO public.page_hero_banners (path, title, subtitle, image_url, updated_at)
-- VALUES ('/videos', 'Vidéos', 'Retrouvez nos messes et enseignements', NULL, NOW())
-- ON CONFLICT (path) DO UPDATE SET
--   title = EXCLUDED.title,
--   subtitle = EXCLUDED.subtitle,
--   updated_at = NOW();

-- Exemple pour /homilies:
-- INSERT INTO public.page_hero_banners (path, title, subtitle, image_url, updated_at)
-- VALUES ('/homilies', 'Les Homélies', 'Écoutez les prédications de nos prêtres', NULL, NOW())
-- ON CONFLICT (path) DO UPDATE SET
--   title = EXCLUDED.title,
--   subtitle = EXCLUDED.subtitle,
--   updated_at = NOW();

-- Exemple pour /evenements:
-- INSERT INTO public.page_hero_banners (path, title, subtitle, image_url, updated_at)
-- VALUES ('/evenements', 'Événements', 'Ne manquez aucun rendez-vous', NULL, NOW())
-- ON CONFLICT (path) DO UPDATE SET
--   title = EXCLUDED.title,
--   subtitle = EXCLUDED.subtitle,
--   updated_at = NOW();

-- ----- Vérifier la structure de la table -----
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'page_hero_banners'
-- ORDER BY ordinal_position;
