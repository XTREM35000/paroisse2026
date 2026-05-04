import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { fetchLiveProviderSources } from '@/lib/supabase/mediaQueries';
import { getRtmpKey, getRtmpServerUrl, recordStreamMetric, startStreamSession, endStreamSession } from '@/lib/supabase/rtmpQueries';
import { supabase } from '@/integrations/supabase/client';

export interface ObsProStream {
  provider: string;
  rtmpServer: string;
  streamKey: string | null;
  ingestUrl: string | null;
  keyExpiresAt?: string | null;
}

export interface ObsProMetrics {
  viewers: number;
  bitrate: number;
  framerate: number;
  droppedFrames: number;
  uptimeSeconds: number;
}

interface ObsProState {
  streams: ObsProStream[];
  liveStreamId: string | null;
  currentSessionId: string | null;
  isLive: boolean;
  metrics: ObsProMetrics;
}

export function useObsMultiStreamPro(liveStreamId?: string) {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<ObsProState>({
    streams: [],
    liveStreamId: liveStreamId ?? null,
    currentSessionId: null,
    isLive: false,
    metrics: { viewers: 0, bitrate: 0, framerate: 0, droppedFrames: 0, uptimeSeconds: 0 },
  });

  const sessionStartMs = useRef<number | null>(null);
  const metricsTimer = useRef<number | null>(null);

  const effectiveLiveId = useMemo(() => (liveStreamId ? liveStreamId.trim() : ''), [liveStreamId]);

  const generateObsConfig = useCallback(
    async (id: string) => {
      setLoading(true);
      try {
        const sources = await fetchLiveProviderSources(id);
        const providers = Array.from(new Set(sources.map((s) => s.provider)));

        // Always include the live_streams.provider as “main”
        const { data: liveRow } = await supabase.from('live_streams').select('provider').eq('id', id).maybeSingle();
        const mainProvider = String(liveRow?.provider || 'youtube');
        const allProviders = Array.from(new Set([mainProvider, ...providers]));

        const streams: ObsProStream[] = [];
        for (const provider of allProviders) {
          const k = await getRtmpKey({ liveStreamId: id, provider });
          const rtmpServer = getRtmpServerUrl(provider);
          const ingestUrl = k.streamKey ? `${rtmpServer}/${k.streamKey}` : null;
          streams.push({
            provider,
            rtmpServer,
            streamKey: k.streamKey,
            ingestUrl,
            keyExpiresAt: k.keyExpiresAt ?? null,
          });
        }

        setState((prev) => ({ ...prev, streams, liveStreamId: id }));
        return streams;
      } catch (e) {
        console.error(e);
        toast({ title: 'Erreur', description: 'Impossible de charger la config RTMP', variant: 'destructive' });
        return [];
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const startProStream = useCallback(async () => {
    if (!state.liveStreamId) return;
    try {
      const session = await startStreamSession(state.liveStreamId);
      sessionStartMs.current = Date.now();
      setState((prev) => ({ ...prev, currentSessionId: session.id, isLive: true }));
    } catch (e) {
      console.error(e);
      toast({ title: 'Erreur', description: 'Impossible de démarrer la session', variant: 'destructive' });
    }
  }, [state.liveStreamId, toast]);

  const stopProStream = useCallback(
    async (patch?: { vodUrl?: string; vodStoragePath?: string }) => {
      if (!state.currentSessionId) return;
      try {
        await endStreamSession(state.currentSessionId, patch);
        sessionStartMs.current = null;
        setState((prev) => ({
          ...prev,
          currentSessionId: null,
          isLive: false,
          metrics: { viewers: 0, bitrate: 0, framerate: 0, droppedFrames: 0, uptimeSeconds: 0 },
        }));
      } catch (e) {
        console.error(e);
        toast({ title: 'Erreur', description: 'Impossible de terminer la session', variant: 'destructive' });
      }
    },
    [state.currentSessionId, toast]
  );

  // lightweight metrics loop (placeholder): records metrics rows if session is live
  useEffect(() => {
    if (!state.isLive || !state.liveStreamId) return;

    if (metricsTimer.current) window.clearInterval(metricsTimer.current);

    metricsTimer.current = window.setInterval(async () => {
      const uptimeSeconds = sessionStartMs.current ? Math.floor((Date.now() - sessionStartMs.current) / 1000) : 0;

      // Placeholder metrics: real source should be OBS WebSocket ingest / CDN stats
      const viewers = Math.max(0, Math.floor(10 + Math.random() * 50));
      const bitrate = Math.floor(3500 + Math.random() * 1500);
      const framerate = 30;
      const droppedFrames = Math.floor(Math.random() * 3);

      setState((prev) => ({
        ...prev,
        metrics: { viewers, bitrate, framerate, droppedFrames, uptimeSeconds },
      }));

      try {
        await recordStreamMetric({
          liveStreamId: state.liveStreamId!,
          currentViewers: viewers,
          avgBitrate: bitrate,
          avgFramerate: framerate,
          droppedFrames,
          recordedAt: new Date().toISOString(),
        });
      } catch (e) {
        // metrics should never block UI
        console.warn('recordStreamMetric failed', e);
      }
    }, 5000);

    return () => {
      if (metricsTimer.current) window.clearInterval(metricsTimer.current);
      metricsTimer.current = null;
    };
  }, [state.isLive, state.liveStreamId]);

  useEffect(() => {
    if (effectiveLiveId) generateObsConfig(effectiveLiveId);
  }, [effectiveLiveId, generateObsConfig]);

  const hasMissingKeys = useMemo(() => state.streams.some((s) => !s.streamKey), [state.streams]);

  return {
    loading,
    config: state,
    generateObsConfig,
    startProStream,
    stopProStream,
    hasMissingKeys,
  };
}

