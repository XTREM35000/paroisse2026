import { useMemo } from 'react';
import { useUser } from '@/hooks/useUser';
import { canAccess as rpCanAccess, isAdmin as rpIsAdmin } from '@/utils/rolePermissions';

export function useRoleCheck() {
  const { profile, isLoading } = useUser();

  const hasRole = useMemo(() => {
    return (role: string) => {
      if (!profile) return false;
      return String(profile.role) === role;
    };
  }, [profile]);

  const canAccess = useMemo(() => {
    return (requiredRole: string) => rpCanAccess(profile?.role as string | undefined, requiredRole);
  }, [profile]);

  const isAdmin = rpIsAdmin(profile?.role as string | undefined);

  return { profile, hasRole, canAccess, isAdmin, isLoading };
}

export default useRoleCheck;
