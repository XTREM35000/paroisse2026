-- Add Facebook provider support in live_streams table constraint and update existing rows

-- allow facebook value in provider check
ALTER TABLE public.live_streams
  DROP CONSTRAINT IF EXISTS live_streams_provider_check;

ALTER TABLE public.live_streams
  ADD CONSTRAINT live_streams_provider_check CHECK (provider IN (
    'youtube',
    'restream',
    'app.restream',
    'api_video',
    'radio_stream',
    'facebook'
  ));

-- update any existing records that look like facebook links
UPDATE public.live_streams
SET provider = 'facebook'
WHERE (
      stream_url ILIKE '%facebook.com/%'
      OR (stream_sources->>'url') ILIKE '%facebook.com/%'
    )
  AND provider <> 'facebook';
