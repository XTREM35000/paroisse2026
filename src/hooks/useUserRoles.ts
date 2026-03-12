import { useAuthContext } from '@/hooks/useAuthContext';

export function useUserRoles() {
  const { role, loading } = useAuthContext();
  const roles = role ? [role] : [];
  const hasRole = (r: string) => roles.includes(r);
  const isAdmin = hasRole('admin');
  const isModerator = hasRole('moderator') || hasRole('admin');
  const isMember = roles.length > 0;
  return {
    roles,
    loading,
    hasRole,
    isAdmin,
    isModerator,
    isMember,
    refetch: () => {},
  };
}

export default useUserRoles;
