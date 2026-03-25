-- SYSTEM paroisse + developer system account (RLS + triggers)
-- This migration is intentionally defensive and aligns with the current schema in this repo.

-- 1) Insert internal "SYSTEM" parish (invisible)
DO $$
BEGIN
  IF to_regclass('public.paroisses') IS NULL THEN
    RAISE NOTICE 'Skipping SYSTEM parish insert: public.paroisses not found';
  ELSE
    INSERT INTO public.paroisses (
      id,
      nom,
      slug,
      description,
      email,
      logo_url,
      adresse,
      telephone,
      couleur_principale,
      is_active,
      created_at,
      updated_at
    )
    VALUES (
      '00000000-0000-0000-0000-000000000001',
      'SYSTEM',
      'system',
      'Compte systeme pour maintenance',
      NULL,
      NULL,
      NULL,
      NULL,
      '#3b82f6',
      false,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Functions used by app bootstrap (idempotent)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.ensure_system_parish()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF to_regclass('public.paroisses') IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.paroisses (
    id,
    nom,
    slug,
    description,
    email,
    logo_url,
    adresse,
    telephone,
    couleur_principale,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    '00000000-0000-0000-0000-000000000001',
    'SYSTEM',
    'system',
    'Compte système pour maintenance',
    NULL,
    NULL,
    NULL,
    NULL,
    '#3b82f6',
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_developer_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  PERFORM public.ensure_system_parish();
  PERFORM public.ensure_developer_exists();
END;
$$;

-- 2) Update init_system so it ignores the SYSTEM parish
--    (SetupWizard must still be able to create the first real parish.)
CREATE OR REPLACE FUNCTION public.init_system(
  p_paroisse_nom text,
  p_paroisse_slug text,
  p_paroisse_description text,
  p_sections jsonb,
  p_header_config jsonb,
  p_about_config jsonb,
  p_branding jsonb,
  p_footer_config jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid := gen_random_uuid();
  elem jsonb;
  v_key text;
  v_content text;
  v_has_home_paroisse boolean;
  v_has_about_paroisse boolean;
  v_hdr_id uuid;
  v_footer jsonb := coalesce(p_footer_config, '{}'::jsonb);
BEGIN
  -- Ignore the internal SYSTEM parish
  IF EXISTS (
    SELECT 1
    FROM public.paroisses
    WHERE lower(slug) <> 'system'
    LIMIT 1
  ) THEN
    RAISE EXCEPTION 'init_system: une paroisse existe deja';
  END IF;

  INSERT INTO public.paroisses (
    id, nom, slug, description, email, logo_url, adresse, telephone,
    couleur_principale, is_active, created_at, updated_at
  )
  VALUES (
    v_id,
    p_paroisse_nom,
    lower(trim(p_paroisse_slug)),
    p_paroisse_description,
    nullif(trim(p_branding->>'email'), ''),
    nullif(trim(p_branding->>'logo'), ''),
    nullif(trim(p_branding->>'address'), ''),
    nullif(trim(p_branding->>'phone'), ''),
    '#3b82f6',
    true,
    now(),
    now()
  );

  INSERT INTO public.footer_config (
    paroisse_id, address, email, moderator_phone, super_admin_email, super_admin_phone,
    facebook_url, youtube_url, instagram_url, whatsapp_url, copyright_text, created_at, updated_at
  )
  VALUES (
    v_id,
    nullif(trim(v_footer->>'address'), ''),
    nullif(trim(v_footer->>'email'), ''),
    nullif(trim(v_footer->>'moderator_phone'), ''),
    nullif(trim(v_footer->>'super_admin_email'), ''),
    nullif(trim(v_footer->>'super_admin_phone'), ''),
    nullif(trim(v_footer->>'facebook_url'), ''),
    nullif(trim(v_footer->>'youtube_url'), ''),
    nullif(trim(v_footer->>'instagram_url'), ''),
    nullif(trim(v_footer->>'whatsapp_url'), ''),
    nullif(trim(v_footer->>'copyright_text'), ''),
    now(),
    now()
  );

  v_has_home_paroisse := EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'homepage_sections'
      AND column_name = 'paroisse_id'
  );

  IF v_has_home_paroisse THEN
    DELETE FROM public.homepage_sections WHERE paroisse_id = v_id;
  ELSE
    DELETE FROM public.homepage_sections;
  END IF;

  FOR elem IN SELECT * FROM jsonb_array_elements(coalesce(p_sections, '[]'::jsonb))
  LOOP
    v_key := nullif(trim(elem->>'section_key'), '');
    IF v_key IS NULL THEN
      CONTINUE;
    END IF;

    IF jsonb_typeof(elem->'content') IN ('object', 'array') THEN
      v_content := (elem->'content')::text;
    ELSE
      v_content := elem->>'content';
    END IF;

    IF v_has_home_paroisse THEN
      INSERT INTO public.homepage_sections (
        section_key, title, subtitle, content, image_url,
        display_order, is_active, paroisse_id, created_at, updated_at
      )
      VALUES (
        v_key,
        elem->>'title',
        elem->>'subtitle',
        v_content,
        nullif(elem->>'image_url', ''),
        coalesce((elem->>'display_order')::int, 0),
        coalesce((elem->>'is_active')::boolean, true),
        v_id,
        now(),
        now()
      );
    ELSE
      INSERT INTO public.homepage_sections (
        section_key, title, subtitle, content, image_url,
        display_order, is_active, created_at, updated_at
      )
      VALUES (
        v_key,
        elem->>'title',
        elem->>'subtitle',
        v_content,
        nullif(elem->>'image_url', ''),
        coalesce((elem->>'display_order')::int, 0),
        coalesce((elem->>'is_active')::boolean, true),
        now(),
        now()
      );
    END IF;
  END LOOP;

  SELECT id INTO v_hdr_id
  FROM public.header_config
  WHERE is_active = true
  ORDER BY updated_at DESC NULLS LAST
  LIMIT 1;

  IF v_hdr_id IS NOT NULL THEN
    UPDATE public.header_config
    SET
      logo_url = coalesce(nullif(trim(p_header_config->>'logo_url'), ''), logo_url),
      main_title = coalesce(nullif(trim(p_header_config->>'main_title'), ''), main_title),
      subtitle = coalesce(nullif(trim(p_header_config->>'subtitle'), ''), subtitle),
      navigation_items = coalesce((p_header_config->'navigation_items')::jsonb, navigation_items),
      updated_at = now()
    WHERE id = v_hdr_id;
  ELSE
    INSERT INTO public.header_config (
      id, logo_url, logo_alt_text, logo_size, main_title, subtitle, navigation_items, is_active
    )
    VALUES (
      gen_random_uuid(),
      nullif(trim(p_header_config->>'logo_url'), ''),
      'Logo Paroisse',
      'md',
      coalesce(nullif(trim(p_header_config->>'main_title'), ''), 'Paroisse'),
      coalesce(nullif(trim(p_header_config->>'subtitle'), ''), ''),
      coalesce(
        (p_header_config->'navigation_items')::jsonb,
        '[
          {"label": "Accueil", "href": "/", "icon": "home"},
          {"label": "A propos", "href": "/a-propos", "icon": "info"}
        ]'::jsonb
      ),
      true
    );
  END IF;

  v_has_about_paroisse := EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'about_page_sections'
      AND column_name = 'paroisse_id'
  );

  IF v_has_about_paroisse THEN
    DELETE FROM public.about_page_sections WHERE paroisse_id = v_id;
  ELSE
    DELETE FROM public.about_page_sections;
  END IF;

  IF v_has_about_paroisse THEN
    INSERT INTO public.about_page_sections (
      section_key, title, subtitle, content, content_type, display_order, is_active, metadata, paroisse_id, created_at, updated_at
    )
    VALUES
    (
      'about_hero',
      'A propos de nous',
      'Decouvrez notre communaute',
      NULL,
      'hero',
      1,
      true,
      '{}'::jsonb,
      v_id,
      now(),
      now()
    ),
    (
      'parish_description',
      'Notre paroisse',
      NULL,
      coalesce(p_about_config::text, '{}'),
      'text',
      2,
      true,
      NULL,
      v_id,
      now(),
      now()
    );
  ELSE
    INSERT INTO public.about_page_sections (
      section_key, title, subtitle, content, content_type, display_order, is_active, metadata, created_at, updated_at
    )
    VALUES
    (
      'about_hero',
      'A propos de nous',
      'Decouvrez notre communaute',
      NULL,
      'hero',
      1,
      true,
      '{}'::jsonb,
      now(),
      now()
    ),
    (
      'parish_description',
      'Notre paroisse',
      NULL,
      coalesce(p_about_config::text, '{}'),
      'text',
      2,
      true,
      NULL,
      now(),
      now()
    );
  END IF;

  RETURN jsonb_build_object('paroisse_id', v_id::text);
