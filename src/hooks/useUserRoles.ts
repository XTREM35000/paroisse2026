import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { AppRole } from '@/types/database';

// Cache whether RPC is missing to avoid repeated 404s in the console
let rpcMissing = false;
// Ensure the user gets notified only once if RPC is missing / inaccessible
let rpcMissingToastShown = false;

export function useUserRoles(userId: string | undefined) {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
        if (!rpcMissing) {
          const { data, error } = await (supabase as any).rpc('get_user_roles', { _user_id: userId });
          if (error) throw error;
          setRoles(((data as unknown) as AppRole[]) || []);
        } else {
          // RPC known missing, skip RPC and fallback to profiles below
          throw { message: 'RPC missing (cached)' };
        }
      } catch (rpcErr: any) {
        // If the RPC is not found or network returns 404 (or other network issues), fallback to profiles table
        const msg = rpcErr?.message || String(rpcErr || '');
        const code = rpcErr?.code || rpcErr?.status || rpcErr?.statusCode || null;

        // Consider network errors / 404 as RPC missing to avoid repeated noisy requests
        const isRpcMissing = String(msg).includes('Could not find the function') || code === 'PGRST202' || code === 404 || String(msg).includes('RPC missing (cached)') || String(msg).toLowerCase().includes('failed to fetch') || String(msg).toLowerCase().includes('failed to load') || String(msg).includes('404');

        if (isRpcMissing) {
          rpcMissing = true;
          console.debug('[useUserRoles] RPC get_user_roles missing or inaccessible, falling back to profiles', { msg, code });

          // Show a single, user-facing toast to explain the fallback (avoid spamming)
          try {
            if (!rpcMissingToastShown) {
              toast({
                title: 'Rôles non disponibles',
                description: 'La fonction RPC `get_user_roles` est manquante ou inaccessible. Vous êtes connecté en mode membre par défaut.',
                variant: 'default',
              });
              rpcMissingToastShown = true;
            }
          } catch (e) {
            // ignore toast errors in non-UI contexts
          }

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
