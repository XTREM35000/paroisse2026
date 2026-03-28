import { useAuthContext } from '@/contexts/useAuthContext';
import {
  canAccess as rpCanAccess,
  isAdmin as rpIsAdmin,
  isSuperAdminLevel,
} from '@/utils/rolePermissions';

export function useRoleCheck() {
  const { profile, role, loading } = useAuthContext();
  const effectiveRole = role;
  const canAccess = (requiredRole: string) => rpCanAccess(effectiveRole, requiredRole);
  const hasRole = (r: string) => effectiveRole === r;
  const isAdmin = rpIsAdmin(effectiveRole);
  /** super_admin, developer, ou tout rôle au-dessus (hiérarchie rolePermissions). */
  const isSuperAdmin = isSuperAdminLevel(effectiveRole);
  const isModerator = rpCanAccess(effectiveRole, 'moderator');
  return {
    profile,
    hasRole,
    canAccess,
    isAdmin,
    isSuperAdmin,
    isModerator,
    isLoading: loading,
    refetchRoles: () => {},
  };
}

export default useRoleCheck;
