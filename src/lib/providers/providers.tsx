import React from 'react';
import { LiveProvider, ProviderOptions, ProviderType } from './types';

/**
 * Extract YouTube video ID from various URL formats
 */
export function extractYouTubeId(input: string): string {
  if (!input) return '';

  let id: string | null = null;

  // Try URL parsing first
  try {
    const url = new URL(input);
    const host = url.hostname.replace('www.', '');

    if (host.includes('youtube.com')) {
      if (url.pathname.includes('/embed/')) {
        id = url.pathname.split('/embed/')[1].split('/')[0];
      } else if (url.pathname.includes('/shorts/')) {
        id = url.pathname.split('/shorts/')[1].split('/')[0];
      } else {
        id = url.searchParams.get('v');
      }
    } else if (host === 'youtu.be') {
      id = url.pathname.replace('/', '');
    }
  } catch (e) {
    // Not a full URL
  }

  // Try regex if no ID yet
  if (!id) {
    const match = input.match(/(?:v=|v\/|embed\/|shorts\/|youtu\.be\/|watch\?v=)([A-Za-z0-9_-]{11})/);
    if (match) id = match[1];
  }

  // If still no ID and input looks like an ID, use it directly
  if (!id && /^[A-Za-z0-9_-]{11}$/.test(input)) {
    id = input;
  }

  return id || '';
}

/**
 * YouTube Provider
 */
