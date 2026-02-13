-- Refactor Live Streams: Add stream_sources JSONB for extensible provider support
-- This migration maintains backward compatibility with existing stream_url records

-- Step 1: Add new stream_sources JSONB column (nullable for gradual migration)
ALTER TABLE public.live_streams 
ADD COLUMN stream_sources JSONB DEFAULT NULL;

-- Step 2: Add playback_strategy hint column (optional)
ALTER TABLE public.live_streams 
ADD COLUMN playback_strategy TEXT CHECK (playback_strategy IN ('primary', 'fallback'));

-- Step 3: Add description column (optional, for admin notes)
ALTER TABLE public.live_streams 
ADD COLUMN description TEXT DEFAULT NULL;

-- Step 4: Update provider constraint to include all supported providers
ALTER TABLE public.live_streams 
DROP CONSTRAINT IF EXISTS live_streams_provider_check;

ALTER TABLE public.live_streams
ADD CONSTRAINT live_streams_provider_check CHECK (provider IN (
  'youtube',
  'restream',
  'app.restream',
  'api_video',
  'radio_stream'
));

-- Step 5: Populate stream_sources from legacy stream_url for existing records
-- This ensures backward compatibility during the transition period
UPDATE public.live_streams 
SET stream_sources = jsonb_build_object(
  'url', stream_url
)
WHERE stream_sources IS NULL AND stream_url IS NOT NULL;

-- Step 6: Add constraint to ensure at least one source is present
ALTER TABLE public.live_streams
ADD CONSTRAINT live_streams_sources_not_empty CHECK (
  stream_sources IS NULL OR (
    (stream_sources->>'url' IS NOT NULL AND stream_sources->>'url' != '') OR
    (stream_sources->>'embed' IS NOT NULL AND stream_sources->>'embed' != '') OR
    (stream_sources->>'hls' IS NOT NULL AND stream_sources->>'hls' != '') OR
    (stream_sources->>'audio' IS NOT NULL AND stream_sources->>'audio' != '')
  )
);

-- Step 7: Create partial index for active streams (common query)
CREATE INDEX IF NOT EXISTS idx_live_streams_active_updated
ON public.live_streams(updated_at DESC)
WHERE is_active = true;

-- Step 8: Create index for provider lookups with type
CREATE INDEX IF NOT EXISTS idx_live_streams_provider_type
ON public.live_streams(provider, stream_type);

-- Step 9: Create JSONB index for stream_sources for efficient queries
CREATE INDEX IF NOT EXISTS idx_live_streams_sources_gin
ON public.live_streams USING gin(stream_sources);

-- Step 10: Add comment documentation
COMMENT ON COLUMN public.live_streams.stream_sources IS 
'Extensible JSON structure storing multiple playback formats:
{
  "url": "Direct URL or fallback",
  "embed": "HTML iframe (e.g., Restream, YouTube)",
  "hls": "HLS manifest URL (.m3u8)",
  "audio": "Audio stream URL (MP3/AAC/OGG)"
}
Supports gradual migration from legacy stream_url field.';

COMMENT ON COLUMN public.live_streams.playback_strategy IS
'Optional hint to admin console about playback approach:
- "primary": This is the main playback source
- "fallback": Use only if primary unavailable
When NULL, system automatically selects based on provider capabilities.';

COMMENT ON COLUMN public.live_streams.provider IS
'Streaming provider for this live stream:
- "restream": Recommended for TV - supports iframe, HLS, URL
- "app.restream": Variant of restream
- "youtube": Video playback (not recommended as primary)
- "api_video": API.Video embed player
- "radio_stream": Audio streaming for radio content';
