import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { extractVideoId } from '@/lib/providers/videoUtils';
import {
  fetchActiveLiveStream,
  fetchLiveProviderSources,
  type LiveStream,
} from '@/lib/supabase/mediaQueries';
import type { LiveProviderSource } from '@/types/database';
import type { ProviderType } from '@/lib/providers/types';

export interface RtmpConfig {
  provider: ProviderType | LiveProviderSource['provider'];
  rtmpServer: string;
  streamKey: string;
  isActive: boolean;
  embedUrl: string;
}

interface ObsMultiStreamState {
  streams: RtmpConfig[];
  mainStream: LiveStream | null;
  obsWebSocketConnected: boolean;
}

const DEFAULT_RTMP_SERVERS: Record<string, string> = {
  youtube: 'rtmp://a.rtmp.youtube.com/live2',
  facebook: 'rtmps://live-api-s.facebook.com:443/rtmp/',
  twitch: 'rtmp://live.twitch.tv/app',
  tiktok: 'rtmp://push-rtmp.tiktok.com/live/',
  instagram: 'rtmps://live-upload.instagram.com:443/rtmp/',
  custom: '',
  restream: '',
  'app.restream': '',
  api_video: '',
  radio_stream: '',
};

export function useObsMultiStream(liveStreamId?: string) {
  const { toast } = useToast();

  const [state, setState] = useState<ObsMultiStreamState>({
    streams: [],
    mainStream: null,
    obsWebSocketConnected: false,
  });
  const [loading, setLoading] = useState(false);
  const [obsSocket, setObsSocket] = useState<WebSocket | null>(null);

  const getRtmpServer = useCallback((provider: string): string => {
    return DEFAULT_RTMP_SERVERS[provider] || '';
  }, []);

  const toStreamKeyFromUrlOrId = useCallback((provider: string, value: string): string => {
    const trimmed = String(value || '').trim();
    if (!trimmed) return '';
    if (provider === 'youtube' || provider === 'facebook' || provider === 'twitch' || provider === 'tiktok') {
      return extractVideoId(trimmed, provider as any);
    }
    return trimmed;
  }, []);

  const generateObsConfig = useCallback(
    async (streamId: string) => {
      setLoading(true);
      try {
        const { data: mainStream, error } = await supabase
          .from('live_streams')
          .select('*')
          .eq('id', streamId)
          .maybeSingle();
        if (error) throw error;

        const sources = await fetchLiveProviderSources(streamId);

        const mainProvider = (mainStream?.provider || 'youtube') as ProviderType;
        const next: RtmpConfig[] = [];

        if (mainStream) {
          next.push({
            provider: mainProvider,
            rtmpServer: getRtmpServer(mainProvider),
            streamKey: toStreamKeyFromUrlOrId(mainProvider, mainStream.video_id || ''),
            isActive: !!mainStream.is_active,
            embedUrl: mainStream.stream_url || '',
          });
        }

        (sources || []).forEach((s) => {
          const p = s.provider;
          if (next.some((x) => x.provider === p)) return;
          next.push({
            provider: p,
            rtmpServer: getRtmpServer(p),
            streamKey: toStreamKeyFromUrlOrId(p, s.url),
            isActive: true,
            embedUrl: s.url,
          });
        });

        setState((prev) => ({
          ...prev,
          streams: next,
          mainStream: (mainStream as any) || null,
        }));

        try {
          const obsConfigJson = JSON.stringify(
            next.map((s) => ({ name: String(s.provider), server: s.rtmpServer, key: s.streamKey })),
            null,
            2
          );
          localStorage.setItem(`obs_config_${streamId}`, obsConfigJson);
        } catch {
          // ignore localStorage errors
        }

        return next;
      } catch (e) {
        console.error('Error generating OBS config:', e);
        toast({
          title: 'Erreur',
          description: 'Impossible de générer la config OBS',
          variant: 'destructive',
        });
        return [];
      } finally {
        setLoading(false);
      }
    },
    [getRtmpServer, toStreamKeyFromUrlOrId, toast]
  );

  const exportObsConfig = useCallback(
    (format: 'json' | 'xml' | 'txt' = 'json') => {
      const configData = state.streams.map((s) => ({
        name: String(s.provider).toUpperCase(),
        server: s.rtmpServer,
        streamKey: s.streamKey,
        enabled: s.isActive,
      }));

      let content = '';
      let mimeType = 'text/plain';
      let extension = 'txt';

      if (format === 'json') {
        content = JSON.stringify(configData, null, 2);
        mimeType = 'application/json';
        extension = 'json';
      } else if (format === 'xml') {
        content = `<?xml version="1.0" encoding="UTF-8"?>\n<obs-multi-rtmp>\n${configData
          .map(
            (s) =>
              `  <stream>\n    <name>${s.name}</name>\n    <server>${s.server}</server>\n    <key>${s.streamKey}</key>\n    <enabled>${s.enabled}</enabled>\n  </stream>`
          )
          .join('\n')}\n</obs-multi-rtmp>`;
        mimeType = 'application/xml';
        extension = 'xml';
      } else {
        content = configData
          .map((s) => `[${s.name}]\nServer: ${s.server}\nKey: ${s.streamKey}\nEnabled: ${s.enabled}\n---\n`)
          .join('\n');
        mimeType = 'text/plain';
        extension = 'txt';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `obs-multi-stream-config.${extension}`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: 'Exporté', description: `Configuration exportée (${format.toUpperCase()})` });
    },
    [state.streams, toast]
  );

  const connectObsWebSocket = useCallback(
    async (password?: string) => {
      try {
        const socket = new WebSocket('ws://localhost:4455');

        socket.onopen = () => {
          if (password) {
            socket.send(
              JSON.stringify({
                op: 1,
                d: { rpcVersion: 1, authentication: password },
              })
            );
          }
          setState((prev) => ({ ...prev, obsWebSocketConnected: true }));
          toast({ title: 'OBS connecté', description: 'Contrôle à distance activé' });
        };

        socket.onerror = () => {
          setState((prev) => ({ ...prev, obsWebSocketConnected: false }));
        };

        socket.onclose = () => {
          setState((prev) => ({ ...prev, obsWebSocketConnected: false }));
        };

        setObsSocket(socket);
      } catch (e) {
        console.error('Failed to connect to OBS:', e);
        setState((prev) => ({ ...prev, obsWebSocketConnected: false }));
      }
    },
    [toast]
  );

  const startObsStream = useCallback(() => {
    if (!obsSocket || obsSocket.readyState !== WebSocket.OPEN) {
      toast({
        title: 'OBS non connecté',
        description: 'Connectez OBS WebSocket avant de démarrer',
        variant: 'destructive',
      });
      return;
    }
    obsSocket.send(JSON.stringify({ op: 6, d: { requestType: 'StartStream', requestId: 'start-stream' } }));
    toast({ title: 'Commande envoyée', description: 'Démarrage du stream sur OBS…' });
  }, [obsSocket, toast]);

  const stopObsStream = useCallback(() => {
    if (!obsSocket || obsSocket.readyState !== WebSocket.OPEN) {
      toast({ title: 'OBS non connecté', variant: 'destructive' });
      return;
    }
    obsSocket.send(JSON.stringify({ op: 6, d: { requestType: 'StopStream', requestId: 'stop-stream' } }));
    toast({ title: 'Commande envoyée', description: 'Arrêt du stream sur OBS…' });
  }, [obsSocket, toast]);

  useEffect(() => {
    return () => {
      try {
        obsSocket?.close();
      } catch {
        // ignore
      }
    };
  }, [obsSocket]);

  const liveId = useMemo(() => liveStreamId?.trim() || undefined, [liveStreamId]);

  const refreshFromActive = useCallback(async () => {
    const active = await fetchActiveLiveStream();
    if (active?.id) await generateObsConfig(active.id);
  }, [generateObsConfig]);

  return {
    config: state,
    loading,
    generateObsConfig,
    exportObsConfig,
    connectObsWebSocket,
    startObsStream,
    stopObsStream,
    getRtmpServer,
    liveId,
    refreshFromActive,
  };
}

