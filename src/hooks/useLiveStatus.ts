import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchActiveLiveStream, type LiveStream } from "@/lib/supabase/mediaQueries";

export function useLiveStatus() {
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [currentLive, setCurrentLive] = useState<LiveStream | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: number | null = null;

    const load = async () => {
      try {
        const stream = await fetchActiveLiveStream();
        if (cancelled) return;
        setCurrentLive(stream);
        setIsLiveActive(!!stream);
      } catch (e) {
        if (!cancelled) {
          console.error("[useLiveStatus] error loading active stream", e);
          setCurrentLive(null);
          setIsLiveActive(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    const channel = supabase
      .channel("public:live_streams")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_streams" },
        () => {
          void load();
        }
      )
      .subscribe();

    // Fallback : petit polling toutes les 30s pour refléter un changement même si Realtime est inactif
    pollTimer = window.setInterval(() => {
      void load();
    }, 30_000);

    return () => {
      cancelled = true;
      if (pollTimer) window.clearInterval(pollTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  return { isLiveActive, currentLive, loading } as const;
}

export default useLiveStatus;

