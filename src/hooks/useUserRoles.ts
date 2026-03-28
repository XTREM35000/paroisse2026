import { useAuthContext } from '@/contexts/useAuthContext';
import { isAdmin as rpIsAdmin, isSuperAdminLevel } from '@/utils/rolePermissions';

export function useUserRoles() {
  const { role, loading } = useAuthContext();
  const r = role ?? undefined;
  const roles = role ? [String(role).toLowerCase()] : [];
  const hasRole = (name: string) => {
    const w = String(name).toLowerCase();
    if (w === 'super_admin' || w === 'superadmin' || w === 'super-admin') {
      return isSuperAdminLevel(r);
    }
    if (w === 'admin' || w === 'administrateur') {
      return rpIsAdmin(r);
    }
    return roles.includes(w);
  };
  const isAdmin = rpIsAdmin(r);
  const isModerator = hasRole('moderator') || hasRole('moderateur') || isAdmin;
  const isMember = roles.length > 0;

  const canEditRole = (targetUserRole?: string) => {
    if (isSuperAdminLevel(r)) return true;
    if (rpIsAdmin(r) && !isSuperAdminLevel(targetUserRole)) return true;
    return false;
  };

  const isSuperAdmin = isSuperAdminLevel(r);

  return {
    roles,
    loading,
    hasRole,
    isAdmin,
    isModerator,
    isMember,
    canEditRole,
    isSuperAdmin,
    refetch: () => {},
  };
}

export default useUserRoles;