END;
$$;

-- Keep function grants consistent with existing migrations
GRANT EXECUTE ON FUNCTION public.init_system(text, text, text, jsonb, jsonb, jsonb, jsonb, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.init_system(text, text, text, jsonb, jsonb, jsonb, jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.init_system(text, text, text, jsonb, jsonb, jsonb, jsonb, jsonb) TO service_role;

-- 3) Developer system account auto-profile creation
--    Runs on any auth.users INSERT, and ensures the dev user's profile exists
--    without requiring the dev account to sign up at that moment.
CREATE OR REPLACE FUNCTION public.create_developer_account()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  dev_email TEXT := 'dibothierrygogo@gmail.com';
  fixed_dev_user_id UUID := '11111111-1111-1111-1111-111111111111';
  dev_user_id UUID;
  system_paroisse_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Ensure tables exist
  IF to_regclass('public.profiles') IS NULL THEN
    RETURN NEW;
  END IF;

  dev_user_id := NEW.id;

  -- Only act for the developer (by fixed UUID or email).
  IF NOT (
    NEW.id = fixed_dev_user_id
    OR lower(coalesce(NEW.email, '')) = lower(dev_email)
  ) THEN
    RETURN NEW;
  END IF;

  -- If the dev profile is already configured, do nothing.
  IF EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = dev_user_id AND p.role = 'developer'
  ) THEN
    RETURN NEW;
  END IF;

  -- Never break auth user creation because of profiles insert/update issues.
  BEGIN
    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      avatar_url,
      phone,
      role,
      paroisse_id,
      is_active,
      created_at,
      updated_at
    )
    VALUES (
      dev_user_id,
      dev_email,
      'Thierry Gogo',
      '/images/TINO2.jpg',
      '+2250758966156',
      'developer',
      system_paroisse_id,
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      avatar_url = EXCLUDED.avatar_url,
      phone = EXCLUDED.phone,
      role = EXCLUDED.role,
      paroisse_id = EXCLUDED.paroisse_id,
      is_active = EXCLUDED.is_active,
      updated_at = NOW();
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'create_developer_account: failed to upsert developer profile for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_developer_account ON auth.users;
CREATE TRIGGER ensure_developer_account
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_developer_account();

-- =====================================================
-- Fonction pour créer le developer account (auth.users + profiles)
-- sans dépendre d'une inscription.
-- =====================================================
CREATE OR REPLACE FUNCTION public.ensure_developer_exists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET row_security = off
AS $$
DECLARE
  dev_email TEXT := 'dibothierrygogo@gmail.com';
  fixed_dev_user_id UUID := '11111111-1111-1111-1111-111111111111';
  dev_user_id UUID;
  system_paroisse_id UUID;
BEGIN
  -- 1) Resolve developer user id by email if it already exists; otherwise use the fixed UUID.
  SELECT u.id
  INTO dev_user_id
  FROM auth.users u
  WHERE lower(u.email) = lower(dev_email)
  ORDER BY u.created_at ASC NULLS LAST
  LIMIT 1;

  -- If the auth user doesn't exist yet, we do not create it from SQL (hosted Supabase limitation).
  -- You must create the user once in Authentication, then this function will create the profile.
  dev_user_id := coalesce(dev_user_id, fixed_dev_user_id);

  -- Récupérer l'ID de la paroisse SYSTEM
  SELECT id INTO system_paroisse_id
  FROM public.paroisses
  WHERE slug = 'system'
  LIMIT 1;

  -- Si la paroisse SYSTEM n'existe pas, la créer
  IF system_paroisse_id IS NULL THEN
    INSERT INTO public.paroisses (
      id,
      nom,
      slug,
      description,
      email,
      logo_url,
      adresse,
      telephone,
      couleur_principale,
      is_active,
      created_at,
      updated_at
    )
    VALUES (
      '00000000-0000-0000-0000-000000000001',
      'SYSTEM',
      'system',
      'Compte système pour maintenance',
      NULL,
      NULL,
      NULL,
      NULL,
      '#3b82f6',
      false,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    SELECT id INTO system_paroisse_id
    FROM public.paroisses
    WHERE slug = 'system'
    LIMIT 1;
  END IF;

  -- Refresh dev_user_id by email (the only supported path on hosted Supabase)
  SELECT u.id
  INTO dev_user_id
  FROM auth.users u
  WHERE lower(u.email) = lower(dev_email)
  ORDER BY u.created_at ASC NULLS LAST
  LIMIT 1;

  IF dev_user_id IS NULL THEN
    RAISE NOTICE 'ensure_developer_exists: auth user not found (create it in Authentication first); skipping profiles upsert';
    RETURN;
  END IF;

  -- Créer le profil developer s'il n'existe pas
  IF system_paroisse_id IS NOT NULL THEN
    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      avatar_url,
      phone,
      role,
      paroisse_id,
      is_active,
      created_at,
      updated_at
    )
    VALUES (
      dev_user_id,
      dev_email,
      'Thierry Gogo',
      '/images/TINO2.jpg',
      '+2250758966156',
      'developer',
      system_paroisse_id,
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      avatar_url = EXCLUDED.avatar_url,
      phone = EXCLUDED.phone,
      role = EXCLUDED.role,
      paroisse_id = EXCLUDED.paroisse_id,
      is_active = EXCLUDED.is_active,
      updated_at = NOW();
  END IF;
END;
$$;

-- Exécuter la fonction une fois pour créer le compte maintenant
SELECT public.ensure_developer_account();

-- Allow calling from anon/authenticated clients
GRANT EXECUTE ON FUNCTION public.ensure_developer_exists() TO anon;
GRANT EXECUTE ON FUNCTION public.ensure_developer_exists() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_developer_exists() TO service_role;

GRANT EXECUTE ON FUNCTION public.ensure_developer_account() TO anon;
GRANT EXECUTE ON FUNCTION public.ensure_developer_account() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_developer_account() TO service_role;

GRANT EXECUTE ON FUNCTION public.ensure_system_parish() TO anon;
GRANT EXECUTE ON FUNCTION public.ensure_system_parish() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_system_parish() TO service_role;

-- 4) RESET: wipe everything except developer + SYSTEM
CREATE OR REPLACE FUNCTION public.reset_all_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  t text;
  dev_user_id uuid := '11111111-1111-1111-1111-111111111111';
