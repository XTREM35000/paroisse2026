-- Pseudo unique sur profiles + RPC pour connexion (résolution email) et disponibilité

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT;

-- Unicité insensible à la casse (pseudo stocké en minuscules côté app)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower
  ON public.profiles (lower(trim(username)))
  WHERE username IS NOT NULL AND trim(username) <> '';

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS valid_username;

ALTER TABLE public.profiles
  ADD CONSTRAINT valid_username
  CHECK (
    username IS NULL
    OR (username ~ '^[a-zA-Z0-9._]{3,30}$' AND length(trim(username)) >= 3)
  );

-- Connexion : résout un email à partir d’un pseudo (anon OK)
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

-- Disponibilité d’un pseudo (inscription / édition profil)
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

-- Trigger inscription : enregistrer le pseudo depuis user_metadata
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_paroisse_id uuid;
  v_role text := 'membre';
  v_count bigint;
  v_requested_role text;
  v_username text;
BEGIN
  v_paroisse_id := null;
  IF (coalesce(new.raw_user_meta_data, '{}'::jsonb)->>'paroisse_id') IS NOT NULL
     AND (coalesce(new.raw_user_meta_data, '{}'::jsonb)->>'paroisse_id') != '' THEN
    BEGIN
      v_paroisse_id := (coalesce(new.raw_user_meta_data, '{}'::jsonb)->>'paroisse_id')::uuid;
    EXCEPTION WHEN OTHERS THEN
      v_paroisse_id := null;
    END;
  END IF;

  v_requested_role := lower(coalesce(new.raw_user_meta_data->>'role', ''));
  IF v_requested_role = 'super_admin' THEN
    v_role := 'super_admin';
  ELSIF v_paroisse_id IS NOT NULL THEN
    SELECT count(*) INTO v_count
    FROM public.profiles
    WHERE paroisse_id = v_paroisse_id;
    IF v_count = 0 THEN
      v_role := 'super_admin';
    END IF;
  ELSE
    SELECT count(*) INTO v_count FROM public.profiles;
    IF v_count = 0 THEN
      v_role := 'super_admin';
    END IF;
  END IF;

  v_username := nullif(trim(lower(coalesce(new.raw_user_meta_data->>'username', ''))), '');

  BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, role, paroisse_id, username, created_at, updated_at)
    VALUES (
      new.id,
      coalesce(new.email, ''),
      coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, ''), '@', 1), 'Utilisateur'),
      coalesce(new.raw_user_meta_data->>'avatar_url', null),
      v_role,
      v_paroisse_id,
      v_username,
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      updated_at = now(),
      username = COALESCE(excluded.username, public.profiles.username);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'handle_auth_user_created: failed for user %: %', new.id, sqlerrm;
  END;

  RETURN new;
END;
$$;

COMMIT;
