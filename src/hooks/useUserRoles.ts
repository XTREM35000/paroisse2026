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
      // Ensure supabase client is initialized
      if (!supabase) {
        console.warn('[useUserRoles] supabase not initialized');
        setRoles([]);
        setLoading(false);
        return;
      }

      // Try RPC first (if present on the DB). If RPC is missing, fall back to reading `profiles.role`.
      try {
        const { data, error } = await (supabase as any).rpc('get_user_roles', { _user_id: userId });
        if (error) throw error;
        setRoles(((data as unknown) as AppRole[]) || []);
      } catch (rpcErr: any) {
        // If the RPC is not found in the schema (common in fresh projects), fallback to profiles table
        const msg = rpcErr?.message || String(rpcErr || '');
        const code = rpcErr?.code || rpcErr?.status || null;
        if (String(msg).includes('Could not find the function') || code === 'PGRST202' || code === 404) {
          try {
            const { data: profileData, error: profileErr } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
            if (profileErr) {
              console.error('Error fetching profile role fallback:', profileErr);
              setRoles([]);
            } else if (profileData && (profileData as any).role) {
              const r = String((profileData as any).role).toLowerCase();
              // map DB role to AppRole
              if (r.includes('admin')) setRoles(['admin']);
              else if (r.includes('moder')) setRoles(['moderator']);
              else setRoles(['member']);
            } else {
              setRoles([]);
            }
          } catch (pfErr) {
            console.error('Fallback profile read failed:', pfErr);
            setRoles([]);
          }
        } else {
          console.error('Error fetching roles:', rpcErr);
          setRoles([]);
        }
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
