-- Allow instagram and tiktok values in live_streams.provider constraint

ALTER TABLE public.live_streams
  DROP CONSTRAINT IF EXISTS live_streams_provider_check;

ALTER TABLE public.live_streams
  ADD CONSTRAINT live_streams_provider_check CHECK (provider IN (
    'youtube',
    'restream',
    'app.restream',
    'api_video',
    'radio_stream',
    'facebook',
    'instagram',
    'tiktok'
  ));

-- Add video_id column to store the raw identifier for embeds
ALTER TABLE public.live_streams
  ADD COLUMN IF NOT EXISTS video_id TEXT;

-- try to populate video_id from existing stream_url for common patterns
UPDATE public.live_streams
SET video_id = regexp_replace(stream_url, '^.*(?:v=|v\/|embed\/|youtu\.be\/|videos\/|twitch\.tv\/|@[^/]+\/|tiktok\.com\/).*?(\w+)(?:\?.*)?$', '\1')
WHERE video_id IS NULL AND stream_url IS NOT NULL;

-- optional: update existing rows where URL indicates instagram or tiktok
UPDATE public.live_streams
SET provider = 'instagram'
WHERE (stream_url ILIKE '%instagram.com/%' OR (stream_sources->>'url') ILIKE '%instagram.com/%')
  AND provider NOT IN ('instagram');

UPDATE public.live_streams
SET provider = 'tiktok'
WHERE (stream_url ILIKE '%tiktok.com/%' OR (stream_sources->>'url') ILIKE '%tiktok.com/%')
  AND provider NOT IN ('tiktok');
