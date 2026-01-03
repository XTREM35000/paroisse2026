-- =====================================================
-- MIGRATION: Création de la table header_config
-- Permet la gestion dynamique du logo, titre et navigation du Header
-- =====================================================

-- 1. Créer la table header_config
CREATE TABLE IF NOT EXISTS public.header_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Logo
  logo_url TEXT,
  logo_alt_text VARCHAR(100) DEFAULT 'Logo Paroisse',
  logo_size VARCHAR(20) DEFAULT 'sm' CHECK (logo_size IN ('sm', 'md', 'lg')),
  
  -- Titres
  main_title VARCHAR(100) DEFAULT 'Paroisse Notre Dame',
  subtitle VARCHAR(100) DEFAULT 'de la Compassion',
  
  -- Navigation items en JSONB
  navigation_items JSONB DEFAULT '[]'::jsonb,
  
  -- Métadonnées
  is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Créer les index
CREATE INDEX idx_header_config_active ON public.header_config(is_active);

-- 3. Activer RLS
ALTER TABLE public.header_config ENABLE ROW LEVEL SECURITY;

-- 4. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Header config is viewable by everyone" ON public.header_config;
DROP POLICY IF EXISTS "Only admins can manage header config" ON public.header_config;

-- 5. Politique de lecture pour tous
CREATE POLICY "Header config is viewable by everyone"
  ON public.header_config
  FOR SELECT
  TO public
  USING (is_active = TRUE);

-- 6. Politique d'écriture pour les admins seulement
CREATE POLICY "Only admins can manage header config"
  ON public.header_config
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- 7. Insérer la configuration par défaut
INSERT INTO public.header_config (
  logo_url,
  logo_alt_text,
  logo_size,
  main_title,
  subtitle,
  navigation_items,
  is_active
) VALUES (
  NULL,
  'Logo Paroisse Notre Dame de la Compassion',
  'sm',
  'Paroisse Notre Dame',
  'de la Compassion',
  '[
    {"label": "Accueil", "href": "/", "icon": "home"},
    {"label": "À propos", "href": "/a-propos", "icon": "info"}
  ]'::jsonb,
  TRUE
)
ON CONFLICT DO NOTHING;

-- 8. Créer la fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_header_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Créer le trigger
DROP TRIGGER IF EXISTS update_header_config_timestamp ON public.header_config;
CREATE TRIGGER update_header_config_timestamp
  BEFORE UPDATE ON public.header_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_header_config_timestamp();
