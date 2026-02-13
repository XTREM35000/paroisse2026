/**
 * Universal Video Player Component (REFACTORED v2)
 *
 * Automatically renders the appropriate player based on provider capabilities and available sources.
 * Supports:
 * - Iframe players (YouTube, Restream, API.Video, etc.)
 * - HLS streaming (adaptive bitrate)
 * - Audio/radio streaming
 * - Automatic fallback if primary playback fails
 * - Mobile-friendly rendering
 */

import React, { useMemo, useState, useEffect } from 'react';
import {
  streamManager,
  type StreamSources,
  type ProviderType,
  type Playback,
  type PlayerOptions,
} from '@/lib/providers';

type Props = {
  // New API (preferred)
  sources?: StreamSources;
  provider?: ProviderType;

  // Legacy API (backward compatibility)
  url?: string;

  // Common
  title?: string;
  streamType?: 'tv' | 'radio';
  poster?: string;
  autoplay?: boolean;
  options?: PlayerOptions;

  // Callbacks
  onError?: (error: Error) => void;
  onPlayerReady?: () => void;
};

/**
 * Universal video player supporting multiple streaming providers
 * New architecture: Uses streamManager for provider routing
 */
const VideoPlayer: React.FC<Props> = ({
  sources,
  provider = 'restream',
  url,
  title = 'Video',
  streamType = 'tv',
  poster,
  autoplay = false,
  options = {},
  onError,
  onPlayerReady,
}) => {
  const [playback, setPlayback] = useState<Playback | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [playerKey, setPlayerKey] = useState(0); // For resetting player

  // Determine which sources to use: new (sources) or legacy (url)
  const actualSources = useMemo(() => {
    if (sources && Object.keys(sources).length > 0) {
      return sources;
    }
    return url ? { url } : {};
  }, [sources, url]);

  // Normalize and get playback strategy
  useEffect(() => {
    try {
      // Validate we have sources
      if (!actualSources || Object.keys(actualSources).length === 0) {
        setError(new Error('Aucune source disponible'));
        setPlayback(null);
        return;
      }

      // Normalize using provider-specific normalizer
      const normalized = streamManager.normalize(provider, actualSources);

      // Validate the normalized sources
      if (!streamManager.validate(provider, normalized.sources)) {
        throw new Error(
          `Les sources fournies ne correspondent pas aux formats supportés par ${streamManager.getCapability(provider).label}`
        );
      }

      // Get playback instruction
      const pb = streamManager.getPlayback(provider, normalized.sources);
      if (!pb) {
        throw new Error(`Impossible de déterminer la stratégie de lecteur pour ${provider}`);
      }

      setPlayback(pb);
      setError(null);
      onPlayerReady?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[VideoPlayer] Error:', error);
      setError(error);
      setPlayback(null);
      onError?.(error);
    }
  }, [provider, actualSources, onError, onPlayerReady]);

  // Handle error and try fallback
  const handlePlayerError = (fallbackIndex = 0) => {
    try {
      if (!playback?.fallbacks || fallbackIndex >= playback.fallbacks.length) {
        const err = new Error('Aucune source de fallback disponible');
        setError(err);
        onError?.(err);
        return;
      }

      const fallback = playback.fallbacks[fallbackIndex];
      setPlayback(fallback);
      setPlayerKey((k) => k + 1); // Reset player
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
    }
  };

  // No sources error
  if (!actualSources || Object.keys(actualSources).length === 0) {
    return (
      <div className="aspect-video w-full bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Aucune source vidéo disponible</p>
        </div>
      </div>
    );
  }

  // Error occurred
  if (error) {
    return (
      <div className="aspect-video w-full bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-center p-4">
        <div className="text-center">
          <p className="font-semibold text-red-900 dark:text-red-100">Erreur de lecture vidéo</p>
          <p className="text-sm text-red-800 dark:text-red-200 mt-2">{error.message}</p>
          <p className="text-xs text-red-700 dark:text-red-300 mt-1">Provider: {provider}</p>
        </div>
      </div>
    );
  }

  // No playback determined
  if (!playback) {
    return (
      <div className="aspect-video w-full bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Chargement du lecteur...</p>
        </div>
      </div>
    );
  }

  // Render appropriate player based on playback type
  return (
    <div key={playerKey} className="w-full">
      {playback.type === 'iframe' && (
        <IframePlayer
          src={playback.src}
          title={title}
          onError={() => handlePlayerError(0)}
        />
      )}

      {playback.type === 'hls' && (
        <HlsPlayer
          src={playback.src}
          title={title}
          poster={poster}
          autoplay={autoplay}
          onError={() => handlePlayerError(0)}
        />
      )}

      {playback.type === 'audio' && (
        <AudioPlayer
          src={playback.src}
          title={title}
          autoplay={autoplay}
          onError={() => handlePlayerError(0)}
        />
      )}
    </div>
  );
};

