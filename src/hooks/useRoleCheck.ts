import { useCallback, useEffect, useMemo } from 'react';
import { useUser } from '@/hooks/useUser';
import { canAccess as rpCanAccess, isAdmin as rpIsAdmin } from '@/utils/rolePermissions';
import useUserRoles from './useUserRoles';
import type { AppRole } from '@/types/database';

export function useRoleCheck() {
  const { profile, isLoading } = useUser();
  const { roles: userRoles, loading: rolesLoading, refetch } = useUserRoles(profile?.id);

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.debug('[useRoleCheck] Profile updated:', { profile: profile?.id, role: profile?.role, isLoading });
    }
  }, [profile, isLoading]);
  // Déterminer le "meilleur" rôle en combinant le rôle du profil et les rôles listés
  const effectiveRole = useMemo(() => {
    // si on a des rôles explicites depuis la table roles, prendre le plus élevé
    if (userRoles && userRoles.length > 0) {
      // userRoles est supposé être un tableau de strings
      // choisir le rôle avec le rang le plus élevé selon rolePermissions
      let best: string | undefined;
      for (const r of userRoles as AppRole[]) {
        if (!best) best = r;
        else if (rpCanAccess(r, best)) best = r;
      }
      return best ?? profile?.role;
    }
    return profile?.role;
  }, [userRoles, profile?.role]);

  const canAccess = useCallback((requiredRole: string) => {
    const result = rpCanAccess(effectiveRole as string | undefined, requiredRole);
    console.log(`[useRoleCheck] canAccess('${requiredRole}') with effectiveRole '${effectiveRole}':`, result);
    return result;
  }, [effectiveRole]);

  const hasRole = useCallback((role: string) => {
    const profHas = String(profile?.role) === role;
    const rolesHas = Array.isArray(userRoles) && (userRoles as string[]).includes(role);
    return profHas || rolesHas;
  }, [profile?.role, userRoles]);

  const isAdmin = rpIsAdmin(effectiveRole as string | undefined);
  const isModerator = rpCanAccess(effectiveRole as string | undefined, 'moderator');

  return { profile, hasRole, canAccess, isAdmin, isModerator, isLoading: isLoading || rolesLoading, refetchRoles: refetch };
}

export default useRoleCheck;
