/**
 * Radio Stream Provider Normalizer
 * 
 * Handles:
 * - Audio stream URLs: https://radio.example.com/live.mp3
 * - HLS audio playlists: https://radio.example.com/live.m3u8
 * - Various audio formats: MP3, AAC, OGG, WAV
 * 
 * Playback priority: audio (direct MP3/AAC) → HLS audio
 */

import { StreamSources, RawStreamInput, Playback } from '../types';
import { StreamNationalizerBase } from './StreamNormalizerBase';

export class RadioStreamNormalizer extends StreamNationalizerBase {
  /**
   * Radio Stream is valid if we have:
   * - An audio source, OR
   * - A URL that looks like audio
   */
  validate(sources: StreamSources): boolean {
    return !!(sources.audio || (sources.url && this.isAudio(sources.url)) || this.isHls(sources.hls));
  }

  /**
   * Normalize raw input to standard StreamSources
   * Detect and classify audio formats
   */
  normalize(raw: RawStreamInput): StreamSources {
    let audio: string | undefined;
    let hls: string | undefined;
    let url: string | undefined;

    // Check for explicit audio field (current)
    if (raw.audio) {
      audio = this.clean(raw.audio);
    }

    // Check for stream_url (legacy)
    if (raw.stream_url) {
      if (this.isAudio(raw.stream_url) && !audio) {
        audio = this.clean(raw.stream_url);
      } else if (this.isHls(raw.stream_url) && !hls) {
        hls = this.clean(raw.stream_url);
      } else if (!audio && !hls) {
        // Could be a generic URL
        url = this.clean(raw.stream_url);
      }
    }

    // Check for HLS field
    if (raw.hls && !hls) {
      hls = this.clean(raw.hls);
    }

    if (raw.hls_url && !hls) {
      hls = this.clean(raw.hls_url);
    }

    // Check for generic URL field
    if (raw.url && !audio && !hls) {
      if (this.isAudio(raw.url)) {
        audio = this.clean(raw.url);
      } else {
        url = this.clean(raw.url);
      }
    }

    return {
      audio,
      hls,
      url,
    };
  }

  /**
   * Get playback strategy - prefer audio, then HLS
   */
  getPlayback(sources: StreamSources): Playback | null {
    // Priority 1: Direct audio stream (MP3/AAC)
    if (sources.audio) {
      return {
        type: 'audio',
        src: sources.audio,
        fallbacks: this.getAllFallbacks(sources).slice(1),
      };
    }

    // Priority 2: HLS for audio (adaptive bitrate)
    if (sources.hls) {
      return {
        type: 'audio',
        src: sources.hls,
        fallbacks: this.getAllFallbacks(sources).slice(1),
      };
    }

    // Priority 3: Generic URL (assume audio)
    if (sources.url) {
      if (this.isAudio(sources.url)) {
        return {
          type: 'audio',
          src: sources.url,
        };
      }
      // If URL is HLS, try as audio
      if (this.isHls(sources.url)) {
        return {
          type: 'audio',
          src: sources.url,
        };
      }
      // Otherwise assume it's audio (best effort)
      return {
        type: 'audio',
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

    // If primary is audio, try HLS next
    if (sources.hls) {
      fallbacks.push({ type: 'audio', src: sources.hls });
    }

    // Then try generic URL
    if (sources.url) {
      fallbacks.push({ type: 'audio', src: sources.url });
    }

    return fallbacks;
  }
}
