-- Add provider column to live_streams
ALTER TABLE public.live_streams ADD COLUMN provider TEXT DEFAULT 'youtube';

-- Set provider to api_video based on common api.video embed URLs
UPDATE public.live_streams
SET provider = 'api_video'
WHERE stream_url ILIKE '%api.video%' OR stream_url ILIKE '%embed.api.video%';

-- Set provider to youtube where URL indicates YouTube and not api.video
UPDATE public.live_streams
SET provider = 'youtube'
WHERE (stream_url ILIKE '%youtube.com%' OR stream_url ILIKE '%youtu.be%')
  AND NOT (stream_url ILIKE '%api.video%' OR stream_url ILIKE '%embed.api.video%');

-- For radio stream types, set provider to radio_stream
UPDATE public.live_streams
SET provider = 'radio_stream'
WHERE stream_type = 'radio';

-- Make column NOT NULL
ALTER TABLE public.live_streams ALTER COLUMN provider SET NOT NULL;

-- Add constraint to ensure valid providers
ALTER TABLE public.live_streams
  ADD CONSTRAINT live_streams_provider_check CHECK (provider IN ('youtube','api_video','radio_stream'));

-- Optional index for querying by provider
CREATE INDEX IF NOT EXISTS idx_live_streams_provider
  ON public.live_streams(provider);
