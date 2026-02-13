/**
 * API.Video Provider Normalizer
 * 
 * Handles:
 * - Embed URLs: https://embed.api.video/VIDEO_ID
 * - Direct URLs: https://api.video/...
 * - Embed iframe: <iframe src="https://embed.api.video/..."></iframe>
 * 
 * Playback: Always iframe (API.Video's secure player)
 */

import { StreamSources, RawStreamInput, Playback } from '../types';
import { StreamNationalizerBase } from './StreamNormalizerBase';

export class ApiVideoNormalizer extends StreamNationalizerBase {
  /**
   * API.Video is valid if we have an api.video URL or embed
   */
  validate(sources: StreamSources): boolean {
    if (sources.url) {
      return sources.url.includes('api.video');
    }
    if (sources.embed) {
      return sources.embed.includes('api.video');
    }
    return false;
  }

  /**
   * Normalize raw input to standard StreamSources
   * Standardize api.video URLs
   */
  normalize(raw: RawStreamInput): StreamSources {
    let url: string | undefined;
    let embed: string | undefined;

    // Check for direct api.video URL
    if (raw.stream_url && raw.stream_url.includes('api.video')) {
      if (this.isIframe(raw.stream_url)) {
        embed = this.clean(raw.stream_url);
      } else {
        url = this.clean(raw.stream_url);
        // Normalize to embed format if it's a direct URL
        if (url && url.includes('embed.api.video')) {
          embed = url;
          url = undefined;
        }
      }
    }

    if (!url && !embed) {
      if (raw.url && raw.url.includes('api.video')) {
        if (this.isIframe(raw.url)) {
          embed = this.clean(raw.url);
        } else {
          url = this.clean(raw.url);
        }
      }
    }

    if (!url && !embed) {
      if (raw.embed && raw.embed.includes('api.video')) {
        embed = this.clean(raw.embed);
      }
    }

    if (!url && !embed) {
      if (raw.embed_html && raw.embed_html.includes('api.video')) {
        embed = this.clean(raw.embed_html);
      }
    }

    return {
      url,
      embed,
    };
  }

  /**
   * Get playback strategy - always use embed iframe
   */
  getPlayback(sources: StreamSources): Playback | null {
    // Prefer embed format
    if (sources.embed && sources.embed.includes('api.video')) {
      return {
        type: 'iframe',
        src: sources.embed,
      };
    }

    // Fallback to URL
    if (sources.url && sources.url.includes('embed.api.video')) {
      return {
        type: 'iframe',
        src: sources.url,
      };
    }

    if (sources.url && sources.url.includes('api.video')) {
      // Try to normalize to embed URL
      if (sources.url.includes('embed.api.video')) {
        return {
          type: 'iframe',
          src: sources.url,
        };
      }
      // If it's a non-embed api.video URL, try as-is (might work)
      return {
        type: 'iframe',
        src: sources.url,
      };
    }

    return null;
  }

  /**
   * No fallbacks for API.Video
   */
  getAllFallbacks(sources: StreamSources): Playback[] {
    return [];
  }
}
