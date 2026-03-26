 

 
-- =====================================================
-- NETTOYAGE COMPLET + CRÉATION DU COMPTE DEVELOPPER
-- À CONSERVER POUR LES PROCHAINS RÉINITIALISATIONS
-- =====================================================

-- 1. Créer l'enum user_role si pas déjà
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('membre', 'moderateur', 'admin', 'super_admin', 'developer');
  END IF;
END $$;

DO $$
BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'membre';
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'moderateur';
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'developer';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Désactiver les triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS protect_super_admin ON public.profiles;

-- 3. Nettoyage complet
SET session_replication_role = replica;

TRUNCATE TABLE public.paroisses CASCADE;
TRUNCATE TABLE public.profiles CASCADE;
TRUNCATE TABLE public.videos CASCADE;
TRUNCATE TABLE public.events CASCADE;
TRUNCATE TABLE public.gallery_images CASCADE;
TRUNCATE TABLE public.homilies CASCADE;
TRUNCATE TABLE public.announcements CASCADE;
TRUNCATE TABLE public.donations CASCADE;
TRUNCATE TABLE public.chat_messages CASCADE;
TRUNCATE TABLE public.chat_rooms CASCADE;
TRUNCATE TABLE public.comments CASCADE;
TRUNCATE TABLE public.likes CASCADE;
TRUNCATE TABLE public.favorites CASCADE;
TRUNCATE TABLE public.notifications CASCADE;
TRUNCATE TABLE public.prayer_intentions CASCADE;
TRUNCATE TABLE public.mass_intentions CASCADE;
TRUNCATE TABLE public.mass_schedules CASCADE;
TRUNCATE TABLE public.tutoriels CASCADE;
TRUNCATE TABLE public.receipts CASCADE;
TRUNCATE TABLE public.backups CASCADE;
TRUNCATE TABLE public.audit_logs CASCADE;
TRUNCATE TABLE public.content_approvals CASCADE;
TRUNCATE TABLE public.header_config CASCADE;
TRUNCATE TABLE public.footer_config CASCADE;
TRUNCATE TABLE public.page_hero_banners CASCADE;
TRUNCATE TABLE public.homepage_sections CASCADE;
TRUNCATE TABLE public.about_page_sections CASCADE;
TRUNCATE TABLE public.directory CASCADE;
TRUNCATE TABLE public.documents CASCADE;
TRUNCATE TABLE public.member_cards CASCADE;
TRUNCATE TABLE public.certificates CASCADE;
TRUNCATE TABLE public.user_activities CASCADE;
TRUNCATE TABLE public.user_suspensions CASCADE;
TRUNCATE TABLE public.otp_codes CASCADE;
TRUNCATE TABLE public.shared_archives CASCADE;
TRUNCATE TABLE public.live_streams CASCADE;
TRUNCATE TABLE public.live_stats CASCADE;
TRUNCATE TABLE public.live_stream_sources CASCADE;

DELETE FROM auth.users;

SET session_replication_role = DEFAULT;

-- 4. Créer la paroisse SYSTEM
INSERT INTO public.paroisses (id, nom, slug, is_active, description, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'SYSTEM',
  'system',
  false,
  'Compte système pour maintenance',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 5. Créer l'utilisateur auth developer
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at
)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'dibothierrygogo@gmail.com',
  crypt('P2024Mano', gen_salt('bf')),
  NOW(),
  jsonb_build_object('full_name', 'Thierry Gogo'),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 6. Créer le profil developer
INSERT INTO public.profiles (
  id, email, full_name, avatar_url, phone, role, paroisse_id, is_active, created_at, updated_at
)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'dibothierrygogo@gmail.com',
  'Thierry Gogo',
  '/images/TINO2.jpg',
  '+2250758966156',
  'developer'::user_role,
  (SELECT id FROM public.paroisses WHERE slug = 'system'),
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  paroisse_id = EXCLUDED.paroisse_id,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 7. Recréer les triggers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_first_user BOOLEAN;
  v_paroisse_id UUID;
  v_role user_role;
BEGIN
  v_paroisse_id := (NEW.raw_user_meta_data->>'paroisse_id')::UUID;
  
  IF v_paroisse_id IS NOT NULL THEN
    SELECT COUNT(*) = 0 INTO is_first_user
    FROM public.profiles
    WHERE paroisse_id = v_paroisse_id;
  ELSE
    is_first_user := false;
  END IF;
  
  IF is_first_user THEN
    v_role := 'super_admin'::user_role;
  ELSE
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'membre')::user_role;
  END IF;
  
  INSERT INTO public.profiles (
    id, email, full_name, avatar_url, phone, role, paroisse_id, is_active, created_at, updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', NULL),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    v_role,
    v_paroisse_id,
    true,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.prevent_super_admin_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    IF OLD.role = 'super_admin' AND TG_OP IN ('UPDATE', 'DELETE') THEN
      IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'developer') THEN
        RAISE EXCEPTION 'Seul le compte developer peut modifier ou supprimer un super_admin';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_super_admin
  BEFORE UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_super_admin_deletion();

-- 8. Vérification finale
SELECT 'paroisses SYSTEM' as item, COUNT(*) FROM public.paroisses WHERE slug = 'system'
UNION ALL
SELECT 'profiles developer', COUNT(*) FROM public.profiles WHERE role = 'developer'
UNION ALL
SELECT 'auth.users developer', COUNT(*) FROM auth.users WHERE email = 'dibothierrygogo@gmail.com'
UNION ALL
SELECT 'total après nettoyage', COUNT(*) FROM public.profiles;
  

---

 