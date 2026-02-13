/**
 * Base Interface for Stream Normalizers
 * 
 * Each provider must implement this interface to handle:
 * - Validation of input data
 * - Normalization of raw input (legacy field names → standard format)
 * - Determining playback strategy
 */

import {
  IStreamNormalizer,
  StreamSources,
  RawStreamInput,
  Playback,
} from '../types';

/**
 * Abstract base class for provider normalizers
 * Provides common utility functions
 */
export abstract class StreamNationalizerBase implements IStreamNormalizer {
  /**
   * Check if text looks like an HTML iframe embed
   */
  protected isIframe(text?: string): boolean {
    return !!(text && text.trim().startsWith('<iframe'));
  }

  /**
   * Check if URL looks like an HLS manifest
   */
  protected isHls(url?: string): boolean {
    return !!(url && url.toLowerCase().includes('.m3u8'));
  }

  /**
   * Check if URL looks like audio content
   */
  protected isAudio(url?: string): boolean {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return (
      lowerUrl.endsWith('.mp3') ||
      lowerUrl.endsWith('.aac') ||
      lowerUrl.endsWith('.ogg') ||
      lowerUrl.endsWith('.wav') ||
      lowerUrl.includes('/audio') ||
      lowerUrl.includes('/radio')
    );
  }

  /**
   * Extract YouTube video ID from various formats
   */
  protected extractYoutubeId(input: string): string | null {
    if (!input) return null;

    // Try to extract from standard patterns
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/, // Standard patterns
      /^([A-Za-z0-9_-]{11})$/, // Raw ID (11 chars)
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Trim and return undefined if empty
   */
  protected clean(value?: string): string | undefined {
    if (!value) return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  // Abstract methods - must be implemented by subclasses

  abstract validate(sources: StreamSources): boolean;

  abstract normalize(raw: RawStreamInput): StreamSources;

  abstract getPlayback(sources: StreamSources): Playback | null;

  getAllFallbacks?(sources: StreamSources): Playback[] {
    const primary = this.getPlayback(sources);
    return primary ? [primary] : [];
  }
}

/**
 * Export for use in other modules
 */
export type { IStreamNormalizer };
