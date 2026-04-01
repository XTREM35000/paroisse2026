-- =====================================================
-- MIGRATION : FIX OVERLOAD is_username_available
-- But: supprimer les surcharges ambigues (PGRST203)
-- =====================================================

BEGIN;

-- Supprimer toutes les signatures connues pour repartir proprement.
DROP FUNCTION IF EXISTS public.is_username_available(text, uuid);
DROP FUNCTION IF EXISTS public.is_username_available(uuid, text);

-- Re-creer une seule signature canonique.
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
