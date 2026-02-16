-- =====================================================
-- LIVE STREAM SOURCES MIGRATION
-- =====================================================
-- Table pour stocker les liens fournisseurs (YouTube, Facebook, Instagram, TikTok, etc.)
-- associés à chaque live stream

-- Créer la table live_stream_sources
CREATE TABLE IF NOT EXISTS live_stream_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('youtube', 'facebook', 'instagram', 'tiktok', 'custom')),
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index sur live_id pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_live_stream_sources_live_id ON live_stream_sources(live_id);

-- Index composite pour recherche rapide provider + live_id
CREATE INDEX IF NOT EXISTS idx_live_stream_sources_live_provider ON live_stream_sources(live_id, provider);

-- Activer RLS (Row Level Security)
ALTER TABLE live_stream_sources ENABLE ROW LEVEL SECURITY;

-- Policy : Tout le monde peut lire les sources (publiques)
CREATE POLICY "Anyone can read live stream sources"
  ON live_stream_sources
  FOR SELECT
  USING (true);

-- Policy : Seulement les utilisateurs authentifiés peuvent insérer
-- NOTE: Les vérifications de rôle admin doivent être faites côté application
CREATE POLICY "Authenticated users can insert live stream sources"
  ON live_stream_sources
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy : Seulement les utilisateurs authentifiés peuvent mettre à jour
CREATE POLICY "Authenticated users can update live stream sources"
  ON live_stream_sources
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Policy : Seulement les utilisateurs authentifiés peuvent supprimer
CREATE POLICY "Authenticated users can delete live stream sources"
  ON live_stream_sources
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT SELECT ON live_stream_sources TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON live_stream_sources TO authenticated;

