import { useAuthContext } from '@/hooks/useAuthContext';
import { canAccess as rpCanAccess, isAdmin as rpIsAdmin } from '@/utils/rolePermissions';

export function useRoleCheck() {
  const { profile, role, loading } = useAuthContext();
  const effectiveRole = role;
  const canAccess = (requiredRole: string) => rpCanAccess(effectiveRole, requiredRole);
  const hasRole = (r: string) => effectiveRole === r;
  const isAdmin = rpIsAdmin(effectiveRole);
  const isModerator = rpCanAccess(effectiveRole, 'moderator');
  return {
    profile,
    hasRole,
    canAccess,
    isAdmin,
    isModerator,
    isLoading: loading,
    refetchRoles: () => {},
  };
}

export default useRoleCheck;
