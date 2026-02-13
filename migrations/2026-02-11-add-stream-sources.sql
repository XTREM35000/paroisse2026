-- Migration: add extensible `stream_sources` JSONB to live_streams
-- 2026-02-11

BEGIN;

-- 1) add column (nullable to avoid downtime)
ALTER TABLE live_streams
  ADD COLUMN IF NOT EXISTS stream_sources jsonb DEFAULT NULL;

-- 2) populate from legacy stream_url where possible
UPDATE live_streams SET stream_sources = (
  CASE
    WHEN stream_url IS NULL THEN NULL
    WHEN stream_url::text LIKE '%<iframe%' THEN jsonb_build_object('embed', stream_url)
    WHEN lower(stream_url::text) LIKE '%.m3u8%' THEN jsonb_build_object('hls', stream_url)
    WHEN lower(stream_url::text) LIKE '%.mp3' OR lower(stream_url::text) LIKE '%.aac' OR lower(stream_url::text) LIKE '%.ogg' THEN jsonb_build_object('audio', stream_url)
    ELSE jsonb_build_object('url', stream_url)
  END
)
WHERE stream_sources IS NULL;

-- 3) (optional) add a GIN index for JSON queries if desired
CREATE INDEX IF NOT EXISTS idx_live_streams_stream_sources ON live_streams USING gin (stream_sources);

COMMIT;

-- Note: After verification you may remove the legacy `stream_url` column
-- or keep it as a compatibility fallback. The application code writes both.
