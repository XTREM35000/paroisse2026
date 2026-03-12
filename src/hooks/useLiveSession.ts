import { useEffect, useRef, useState } from 'react';
import { useAuthContext } from './useAuthContext';
import { rpcIncrementViewer, getLiveStats, type LiveStats } from '@/lib/supabase/mediaQueries';

export default function useLiveSession(liveId?: string) {
  const { user } = useAuthContext();
  const joinedRef = useRef(false);
  const [stats, setStats] = useState<LiveStats | null>(null);
  const pollRef = useRef<number | null>(null);

  const join = async () => {
    if (!liveId || joinedRef.current) return;
    try {
      joinedRef.current = true;
      await rpcIncrementViewer(liveId, 1, user?.id);
      // start polling stats
      const p = window.setInterval(async () => {
        try {
          const s = await getLiveStats(liveId);
          setStats(s);
        } catch (e) {
          // ignore
        }
      }, 5000);
      pollRef.current = p;
      // initial fetch
      const s = await getLiveStats(liveId);
      setStats(s);
    } catch (e) {
      console.warn('useLiveSession.join error', e);
    }
  };

  const leave = async () => {
    if (!liveId || !joinedRef.current) return;
    try {
      await rpcIncrementViewer(liveId, -1, user?.id);
    } catch (e) {
      console.warn('useLiveSession.leave error', e);
    } finally {
      joinedRef.current = false;
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
  };

  useEffect(() => {
    const handleUnload = async () => {
      if (joinedRef.current && liveId) {
        try {
          // best-effort synchronous navigator.sendBeacon fallback
          await rpcIncrementViewer(liveId, -1, user?.id);
        } catch (e) {
          // ignore
        }
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveId]);

  useEffect(() => {
    return () => {
      // cleanup on unmount
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, []);

  return { join, leave, stats } as const;
}
