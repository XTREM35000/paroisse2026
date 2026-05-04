import { supabase } from '@/integrations/supabase/client';
import { RtmpKeyEncryption } from '@/lib/encryption/rtmpKeyEncryption';

export type RtmpProvider = 'youtube' | 'facebook' | 'twitch' | 'tiktok' | 'instagram' | 'custom';

export interface RtmpConfig {
  liveStreamId: string;
  provider: RtmpProvider | string;
  rtmpServer: string;
  /** decrypted */
  streamKey: string | null;
  keyExpiresAt?: string | null;
}

export interface StreamMetricInput {
  liveStreamId: string;
  currentViewers?: number;
  peakViewers?: number;
  avgBitrate?: number;
  avgFramerate?: number;
  droppedFrames?: number;
  reconnectCount?: number;
  ingestNode?: string;
  cdnNode?: string;
  recordedAt?: string;
}

const RTMP_SERVERS: Record<string, string> = {
  youtube: 'rtmp://a.rtmp.youtube.com/live2',
  facebook: 'rtmps://live-api-s.facebook.com:443/rtmp/',
  twitch: 'rtmp://live.twitch.tv/app',
  tiktok: 'rtmp://push-rtmp.tiktok.com/live/',
  instagram: 'rtmps://live-upload.instagram.com:443/rtmp/',
  custom: '',
};

export function getRtmpServerUrl(provider: string): string {
  return RTMP_SERVERS[provider] || '';
}

export async function upsertStreamConfig(liveStreamId: string, patch: Record<string, unknown>) {
  const { error } = await supabase.from('stream_configs').upsert(
    {
      live_stream_id: liveStreamId,
      ...patch,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'live_stream_id' }
  );
  if (error) throw error;
}

export async function saveRtmpKey(params: {
  liveStreamId: string;
  provider: string;
  plainKey: string;
  expiresAt?: string | null;
}) {
  const { ciphertext, iv } = await RtmpKeyEncryption.encrypt(params.plainKey);

  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id ?? null;

  const { error } = await supabase.from('rtmp_keys').upsert(
    {
      live_stream_id: params.liveStreamId,
      provider: params.provider,
      encrypted_stream_key: ciphertext,
      key_iv: iv,
      key_expires_at: params.expiresAt ?? null,
      created_by: userId,
      key_created_at: new Date().toISOString(),
    },
    { onConflict: 'live_stream_id,provider' }
  );
  if (error) throw error;
}

export async function getRtmpKey(params: { liveStreamId: string; provider: string }): Promise<RtmpConfig> {
  const { data, error } = await supabase
    .from('rtmp_keys')
    .select('encrypted_stream_key,key_iv,key_expires_at')
    .eq('live_stream_id', params.liveStreamId)
    .eq('provider', params.provider)
    .maybeSingle();

  if (error) throw error;

  const rtmpServer = getRtmpServerUrl(params.provider);
  if (!data) {
    return { liveStreamId: params.liveStreamId, provider: params.provider, rtmpServer, streamKey: null };
  }

  // expiration check
  if (data.key_expires_at && new Date(data.key_expires_at) < new Date()) {
    return {
      liveStreamId: params.liveStreamId,
      provider: params.provider,
      rtmpServer,
      streamKey: null,
      keyExpiresAt: data.key_expires_at,
    };
  }

  const streamKey = await RtmpKeyEncryption.decrypt(data.encrypted_stream_key, data.key_iv);
  return {
    liveStreamId: params.liveStreamId,
    provider: params.provider,
    rtmpServer,
    streamKey,
    keyExpiresAt: data.key_expires_at ?? null,
  };
}

export async function recordStreamMetric(input: StreamMetricInput) {
  const { error } = await supabase.from('stream_metrics').insert({
    live_stream_id: input.liveStreamId,
    current_viewers: input.currentViewers ?? 0,
    peak_viewers: input.peakViewers ?? 0,
    avg_bitrate: input.avgBitrate ?? null,
    avg_framerate: input.avgFramerate ?? null,
    dropped_frames: input.droppedFrames ?? 0,
    reconnect_count: input.reconnectCount ?? 0,
    ingest_node: input.ingestNode ?? null,
    cdn_node: input.cdnNode ?? null,
    recorded_at: input.recordedAt ?? new Date().toISOString(),
  });
  if (error) throw error;
}

export async function startStreamSession(liveStreamId: string) {
  const startedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('stream_sessions')
    .insert({ live_stream_id: liveStreamId, started_at: startedAt, status: 'active' })
    .select('id,started_at')
    .single();
  if (error) throw error;
  return data as { id: string; started_at: string };
}

export async function endStreamSession(sessionId: string, patch?: { vodUrl?: string; vodStoragePath?: string }) {
  const endedAt = new Date().toISOString();
  const { data: session, error: readErr } = await supabase
    .from('stream_sessions')
    .select('started_at')
    .eq('id', sessionId)
    .single();
  if (readErr) throw readErr;

  const durationSeconds = session?.started_at
    ? Math.max(0, Math.floor((new Date(endedAt).getTime() - new Date(session.started_at).getTime()) / 1000))
    : 0;

  const { error } = await supabase
    .from('stream_sessions')
    .update({
      ended_at: endedAt,
      duration_seconds: durationSeconds,
      status: 'ended',
      vod_url: patch?.vodUrl ?? null,
      vod_storage_path: patch?.vodStoragePath ?? null,
    })
    .eq('id', sessionId);
  if (error) throw error;
}

