-- =====================================================
-- MIGRATION : USERNAME + RPC LOGIN RESOLUTION
-- Idempotente, a executer manuellement via Supabase SQL
-- =====================================================

BEGIN;

-- 1) Colonne username (si absente)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS username TEXT;

-- 2) Index et unicite (insensible a la casse)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower
  ON public.profiles (lower(trim(username)))
  WHERE username IS NOT NULL AND trim(username) <> '';

CREATE INDEX IF NOT EXISTS idx_profiles_username
  ON public.profiles(username);

-- 3) Contrainte format pseudo
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS valid_username;

ALTER TABLE public.profiles
  ADD CONSTRAINT valid_username
  CHECK (
    username IS NULL
    OR (username ~ '^[a-zA-Z0-9._]{3,30}$' AND length(trim(username)) >= 3)
  );

-- 4) RPC : resoudre email a partir d'un identifiant (email ou pseudo)
CREATE OR REPLACE FUNCTION public.resolve_email_for_login(p_identifier text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v text;
  t text := trim(coalesce(p_identifier, ''));
BEGIN
  IF t = '' THEN
    RETURN NULL;
  END IF;

  IF position('@' in t) > 0 THEN
    RETURN t;
  END IF;

  SELECT p.email::text INTO v
  FROM public.profiles p
  WHERE p.username IS NOT NULL
    AND lower(trim(p.username)) = lower(t)
  LIMIT 1;

  RETURN v;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_email_for_login(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_email_for_login(text) TO anon, authenticated, service_role;

-- 5) RPC : verifier disponibilite d'un pseudo
CREATE OR REPLACE FUNCTION public.is_username_available(
  p_username text,
  p_except_user_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.username IS NOT NULL
      AND lower(trim(p.username)) = lower(trim(p_username))
      AND (p_except_user_id IS NULL OR p.id <> p_except_user_id)
  );
$$;

REVOKE ALL ON FUNCTION public.is_username_available(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_username_available(text, uuid) TO anon, authenticated, service_role;

COMMIT;
