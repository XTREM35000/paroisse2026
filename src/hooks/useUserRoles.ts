import { useAuthContext } from '@/contexts/useAuthContext';
import { isAdmin as rpIsAdmin, isSuperAdminLevel, roleRank } from '@/utils/rolePermissions';

export function useUserRoles() {
  const { role, loading } = useAuthContext();
  const r = role ?? undefined;
  const roles = role ? [String(role).toLowerCase()] : [];
  const hasRole = (name: string) => {
    const w = String(name).toLowerCase();
    if (['super_admin', 'superadmin', 'super-admin'].includes(w)) {
      return isSuperAdminLevel(r);
    }
    if (['admin', 'administrateur'].includes(w)) {
      return rpIsAdmin(r);
    }
    if (['guest', 'invite', 'invité'].includes(w)) {
      return roleRank(r) === roleRank('guest');
    }
    return roles.includes(w);
  };
  const isAdmin = rpIsAdmin(r);
  const isModerator = hasRole('moderator') || hasRole('moderateur') || isAdmin;
  const isMember = roleRank(r) >= roleRank('member');

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

