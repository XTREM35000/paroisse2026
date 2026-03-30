-- Créer la table officiants si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.officiants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(100) NOT NULL,
  title VARCHAR(50),
  grade VARCHAR(50),
  phone VARCHAR(50),
  email VARCHAR(100),
  photo_url TEXT,
  roles TEXT[] DEFAULT '{}',
  responsibilities TEXT[] DEFAULT '{}',
  competencies TEXT[] DEFAULT '{}',
  supervisor_id UUID,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  available_days TEXT[] DEFAULT '{}',
  available_hours JSONB,
  bio TEXT,
  specialties TEXT[] DEFAULT '{}',
  paroisse_id UUID REFERENCES public.paroisses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Créer la table permissions si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key VARCHAR(100) UNIQUE NOT NULL,
  page_name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Créer la table role_permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  UNIQUE(role_id, permission_id)
);

-- Insérer les rôles par défaut
INSERT INTO public.roles (name, description) VALUES
  ('super_admin', 'Acces total a toutes les pages'),
  ('admin', 'Gestion du contenu, pas de gestion des roles')
ON CONFLICT (name) DO NOTHING;
