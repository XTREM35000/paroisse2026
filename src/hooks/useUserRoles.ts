import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AppRole } from '@/types/database';

export function useUserRoles(userId: string | undefined) {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = useCallback(async () => {
    if (!userId) {
      setRoles([]);
      setLoading(false);
      return;
    }

    try {
      // Ensure supabase RPC is available (can throw if client not initialized)
      type RpcFn = (fn: string, params?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
      const rpc = (supabase as unknown as { rpc?: RpcFn }).rpc;
      if (typeof rpc !== 'function') {
        console.warn('[useUserRoles] supabase.rpc not available yet');
        setRoles([]);
        setLoading(false);
        return;
      }

      // supabase client may have narrow typings for rpc names; call via typed rpc
      const { data, error } = await rpc('get_user_roles', { _user_id: userId });

      if (error) {
        console.error('Error fetching roles:', error);
        setRoles([]);
      } else {
        // supabase typings for rpc can be strict; cast via unknown first then to AppRole[]
        setRoles(((data as unknown) as AppRole[]) || []);
      }
    } catch (err: unknown) {
      console.error('Error fetching roles:', err);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const hasRole = useCallback((role: AppRole): boolean => {
    return roles.includes(role);
  }, [roles]);

  const isAdmin = useCallback((): boolean => {
    return hasRole('admin');
  }, [hasRole]);

  const isModerator = useCallback((): boolean => {
    return hasRole('moderator') || hasRole('admin');
  }, [hasRole]);

  const isMember = useCallback((): boolean => {
    return roles.length > 0;
  }, [roles]);

  return {
    roles,
    loading,
    hasRole,
    isAdmin,
    isModerator,
    isMember,
    refetch: fetchRoles,
  };
}

export default useUserRoles;