export const youtubeProvider: LiveProvider = {
  name: 'youtube',
  displayName: 'YouTube',
  description: 'Live streams from YouTube',
  
  detect: (url: string) => {
    return /youtube\.com|youtu\.be/.test(url);
  },
  
  extractUrl: (url: string) => {
    const id = extractYouTubeId(url);
    return id ? `https://www.youtube.com/watch?v=${id}` : url;
  },
  
  renderPlayer: (url: string, options: ProviderOptions = {}) => {
    const id = extractYouTubeId(url);
    if (!id) {
      return <div className="text-red-500">Invalid YouTube URL</div>;
    }
    
    // Build embed URL with enhanced parameters for better compatibility
    // Try nocookie variant first for privacy + fewer restrictions
    const embedUrl = `https://www.youtube-nocookie.com/embed/${id}?autoplay=${options.autoplay ? 1 : 0}&rel=0&modestbranding=1&fs=1&iv_load_policy=3`;
    const standardEmbed = `https://www.youtube.com/embed/${id}?autoplay=${options.autoplay ? 1 : 0}&rel=0&modestbranding=1&fs=1&iv_load_policy=3`;
    const width = options.width || '100%';
    const height = options.height || '100%';
    
    // Log for debugging
    console.log('🎬 YouTube Player:', { id, url, embedUrl, nocookieAttempt: true });
    
    return (
      <div className={`w-full bg-black rounded-lg overflow-hidden relative ${options.className || ''}`}>
        <div className="aspect-video w-full">
          <iframe
            width={width}
            height={height}
            src={embedUrl}
            title="YouTube Player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; web-share"
            allowFullScreen
            className="border-0 w-full h-full"
          />
          {/* Enhanced fallback overlay - more visible and always responsive */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-black via-black/60 to-transparent text-white text-center p-6 rounded-lg hover:bg-black/80 transition-all">
            <div className="icon mb-4 text-4xl">🎬</div>
            <p className="font-semibold mb-2 text-lg">Vidéo non disponible en lecture externe</p>
            <p className="text-sm text-gray-300 mb-4">Le propriétaire a restreint la lecture en dehors de YouTube</p>
            <a 
              href={`https://www.youtube.com/watch?v=${id}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors inline-block"
            >
              Lire sur YouTube
            </a>
            <p className="text-xs text-gray-400 mt-3 max-w-xs break-all">{id}</p>
          </div>
        </div>
      </div>
    );
  },
  
  streamType: 'tv',
  urlPlaceholder: 'https://www.youtube.com/watch?v=...',
  supportedFormats: [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    'dQw4w9WgXcQ (ID direct)',
  ],
};

/**
 * Restream Provider
 */
export const restreamProvider: LiveProvider = {
  name: 'restream',
  displayName: 'Restream',
  description: 'Multi-platform streaming via Restream',
  
  detect: (url: string) => {
    return /restream\.io|restream\.com/.test(url);
  },
  
  extractUrl: (url: string) => {
    // Restream URLs are usually embed URLs already
    return url;
  },
  
  renderPlayer: (url: string, options: ProviderOptions = {}) => {
    const width = options.width || '100%';
    const height = options.height || '100%';
    
    return (
      <div className={`w-full bg-black rounded-lg overflow-hidden ${options.className || ''}`}>
        <div className="aspect-video w-full">
          <iframe
            width={width}
            height={height}
            src={url}
            title="Restream Player"
            frameBorder="0"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; web-share"
            className="w-full h-full"
          />
        </div>
      </div>
    );
  },
  
  streamType: 'tv',
  urlPlaceholder: 'https://restream.io/embed/...',
  supportedFormats: [
    'https://restream.io/embed/...',
    'https://restream.com/embed/...',
  ],
};

/**
 * API.Video Provider
 */
export const apiVideoProvider: LiveProvider = {
  name: 'api_video',
  displayName: 'API.Video',
  description: 'Live streams from api.video',
  
  detect: (url: string) => {
    return /api\.video|embed\.api\.video/.test(url);
  },
  
  extractUrl: (url: string) => {
    // api.video URLs are usually embed URLs already
    return url;
  },
  
  renderPlayer: (url: string, options: ProviderOptions = {}) => {
    const width = options.width || '100%';
    const height = options.height || '100%';
    
    return (
      <div className={`w-full bg-black rounded-lg overflow-hidden ${options.className || ''}`}>
        <div className="aspect-video w-full">
          <iframe
            width={width}
            height={height}
            src={url}
            title="API.Video Player"
            frameBorder="0"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; web-share"
            className="w-full h-full"
          />
        </div>
      </div>
    );
  },
  
  streamType: 'tv',
  urlPlaceholder: 'https://embed.api.video/...',
  supportedFormats: [
    'https://embed.api.video/...',
    'https://api.video/...',
  ],
};

/**
 * Radio Stream Provider (HLS, M3U8, HTTP Audio)
 */
export const radioStreamProvider: LiveProvider = {
  name: 'radio_stream',
  displayName: 'Radio Stream',
  description: 'Audio streams (HLS, M3U8, HTTP URL)',
  
  detect: (url: string) => {
    return /m3u8|\.hls|\.m3u|streams|audio|radio|\.aac|\.mp3/.test(url.toLowerCase());
  },
  
  extractUrl: (url: string) => {
    // Radio URLs are direct stream URLs
    return url;
  },
  
  renderPlayer: (url: string, options: ProviderOptions = {}) => {
    return (
      <div className={`w-full bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg p-6 ${options.className || ''}`}>
        <div className="flex items-center justify-center min-h-[120px]">
          <audio
            controls
            src={url}
            controlsList="nodownload"
            className="w-full"
            autoPlay={options.autoplay}
          >
            Your browser does not support the audio element.
          </audio>
        </div>
      </div>
    );
  },
  
  streamType: 'radio',
  urlPlaceholder: 'https://stream.example.com/live.m3u8',
  supportedFormats: [
    'https://stream.example.com/live.m3u8',
    'https://radio.example.com/stream.aac',
    'https://example.com/audio.mp3',
  ],
};

/**
 * Custom Embed Provider (HTML5, generic iframe)
 */
export const customEmbedProvider: LiveProvider = {
  name: 'youtube' as ProviderType, // Fallback to youtube type
  displayName: 'Custom Embed',
  description: 'Generic iframe or HTML5 embed',
  
  detect: (url: string) => {
    return /iframe|embed|html/.test(url.toLowerCase());
  },
  
  extractUrl: (url: string) => {
    return url;
  },
  
  renderPlayer: (url: string, options: ProviderOptions = {}) => {
    const width = options.width || '100%';
    const height = options.height || '100%';
    
    return (
      <div className={`w-full bg-black rounded-lg overflow-hidden ${options.className || ''}`}>
        <div className="aspect-video w-full">
          <iframe
            width={width}
            height={height}
            src={url}
            title="Custom Embed"
            frameBorder="0"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; web-share"
            className="w-full h-full"
          />
        </div>
      </div>
    );
  },
  
  streamType: 'tv',
  urlPlaceholder: 'https://example.com/embed/...',
  supportedFormats: [
    'Generic iframe src URL',
  ],
};
