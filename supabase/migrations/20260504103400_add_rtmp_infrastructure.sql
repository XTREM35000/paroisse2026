-- =====================================================
-- RTMP infrastructure (keys, configs, metrics, sessions)
-- 2026-05-04
-- =====================================================

BEGIN;

-- Needed for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- 0) Helper: updated_at trigger function (safe to re-run)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- 1) RTMP keys (stored encrypted by app / edge)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rtmp_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_stream_id UUID NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,

  -- The application encrypts before storing (do NOT store plaintext keys).
  encrypted_stream_key TEXT NOT NULL,
  key_iv TEXT NOT NULL,

  key_created_at TIMESTAMPTZ DEFAULT NOW(),
  key_expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  usage_count INT DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- One key per provider per live
CREATE UNIQUE INDEX IF NOT EXISTS uq_rtmp_keys_live_provider
  ON public.rtmp_keys(live_stream_id, provider);

CREATE INDEX IF NOT EXISTS idx_rtmp_keys_live_stream
  ON public.rtmp_keys(live_stream_id);

CREATE INDEX IF NOT EXISTS idx_rtmp_keys_provider
  ON public.rtmp_keys(provider);

-- ---------------------------------------------------------------------
-- 2) Advanced stream configuration (ABR, CDN, latency)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stream_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_stream_id UUID NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE UNIQUE,

  -- Quality
  bitrate INTEGER DEFAULT 4500,
  max_bitrate INTEGER DEFAULT 6000,
  min_bitrate INTEGER DEFAULT 2500,

  -- Resolution
  width INTEGER DEFAULT 1920,
  height INTEGER DEFAULT 1080,
  fps INTEGER DEFAULT 30,

  -- Adaptive bitrate
  enable_abr BOOLEAN DEFAULT true,
  abr_variants JSONB DEFAULT '[
    {"bitrate": 2500, "width": 1280, "height": 720, "fps": 30},
    {"bitrate": 4500, "width": 1920, "height": 1080, "fps": 30}
  ]'::jsonb,

  -- Backup / latency / DVR
  backup_stream_url TEXT,
  latency_seconds INT DEFAULT 2,
  dvr_duration_minutes INT DEFAULT 120,

  -- CDN
  cdn_pull_url TEXT,
  cdn_push_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_stream_configs_updated_at ON public.stream_configs;
CREATE TRIGGER update_stream_configs_updated_at
  BEFORE UPDATE ON public.stream_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------
-- 3) Metrics (append-only time series)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stream_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_stream_id UUID NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,

  current_viewers INTEGER DEFAULT 0,
  peak_viewers INTEGER DEFAULT 0,
  total_duration_seconds INTEGER DEFAULT 0,

  avg_bitrate REAL,
  avg_framerate REAL,
  dropped_frames INTEGER DEFAULT 0,
  reconnect_count INTEGER DEFAULT 0,

  ingest_node TEXT,
  cdn_node TEXT,

  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stream_metrics_live_stream
  ON public.stream_metrics(live_stream_id);

CREATE INDEX IF NOT EXISTS idx_stream_metrics_recorded_at
  ON public.stream_metrics(recorded_at);

-- ---------------------------------------------------------------------
-- 4) Sessions (history for each “go live”)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stream_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_stream_id UUID NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,

  max_viewers INTEGER,
  avg_bitrate REAL,
  ingest_server TEXT,
  status TEXT DEFAULT 'active',

  vod_url TEXT,
  vod_storage_path TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stream_sessions_live_stream
  ON public.stream_sessions(live_stream_id);

-- ---------------------------------------------------------------------
-- 5) RLS
-- Uses your existing `public.admin_users` helper table from migration 014.
-- ---------------------------------------------------------------------
ALTER TABLE public.rtmp_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_sessions ENABLE ROW LEVEL SECURITY;

-- Drop in case of re-run
DROP POLICY IF EXISTS rtmp_keys_admin_all ON public.rtmp_keys;
DROP POLICY IF EXISTS stream_configs_admin_all ON public.stream_configs;
DROP POLICY IF EXISTS stream_metrics_anyone_select ON public.stream_metrics;
DROP POLICY IF EXISTS stream_metrics_admin_write ON public.stream_metrics;
DROP POLICY IF EXISTS stream_sessions_anyone_select ON public.stream_sessions;
DROP POLICY IF EXISTS stream_sessions_admin_write ON public.stream_sessions;

-- Admins can manage keys/configs
CREATE POLICY rtmp_keys_admin_all
  ON public.rtmp_keys
  FOR ALL
  USING (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()))
  WITH CHECK (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

CREATE POLICY stream_configs_admin_all
  ON public.stream_configs
  FOR ALL
  USING (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()))
  WITH CHECK (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- Metrics: readable by everyone, writable by admins (or ingest service using service role)
CREATE POLICY stream_metrics_anyone_select
  ON public.stream_metrics
  FOR SELECT
  USING (true);

CREATE POLICY stream_metrics_admin_write
  ON public.stream_metrics
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- Sessions: readable by everyone, writable by admins
CREATE POLICY stream_sessions_anyone_select
  ON public.stream_sessions
  FOR SELECT
  USING (true);

CREATE POLICY stream_sessions_admin_write
  ON public.stream_sessions
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

COMMIT;