BEGIN
  -- Truncate known content tables if present (CASCADE to keep FKs consistent)
  FOREACH t IN ARRAY ARRAY[
    'public.videos',
    'public.events',
    'public.gallery_images',
    'public.homilies',
    'public.announcements',
    'public.donations',
    'public.chat_messages',
    'public.comments',
    'public.likes',
    'public.favorites',
    'public.notifications',
    'public.prayer_intentions',
    'public.tutoriels',
    'public.receipts',
    'public.backups',
    'public.audit_logs',
    'public.header_config',
    'public.footer_config',
    'public.page_hero_banners',
    'public.homepage_sections',
    'public.about_page_sections',
    'public.directory',
    'public.documents'
  ]
  LOOP
    IF to_regclass(t) IS NOT NULL THEN
      EXECUTE format('TRUNCATE TABLE %s CASCADE', t);
    END IF;
  END LOOP;

  -- Keep only developer profile + SYSTEM parish
  IF to_regclass('public.profiles') IS NOT NULL THEN
    DELETE FROM public.profiles WHERE id <> dev_user_id;
  END IF;

  IF to_regclass('public.paroisses') IS NOT NULL THEN
    DELETE FROM public.paroisses WHERE slug <> 'system';
  END IF;

  -- Remove any auth users except developer (may fail on hosted Supabase; keep defensive)
  BEGIN
    DELETE FROM auth.users WHERE id <> dev_user_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'reset_all_data: could not delete from auth.users: %', SQLERRM;
  END;

  -- Ensure SYSTEM + developer exist after cleanup
  PERFORM public.ensure_developer_account();
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_all_data() TO anon;
GRANT EXECUTE ON FUNCTION public.reset_all_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_all_data() TO service_role;

