-- Migration: add stream_sources, playback_strategy, and replay_video_id to live_streams
-- 2026-02-12

BEGIN;

-- 1) Add stream_sources column (for storing multiple playback options)
ALTER TABLE IF EXISTS public.live_streams
  ADD COLUMN IF NOT EXISTS stream_sources jsonb DEFAULT NULL;

-- 2) Add playback_strategy column (for specifying primary vs fallback)
ALTER TABLE IF EXISTS public.live_streams
  ADD COLUMN IF NOT EXISTS playback_strategy varchar(32) DEFAULT NULL;

-- 3) Add replay_video_id column (for storing replay references)
ALTER TABLE IF EXISTS public.live_streams
  ADD COLUMN IF NOT EXISTS replay_video_id text DEFAULT NULL;

-- 4) Add provider column (for stream source provider)
ALTER TABLE IF EXISTS public.live_streams
  ADD COLUMN IF NOT EXISTS provider varchar(32) DEFAULT 'youtube';

-- 5) Add scheduled_at column (if not exists already)
ALTER TABLE IF EXISTS public.live_streams
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz DEFAULT NULL;

-- 6) Populate stream_sources from legacy stream_url where possible
UPDATE public.live_streams SET stream_sources = (
  CASE
    WHEN stream_url IS NULL THEN NULL
    WHEN stream_url::text LIKE '%<iframe%' THEN jsonb_build_object('embed', stream_url)
    WHEN lower(stream_url::text) LIKE '%.m3u8%' THEN jsonb_build_object('hls', stream_url)
    WHEN lower(stream_url::text) LIKE '%.mp3' OR lower(stream_url::text) LIKE '%.aac' OR lower(stream_url::text) LIKE '%.ogg' THEN jsonb_build_object('audio', stream_url)
    ELSE jsonb_build_object('url', stream_url)
  END
)
WHERE stream_sources IS NULL AND stream_url IS NOT NULL;

-- 7) Create indexes for JSON queries and playback_strategy
CREATE INDEX IF NOT EXISTS idx_live_streams_stream_sources ON public.live_streams USING gin (stream_sources);
CREATE INDEX IF NOT EXISTS idx_live_streams_playback_strategy ON public.live_streams(playback_strategy);
CREATE INDEX IF NOT EXISTS idx_live_streams_scheduled_at ON public.live_streams(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_live_streams_provider ON public.live_streams(provider);

COMMIT;

-- Note: The application code handles both new stream_sources and legacy stream_url
-- for backward compatibility. The stream_url column serves as a fallback.
