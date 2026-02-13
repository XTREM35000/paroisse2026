/**
 * YouTube Provider Normalizer
 * 
 * Handles:
 * - Video URLs: https://www.youtube.com/watch?v=VIDEO_ID
 * - Shortened URLs: https://youtu.be/VIDEO_ID
 * - Raw Video IDs: ABC123xyz (11 characters)
 * - Embed URLs: https://www.youtube.com/embed/VIDEO_ID
 * 
 * Note: YouTube is not recommended as PRIMARY playback source.
 * It's primarily a broadcast destination.
 * 
 * Playback: Always iframe (YouTube's Native player)
 */

import { StreamSources, RawStreamInput, Playback } from '../types';
import { StreamNationalizerBase } from './StreamNormalizerBase';

export class YoutubeNormalizer extends StreamNationalizerBase {
  /**
   * YouTube is valid if we can extract a valid video ID
   */
  validate(sources: StreamSources): boolean {
    if (sources.url) {
      const id = this.extractYoutubeId(sources.url);
      return !!id;
    }
    if (sources.embed) {
      // Check if embed contains YouTube
      return sources.embed.includes('youtube.com') || sources.embed.includes('youtu.be');
    }
    return false;
  }

  /**
   * Normalize raw input to standard StreamSources
   * Extract video ID and build standard URLs
   */
  normalize(raw: RawStreamInput): StreamSources {
    let videoId: string | null = null;
    let url: string | undefined;
    let embed: string | undefined;

    // Try to extract video ID from various sources
    if (raw.stream_url) {
      videoId = this.extractYoutubeId(raw.stream_url);
      if (!videoId && this.isIframe(raw.stream_url)) {
        // If it's already an iframe, keep it as embed
        embed = this.clean(raw.stream_url);
      }
    }

    if (!videoId && raw.url) {
      videoId = this.extractYoutubeId(raw.url);
    }

    if (!videoId && raw.embed && raw.embed.includes('youtube')) {
      embed = this.clean(raw.embed);
    }

    if (!videoId && raw.embed_html && raw.embed_html.includes('youtube')) {
      embed = this.clean(raw.embed_html);
    }

    // If we found a video ID, build standard URLs
    if (videoId) {
      url = `https://www.youtube.com/watch?v=${videoId}`;
      embed = `https://www.youtube.com/embed/${videoId}?rel=0`;
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
    // YouTube only supports iframe playback
    if (sources.embed) {
      return {
        type: 'iframe',
        src: sources.embed,
      };
    }

    if (sources.url) {
      const videoId = this.extractYoutubeId(sources.url);
      if (videoId) {
        return {
          type: 'iframe',
          src: `https://www.youtube.com/embed/${videoId}?rel=0`,
        };
      }
    }

    return null;
  }

  /**
   * No fallbacks for YouTube - it's all-or-nothing
   */
  getAllFallbacks(sources: StreamSources): Playback[] {
    // YouTube doesn't have fallback modes
    // If iframe fails, there's no HLS or audio alternative
    return [];
  }
}
