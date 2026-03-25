-- Migration: Create developer account and SYSTEM parish automatically
-- 2026-03-25

BEGIN;

-- ============================================================================
-- 1. Ensure SYSTEM parish exists
-- ============================================================================
CREATE OR REPLACE FUNCTION ensure_system_parish()
RETURNS void AS $$
BEGIN
  INSERT INTO public.paroisses (id, nom, slug, is_active, description)
  VALUES ('00000000-0000-0000-0000-000000000001', 'SYSTEM', 'system', false, 'Compte système pour maintenance')
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. Ensure developer account exists
-- ============================================================================
CREATE OR REPLACE FUNCTION ensure_developer_exists()
RETURNS void AS $$
DECLARE
  system_id UUID := '00000000-0000-0000-0000-000000000001';
  dev_id UUID := '11111111-1111-1111-1111-111111111111';
  dev_email TEXT := 'dibothierrygogo@gmail.com';
  dev_password TEXT := '@12345678@';
BEGIN
  -- 1. Ensure SYSTEM parish exists first
  PERFORM ensure_system_parish();
  
  -- 2. Create developer user in auth.users (if doesn't exist)
  -- Note: This requires auth schema access; Supabase allows this via SECURITY DEFINER
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = dev_id) THEN
    INSERT INTO auth.users (
      id,
      email,
      raw_user_meta_data,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at
    )
    VALUES (
      dev_id,
      dev_email,
      jsonb_build_object('full_name', 'Thierry Gogo', 'role', 'developer'),
      crypt(dev_password, gen_salt('bf')),
      NOW(),
      NOW(),
      NOW()
    );
  END IF;
  
  -- 3. Create developer profile (if doesn't exist)
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = dev_id) THEN
    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      role,
      paroisse_id,
      is_active,
      created_at,
      updated_at
    )
    VALUES (
      dev_id,
      dev_email,
      'Thierry Gogo',
      'developer',
      system_id,
      true,
      NOW(),
      NOW()
    );
  END IF;
  
  -- 4. Grant developer access: create role mapping if needed
  -- (This allows RLS policies to check for developer role)
  PERFORM true; -- Placeholder for future role mapping logic
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. Execute initialization (idempotent)
-- ============================================================================
SELECT ensure_developer_exists();

-- ============================================================================
-- 4. Update RLS policies for paroisses to allow developer access
-- ============================================================================
DROP POLICY IF EXISTS "Developer can read all paroisses" ON public.paroisses;
CREATE POLICY "Developer can read all paroisses"
  ON public.paroisses
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE lower(role::text) = 'developer'
    )
  );

DROP POLICY IF EXISTS "Developer can manage all paroisses" ON public.paroisses;
CREATE POLICY "Developer can manage all paroisses"
  ON public.paroisses
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE lower(role::text) = 'developer'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE lower(role::text) = 'developer'
    )
  );

-- ============================================================================
-- 5. Update RLS policies for profiles to hide developer from public lists
-- ============================================================================
DROP POLICY IF EXISTS "Public read non-developer profiles" ON public.profiles;
CREATE POLICY "Public read non-developer profiles"
  ON public.profiles
  FOR SELECT
  USING (
    lower(role::text) != 'developer' 
    OR auth.uid() = id 
    OR auth.uid() IN (SELECT id FROM public.profiles WHERE lower(role::text) = 'developer')
  );

DROP POLICY IF EXISTS "Public insert own profile" ON public.profiles;
CREATE POLICY "Public insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id AND lower(role::text) != 'developer');

DROP POLICY IF EXISTS "Developer can read all profiles" ON public.profiles;
CREATE POLICY "Developer can read all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE lower(role::text) = 'developer'
    )
  );

DROP POLICY IF EXISTS "Developer can manage all profiles" ON public.profiles;
CREATE POLICY "Developer can manage all profiles"
  ON public.profiles
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE lower(role::text) = 'developer'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE lower(role::text) = 'developer'
    )
  );

COMMIT;
