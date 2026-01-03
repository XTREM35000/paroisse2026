-- =====================================================
-- MIGRATION: Création de la table directory (Annuaire)
-- Gère les membres et services de la paroisse
-- =====================================================

-- 1. Créer la table directory (services et membres)
CREATE TABLE IF NOT EXISTS public.directory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informations de base
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- 'service' | 'member' | 'clergy'
  
  -- Contact
  email VARCHAR(100),
  phone VARCHAR(30),
  website VARCHAR(255),
  
  -- Images
  image_url TEXT,
  
  -- Métadonnées
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- 2. Créer les index
CREATE INDEX idx_directory_category ON public.directory(category);
CREATE INDEX idx_directory_active ON public.directory(is_active);
CREATE INDEX idx_directory_order ON public.directory(display_order);

-- 3. Activer RLS
ALTER TABLE public.directory ENABLE ROW LEVEL SECURITY;

-- 4. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Directory is viewable by everyone" ON public.directory;
DROP POLICY IF EXISTS "Only admins can manage directory" ON public.directory;

-- 5. Politique de lecture pour tous
CREATE POLICY "Directory is viewable by everyone"
  ON public.directory
  FOR SELECT
  TO public
  USING (is_active = TRUE);

-- 6. Politique d'écriture pour les admins seulement
CREATE POLICY "Only admins can manage directory"
  ON public.directory
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

-- 7. Créer la fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_directory_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Créer le trigger
DROP TRIGGER IF EXISTS update_directory_timestamp ON public.directory;
CREATE TRIGGER update_directory_timestamp
  BEFORE UPDATE ON public.directory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_directory_timestamp();

-- 9. Insérer des données d'exemple
INSERT INTO public.directory (name, description, category, email, phone, display_order, image_url) VALUES
  ('Messe Dominicale', 'Messe le dimanche matin à 10h30', 'service', 'messes@paroisse.fr', '+33 1 23 45 67 89', 1, NULL),
  ('Confessions', 'Confessions le samedi de 16h à 17h30', 'service', 'confessions@paroisse.fr', '+33 1 23 45 67 89', 2, NULL),
  ('Catéchèse', 'Cours de catéchèse pour enfants et adultes', 'service', 'catechese@paroisse.fr', '+33 1 23 45 67 89', 3, NULL),
  ('Mariage', 'Service pour les mariages', 'service', 'mariages@paroisse.fr', '+33 1 23 45 67 89', 4, NULL),
  ('Baptême', 'Service pour les baptêmes', 'service', 'baptemes@paroisse.fr', '+33 1 23 45 67 89', 5, NULL),
  ('Accompagnement Spirituel', 'Consultation spirituelle individuelle', 'service', 'accompagnement@paroisse.fr', '+33 1 23 45 67 89', 6, NULL),
  ('Père Jean Dupont', 'Curé responsable de la paroisse', 'clergy', 'j.dupont@paroisse.fr', '+33 1 23 45 67 89 ext. 1', 1, NULL),
  ('Diacre Michel Martin', 'Diacre permanent', 'clergy', 'm.martin@paroisse.fr', '+33 1 23 45 67 89 ext. 2', 2, NULL)
ON CONFLICT DO NOTHING;
