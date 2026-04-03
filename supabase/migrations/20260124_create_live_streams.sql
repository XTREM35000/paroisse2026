-- ============================================
-- Mise à jour de la table live_streams
-- Version : suppression + recréation propre
-- ============================================

-- 1. Supprimer les politiques existantes (si elles existent)
DROP POLICY IF EXISTS "live_streams_select_authenticated" ON public.live_streams;
DROP POLICY IF EXISTS "live_streams_insert_admin" ON public.live_streams;
DROP POLICY IF EXISTS "live_streams_update_admin" ON public.live_streams;
DROP POLICY IF EXISTS "live_streams_delete_admin" ON public.live_streams;

-- 2. Supprimer l'index existant (optionnel, pour repartir sur une base propre)
DROP INDEX IF EXISTS idx_live_streams_is_active;

-- 3. Créer ou mettre à jour la table
CREATE TABLE IF NOT EXISTS public.live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  stream_url TEXT NOT NULL,
  stream_type TEXT NOT NULL CHECK (stream_type IN ('tv', 'radio')),
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Activer RLS
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;

-- 5. Recréer les politiques
-- Politique SELECT : tous les utilisateurs authentifiés peuvent voir
CREATE POLICY "live_streams_select_authenticated"
  ON public.live_streams
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Politique INSERT : seulement les admins
CREATE POLICY "live_streams_insert_admin"
  ON public.live_streams
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Politique UPDATE : seulement les admins
CREATE POLICY "live_streams_update_admin"
  ON public.live_streams
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Politique DELETE : seulement les admins
CREATE POLICY "live_streams_delete_admin"
  ON public.live_streams
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 6. Recréer l'index
CREATE INDEX IF NOT EXISTS idx_live_streams_is_active
  ON public.live_streams(is_active DESC, updated_at DESC);

-- 7. Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Table live_streams et ses politiques ont été recréées avec succès !';
END $$;