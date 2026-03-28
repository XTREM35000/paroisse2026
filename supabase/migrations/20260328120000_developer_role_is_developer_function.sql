-- Treat any profile with role = developer as platform developer for RLS (not only the fixed UUID).
-- row_security = off avoids recursion with profiles policies.
CREATE OR REPLACE FUNCTION public.is_developer(p_uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT
    p_uid IS NOT NULL
    AND (
      p_uid = '11111111-1111-1111-1111-111111111111'::uuid
      OR EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = p_uid
          AND lower(coalesce(p.role::text, '')) = 'developer'
      )
    );
$$;
