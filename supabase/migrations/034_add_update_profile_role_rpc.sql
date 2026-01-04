-- Migration: 034_add_update_profile_role_rpc.sql
-- Create a SECURITY DEFINER function to allow admins to change a user's role
-- This RPC explicitly checks that the caller (auth.uid()) is an admin or super_admin
-- and then performs the update as the function owner (bypassing RLS safely under that guard).

-- If a previous definition exists with a different OUT signature, drop it first
DROP FUNCTION IF EXISTS public.update_profile_role(uuid, text);

CREATE FUNCTION public.update_profile_role(target_id uuid, new_role text)
RETURNS TABLE(profile_id uuid, role text) AS $$
BEGIN
  -- validate role
  IF new_role IS NULL THEN
    RAISE EXCEPTION 'new_role must be provided';
  END IF;
  IF lower(new_role) NOT IN (
    'member','membre',
    'moderator','moderateur',
    'admin','administrateur',
    'pretre','diacre',
    'super_admin','superadmin','super-admin'
  ) THEN
    RAISE EXCEPTION 'invalid role: %', new_role;
  END IF;

  -- Check caller is admin or super_admin according to profiles table
  IF NOT EXISTS(
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin')
  ) THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  -- Normalize common aliases into the French canonical values used by the profiles table
  new_role := lower(new_role);
  IF new_role IN ('member','membre') THEN
    new_role := 'membre';
  ELSIF new_role IN ('moderator','moderateur') THEN
    new_role := 'moderateur';
  ELSIF new_role IN ('admin','administrateur') THEN
    new_role := 'admin';
  ELSIF new_role = 'pretre' THEN
    new_role := 'pretre';
  ELSIF new_role = 'diacre' THEN
    new_role := 'diacre';
  ELSIF new_role IN ('superadmin','super-admin','super_admin') THEN
    -- map any super-admin aliases to 'admin' (adjust if you have a separate super role)
    new_role := 'admin';
  END IF;

    -- Perform the update
    UPDATE public.profiles
    SET role = new_role,
      updated_at = timezone('utc', now())
    WHERE id = target_id;

  -- Return the updated row explicitly to avoid ambiguous column references
  IF FOUND THEN
    RETURN QUERY
    SELECT p.id AS profile_id, p.role AS role
    FROM public.profiles p
    WHERE p.id = target_id;
  ELSE
    RAISE EXCEPTION 'profile not found';
  END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated role so clients can call the RPC (the function itself enforces admin check)
GRANT EXECUTE ON FUNCTION public.update_profile_role(uuid, text) TO authenticated;
