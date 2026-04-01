import { useMemo } from 'react';
import { useAuthContext } from '@/contexts/useAuthContext';

const GUEST_ALLOWED_PAGE_KEYS = new Set(['/', '/donate']);

export const useRoleAccess = () => {
  const { profile } = useAuthContext();
  const role = String(profile?.role ?? '').toLowerCase();

  const canAccess = (pageKey: string): boolean => {
    if (!profile) return false;

    if (role === 'developer' || role === 'super_admin') return true;
    if (role === 'guest') return GUEST_ALLOWED_PAGE_KEYS.has(pageKey);

    return true;
  };

  const showSidebar = (): boolean => role !== 'guest';
  const showUserMenuFull = (): boolean => role !== 'guest';

  return useMemo(
    () => ({ canAccess, showSidebar, showUserMenuFull }),
    [profile, role]
  );
};
