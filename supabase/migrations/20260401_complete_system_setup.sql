-- =====================================================
-- SYSTEME DE BASE (post vidage / db reset)
-- - Enum + roles + paroisse SYSTEM + compte developer + parish_members
-- - Trigger : nouveaux auth.users -> profil role guest (metadata peut surcharger)
-- - RLS : developer voit SYSTEM inactive + acces total profiles
-- Depends: pgcrypto pour crypt(); is_developer() = UUID developer fixe
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.is_developer(p_uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p_uid = '11111111-1111-1111-1111-111111111111'::uuid;
$$;

-- =====================================================
-- 1. ENUM user_role (si pas déjà créé)
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('developer', 'super_admin', 'admin', 'member', 'guest');
  END IF;
END $$;

DO $$
BEGIN
  BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'guest'; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'member'; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin'; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin'; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'developer'; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- =====================================================
-- 2. TABLE DES RÔLES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name user_role UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

TRUNCATE TABLE public.roles RESTART IDENTITY CASCADE;

INSERT INTO public.roles (name, description) VALUES
  ('developer', 'Developpeur systeme - acces total a toutes les paroisses'),
  ('super_admin', 'Administrateur supreme - gestion complete de la paroisse'),
  ('admin', 'Administrateur paroissial - gestion du contenu'),
  ('member', 'Membre approuve - acces complet aux fonctionnalites'),
  ('guest', 'Invite - acces limite a l''accueil et aux dons');

-- =====================================================
-- 3. PAROISSE SYSTEM (invisible)
-- =====================================================
INSERT INTO public.paroisses (
  id, nom, slug, description, is_active, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'SYSTEM',
  'system',
  'Paroisse systeme - invisible aux utilisateurs normaux (maintenance)',
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 4. COMPTE DEVELOPPEUR MASTER (auth.users)
-- =====================================================
-- aud + role = 'authenticated' sont requis par GoTrue ; sans eux signInWithPassword renvoie souvent 400.
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'dibothierrygogo@gmail.com',
  crypt('P2024Mano"', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"],"role":"developer"}',
  '{"full_name":"Thierry Gogo","username":"thierry_gogo","role":"developer"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
)
ON CONFLICT (id) DO UPDATE SET
  instance_id = EXCLUDED.instance_id,
  aud = EXCLUDED.aud,
  role = EXCLUDED.role,
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = COALESCE(auth.users.email_confirmed_at, EXCLUDED.email_confirmed_at),
  raw_app_meta_data = EXCLUDED.raw_app_meta_data,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = EXCLUDED.updated_at;

-- =====================================================
-- 5. PROFIL DEVELOPPEUR
-- =====================================================
INSERT INTO public.profiles (
  id, email, role, full_name, username, phone, is_active, created_at, updated_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'dibothierrygogo@gmail.com',
  'developer'::user_role,
  'Thierry Gogo',
  'thierry_gogo',
  '+225 0758966156',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 6. LIEN DEVELOPPEUR <-> PAROISSE SYSTEM
-- =====================================================
INSERT INTO public.parish_members (
  parish_id, user_id, role
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'developer'::user_role
) ON CONFLICT (parish_id, user_id) DO NOTHING;

-- =====================================================
-- 7. POLITIQUES RLS (developer = is_developer(), pas recursion profiles)
-- =====================================================
DROP POLICY IF EXISTS "Developer can see SYSTEM parish" ON public.paroisses;
CREATE POLICY "Developer can see SYSTEM parish" ON public.paroisses
  FOR SELECT
  USING (
    is_active = true
    OR (
      id = '00000000-0000-0000-0000-000000000001'
      AND public.is_developer()
    )
  );

DROP POLICY IF EXISTS "Developer full access" ON public.profiles;
CREATE POLICY "Developer full access" ON public.profiles
  FOR ALL
  USING (public.is_developer())
  WITH CHECK (public.is_developer());

-- =====================================================
-- 8. TRIGGER : création profil à l'inscription (défaut guest)
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_text text;
  v_role user_role;
BEGIN
  v_role_text := lower(trim(COALESCE(NEW.raw_user_meta_data->>'role', 'guest')));

  IF v_role_text = 'membre' THEN
    v_role := 'member'::user_role;
  ELSIF v_role_text = 'moderateur' THEN
    v_role := 'admin'::user_role;
  ELSE
    BEGIN
      v_role := v_role_text::user_role;
    EXCEPTION
      WHEN invalid_text_representation THEN
        v_role := 'guest'::user_role;
    END;
  END IF;

  INSERT INTO public.profiles (
    id, email, role, full_name, created_at, updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    v_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
