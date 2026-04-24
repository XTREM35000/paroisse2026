import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from './useUser';

function isMissingLastSeenColumn(error: unknown): boolean {
  const e = error as { message?: string; code?: string; details?: string } | null;
  const msg = String(e?.message ?? '');
  const code = String(e?.code ?? '');
  if (code === '42703') return true;
  if (code === 'PGRST204') return true;
  if (msg.includes('does not exist') && msg.includes('last_seen_at')) return true;
  if (msg.includes('Could not find') && msg.includes('last_seen_at')) return true;
  if (msg.includes('schema cache') && msg.includes('last_seen_at')) return true;
  return false;
}

export function usePresence(userId?: string | null) {
  const { profile } = useUser();
  /** Supabase réutilise les topics identiques : plusieurs PresenceDot pour le même user cassent sans suffixe unique. */
  const channelInstanceIdRef = useRef<string>('');
  const [lastSeen, setLastSeen] = useState<Date | null>(null);
  const intervalRef = useRef<number | null>(null);
  // null = unknown, true = column exists, false = column missing
  const lastSeenColumnAvailable = useRef<boolean | null>(null);

  const fetchLastSeen = useCallback(async () => {
    if (!userId) return;
    // If we've previously determined the column is missing, skip requesting it
    if (lastSeenColumnAvailable.current === false) return;

    try {
      // cast to any since profiles typing may not include 'last_seen_at' yet
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await supabase.from('profiles').select('last_seen_at').eq('id', userId).maybeSingle() as any;

      if (error) {
        if (isMissingLastSeenColumn(error)) {
          lastSeenColumnAvailable.current = false;
          console.warn('usePresence: last_seen_at column missing, disabling presence checks');
          return;
        }
        console.warn('usePresence: fetchLastSeen query error', error);
        return;
      }

      // If we got data successfully, mark column available
      lastSeenColumnAvailable.current = true;
      if (data && data.last_seen_at) setLastSeen(new Date(data.last_seen_at));
    } catch (e) {
      console.warn('usePresence: fetchLastSeen unexpected error', e);
    }
  }, [userId]);

  // Mark active (only allowed for the current logged-in user)
  const markActive = useCallback(async () => {
    if (!userId) return;

    // Only mark the profile as active if we're operating on *our* profile
    if (!profile || profile.id !== userId) return;

    try {
      // If column was previously found missing, skip update attempts
      if (lastSeenColumnAvailable.current === false) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from('profiles').update({ last_seen_at: new Date().toISOString() } as any).eq('id', userId);
      if (error) {
        if (isMissingLastSeenColumn(error)) {
          lastSeenColumnAvailable.current = false;
          console.warn('usePresence: last_seen_at column missing, disabling presence updates');
          return;
        }
        console.warn('usePresence: markActive update error', error);
        return;
      }

      // success
      lastSeenColumnAvailable.current = true;
      setLastSeen(new Date());
    } catch (e) {
      console.warn('usePresence: markActive unexpected error', e);
    }
  }, [userId, profile]);

  useEffect(() => {
    fetchLastSeen();
    if (!userId) return;

    if (!channelInstanceIdRef.current) {
      channelInstanceIdRef.current =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
    const channelTopic = `presence:profile:${userId}:${channelInstanceIdRef.current}`;

    const channel = supabase
      .channel(channelTopic)
      // NOTE: payload typing from Realtime is not strongly defined; allow any here
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, (payload: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payloadNew: any = payload.new;
        if (payloadNew?.last_seen_at) setLastSeen(new Date(payloadNew.last_seen_at));
      })
      .subscribe();

    // Only the current user should start a heartbeat to update their own last_seen_at
    const isSelf = !!profile && profile.id === userId;

    // Periodic heartbeat while mounted and visible (only if we're marking our own presence)
    const tick = () => {
      if (isSelf) markActive();
    };

    if (isSelf) {
      // Mark active immediately and start heartbeat
      markActive();
      intervalRef.current = window.setInterval(tick, 45 * 1000); // every 45s
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && isSelf) markActive();
    };

    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      supabase.removeChannel(channel);
    };
  }, [userId, fetchLastSeen, markActive, profile?.id]);

  const isOnline = lastSeen !== null && (Date.now() - lastSeen.getTime()) < 2 * 60 * 1000; // 2 minutes

  return { lastSeen, isOnline, markActive };
}
