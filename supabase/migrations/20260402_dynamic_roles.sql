-- =====================================================
-- MIGRATION : RÔLES DYNAMIQUES
-- =====================================================

-- 1. Changer le type de la colonne name de user_role à TEXT
ALTER TABLE public.roles
ALTER COLUMN name TYPE TEXT;

-- 2. Ajouter une colonne is_system pour identifier les rôles figés
ALTER TABLE public.roles
ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;

-- 3. Marquer les 5 rôles système
UPDATE public.roles
SET is_system = true
WHERE name IN ('developer', 'super_admin', 'admin', 'member', 'guest');

-- 4. Ajouter une contrainte d'unicité (les noms doivent être uniques)
ALTER TABLE public.roles
ADD CONSTRAINT roles_name_unique UNIQUE (name);

-- 5. Ajouter une contrainte de longueur minimale pour les rôles dynamiques
ALTER TABLE public.roles
ADD CONSTRAINT roles_name_length CHECK (char_length(name) >= 3);

-- 6. profiles.role reste user_role (enum système)
-- Les rôles dynamiques passent par la table de liaison user_dynamic_roles.

-- 7. Table de liaison pour les rôles dynamiques
CREATE TABLE IF NOT EXISTS public.user_dynamic_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- 8. Fonction update_profile_role compatible rôles système + dynamiques
DROP FUNCTION IF EXISTS public.update_profile_role(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.update_profile_role(
  target_id UUID,
  new_role TEXT
)
RETURNS TABLE(profile_id UUID, role TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_is_system BOOLEAN;
BEGIN
  -- Vérifier que l'appelant est admin ou super_admin
  IF NOT EXISTS(
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('super_admin'::user_role, 'admin'::user_role)
  ) THEN
    RAISE EXCEPTION 'permission denied: only admin or super_admin can update roles';
  END IF;

  -- Normaliser le rôle
  v_role := lower(trim(new_role));

  -- Vérifier si c'est un rôle système
  SELECT is_system INTO v_is_system FROM public.roles WHERE name = v_role;

  IF v_is_system THEN
    -- Rôle système : mise à jour de l'enum profiles.role
    UPDATE public.profiles
    SET role = v_role::user_role,
        updated_at = NOW()
    WHERE id = target_id;
  ELSE
    -- Rôle dynamique : il doit exister dans public.roles
    IF NOT EXISTS(SELECT 1 FROM public.roles WHERE name = v_role) THEN
      RAISE EXCEPTION 'role does not exist: %', v_role;
    END IF;

    -- Un seul rôle dynamique principal pour l'instant
    DELETE FROM public.user_dynamic_roles WHERE user_id = target_id;
    INSERT INTO public.user_dynamic_roles (user_id, role_id)
    SELECT target_id, id FROM public.roles WHERE name = v_role;

    -- profiles.role conserve une valeur système
    UPDATE public.profiles
    SET role = 'member'::user_role,
        updated_at = NOW()
    WHERE id = target_id;
  END IF;

  RETURN QUERY
  SELECT p.id,
         CASE
           WHEN p.role IS NOT NULL THEN p.role::TEXT
           ELSE COALESCE(
             (
               SELECT r.name
               FROM public.user_dynamic_roles udr
               JOIN public.roles r ON udr.role_id = r.id
               WHERE udr.user_id = p.id
               LIMIT 1
             ),
             'guest'
           )
         END
  FROM public.profiles p
  WHERE p.id = target_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_profile_role(UUID, TEXT) TO authenticated;