-- 4) Protect developer profile from accidental deletion
CREATE OR REPLACE FUNCTION public.prevent_developer_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.role = 'developer' THEN
    RAISE EXCEPTION 'Le compte developpeur ne peut pas etre supprime.';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS protect_developer_account ON public.profiles;
CREATE TRIGGER protect_developer_account
BEFORE DELETE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_developer_deletion();

-- 5) RLS policies for developer role
--    Developer can see/modify all paroisses.
ALTER TABLE public.paroisses ENABLE ROW LEVEL SECURITY;

-- Avoid "infinite recursion detected in policy for relation profiles".
-- Do NOT query public.profiles from helper functions used by profiles policies.
CREATE OR REPLACE FUNCTION public.is_developer(p_uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p_uid = '11111111-1111-1111-1111-111111111111'::uuid;
$$;

DROP POLICY IF EXISTS developer_can_manage_paroisses ON public.paroisses;
CREATE POLICY developer_can_manage_paroisses
  ON public.paroisses
  FOR ALL
  USING (
    public.is_developer()
  )
  WITH CHECK (
    public.is_developer()
  );

--    Developer can see all profiles, but cannot update/delete himself.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop *all* existing policies on profiles (older migrations may contain recursive policies,
-- causing 42P17 "infinite recursion detected in policy for relation profiles").
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', r.policyname);
  END LOOP;
END $$;

-- Admin helper based on admin_users table (no RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin_or_super(p_uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_developer(p_uid)
    OR EXISTS (
      SELECT 1
      FROM public.admin_users au
      WHERE au.id = p_uid
    );
$$;

-- Public SELECT: hide developer from non-developers, but allow self + developer
CREATE POLICY profiles_select_public
  ON public.profiles
  FOR SELECT
  USING (
    id = auth.uid()
    OR role <> 'developer'
    OR public.is_developer()
  );

-- Allow users to create their own profile (but never as developer)
CREATE POLICY profiles_insert_own
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    (auth.uid() = id AND role <> 'developer')
    OR public.is_developer()
  );

-- Allow users to update their own profile (but never set role=developer)
CREATE POLICY profiles_update_own
  ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() = id
    OR public.is_admin_or_super()
  )
  WITH CHECK (
    (auth.uid() = id AND role <> 'developer')
    OR public.is_admin_or_super()
  );

-- Admin/super/developer can delete profiles, but never delete developer profile
CREATE POLICY profiles_delete_admin
  ON public.profiles
  FOR DELETE
  USING (
    public.is_admin_or_super()
    AND role <> 'developer'
  );

