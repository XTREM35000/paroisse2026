/**
 * Restream Provider Normalizer
 * 
 * Handles:
 * - Restream URLs: https://restream.io/live/...
 * - Embed iframes: <iframe src="https://restream.io/player/live/..."></iframe>
 * - HLS manifests: https://live.restream.io/live/{key}/index.m3u8
 * - Generic URLs as fallback
 * 
 * Playback priority: embed (iframe) → HLS → URL
 */

import { StreamSources, RawStreamInput, Playback } from '../types';
import { StreamNationalizerBase } from './StreamNormalizerBase';

export class ReestreamNormalizer extends StreamNationalizerBase {
  /**
   * Restream is valid if it has at least one source:
   * - embed iframe OR
   * - HLS manifest OR
   * - direct URL
   */
  validate(sources: StreamSources): boolean {
    return !!(this.isIframe(sources.embed) || this.isHls(sources.hls) || sources.url);
  }

  /**
   * Normalize raw input to standard StreamSources
   * Handles both current field names and legacy names
   */
  normalize(raw: RawStreamInput): StreamSources {
    // Detect embed (current or legacy name)
    let embed = this.clean(raw.embed);
    if (!embed && raw.embed_html) {
      embed = this.clean(raw.embed_html);
    }
    if (!embed && raw.stream_url && this.isIframe(raw.stream_url)) {
      embed = this.clean(raw.stream_url);
    }

    // Detect HLS (current or legacy name)
    let hls = this.clean(raw.hls);
    if (!hls && raw.hls_url) {
      hls = this.clean(raw.hls_url);
    }
    if (!hls && raw.stream_url && this.isHls(raw.stream_url)) {
      hls = this.clean(raw.stream_url);
    }

    // Fallback URL (only if no embed or hls detected)
    let url: string | undefined;
    if (!embed && !hls && raw.stream_url) {
      url = this.clean(raw.stream_url);
    }
    if (!url && raw.url) {
      url = this.clean(raw.url);
    }

    return {
      embed,
      hls,
      url,
    };
  }

  /**
   * Get playback strategy - prefer iframe, then HLS, then URL
   */
  getPlayback(sources: StreamSources): Playback | null {
    // Priority 1: Embed iframe (best UX on desktop)
    if (sources.embed && this.isIframe(sources.embed)) {
      return {
        type: 'iframe',
        src: sources.embed,
        fallbacks: this.getAllFallbacks(sources).slice(1),
      };
    }

    // Priority 2: HLS (best for mobile and adaptive bitrate)
    if (sources.hls) {
      return {
        type: 'hls',
        src: sources.hls,
        fallbacks: this.getAllFallbacks(sources).slice(1),
      };
    }

    // Priority 3: Direct URL (fallback)
    if (sources.url) {
      // If URL is an iframe, render as iframe
      if (this.isIframe(sources.url)) {
        return {
          type: 'iframe',
          src: sources.url,
        };
      }
      // If URL is HLS, render as HLS
      if (this.isHls(sources.url)) {
        return {
          type: 'hls',
          src: sources.url,
        };
      }
      // Otherwise try to embed URL directly (might work for Restream)
      return {
        type: 'iframe',
        src: sources.url,
      };
    }

    return null;
  }

  /**
   * Get all fallback options (ordered by preference)
   */
  getAllFallbacks(sources: StreamSources): Playback[] {
    const fallbacks: Playback[] = [];

    // If we're not already using embed, try it
    if (!this.isIframe(sources.embed)) {
      if (sources.embed && this.isIframe(sources.embed)) {
        fallbacks.push({ type: 'iframe', src: sources.embed });
      }
    }

    // If we're not already using HLS, try it
    if (!this.isHls(sources.hls)) {
      if (sources.hls) {
        fallbacks.push({ type: 'hls', src: sources.hls });
      }
    }

    // If we're not already using URL, try it
    if (sources.url && !this.isIframe(sources.url) && !this.isHls(sources.url)) {
      fallbacks.push({
        type: 'iframe',
        src: sources.url,
      });
    }

    return fallbacks;
  }
}

/**
 * app.restream uses the same normalization logic as restream
 */
export class AppReestreamNormalizer extends ReestreamNormalizer {
  // Inherits all behavior from ReestreamNormalizer
}