// ============================================================================
// Player Components
// ============================================================================

/**
 * Iframe Player - for embedded content (YouTube, Restream, API.Video, etc.)
 */
const IframePlayer: React.FC<{
  src: string;
  title?: string;
  onError?: () => void;
}> = ({ src, title = 'Video', onError }) => {
  return (
    <div className="w-full aspect-video rounded-lg overflow-hidden bg-black">
      <iframe
        key={`iframe-${src}`}
        src={src}
        title={title}
        allowFullScreen
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        className="w-full h-full"
        onError={onError}
      />
    </div>
  );
};

/**
 * HLS Player - for HTTP Live Streaming (adaptive bitrate)
 * Supports HLS natively on Safari, uses hls.js as fallback for other browsers
 */
const HlsPlayer: React.FC<{
  src: string;
  title?: string;
  poster?: string;
  autoplay?: boolean;
  onError?: () => void;
}> = ({ src, title = 'Video', poster, autoplay = false, onError }) => {
  const playerId = useMemo(() => `player-${Math.random().toString(36).slice(2, 9)}`, []);

  useEffect(() => {
    const video = document.getElementById(playerId) as HTMLVideoElement;
    if (!video) return;

    // If browser supports HLS natively (Safari), video tag will handle it
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      return;
    }

    // Otherwise, try to load hls.js from CDN
    const loadHlsJs = async () => {
      try {
        if (!(window as any).Hls) {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/hls.js@1.4.0/dist/hls.min.js';
          script.async = true;
          document.body.appendChild(script);

          await new Promise<void>((resolve, reject) => {
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load hls.js'));
          });
        }

        const Hls = (window as any).Hls;
        if (Hls && Hls.isSupported && Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(Hls.Events.ERROR, (event: any, data: any) => {
            console.warn('[HLS] Error:', data);
            if (data.fatal) {
              onError?.();
            }
          });
        }
      } catch (err) {
        console.warn('[HlsPlayer] Failed to load hls.js:', err);
        onError?.();
      }
    };

    loadHlsJs();
  }, [src, playerId, onError]);

  return (
    <div className="w-full aspect-video rounded-lg overflow-hidden bg-black">
      <video
        id={playerId}
        className="w-full h-full"
        controls
        playsInline
        autoPlay={autoplay}
        poster={poster}
        onError={onError}
      >
        <source src={src} type="application/vnd.apple.mpegurl" />
        Your browser does not support HLS streaming. Please try another browser.
      </video>
    </div>
  );
};

/**
 * Audio Player - for audio/radio streaming
 */
const AudioPlayer: React.FC<{
  src: string;
  title?: string;
  autoplay?: boolean;
  onError?: () => void;
}> = ({ src, title = 'Audio', autoplay = false, onError }) => {
  return (
    <div className="w-full space-y-2">
      {title && <p className="text-sm font-medium text-foreground">{title}</p>}
      <audio
        controls
        autoPlay={autoplay}
        className="w-full rounded-lg"
        onError={onError}
      >
        <source src={src} type="audio/mpeg" />
        Your browser does not support audio streaming. Please try another browser.
      </audio>
    </div>
  );
};

export default VideoPlayer;
