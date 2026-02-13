/**
 * Stream Manager: Central orchestrator for all streaming operations
 * 
 * Responsible for:
 * - Routing to the correct provider normalizer
 * - Validating streams
 * - Normalizing raw input to standard format
 * - Determining playback strategy
 * - Providing provider metadata for UI
 */

import {
  ProviderType,
  StreamSources,
  RawStreamInput,
  NormalizedStream,
  Playback,
  IStreamNormalizer,
  PlayerOptions,
} from './types';

import { PROVIDER_REGISTRY, getProviderCapability } from './registry/ProviderRegistry';
import { ReestreamNormalizer, AppReestreamNormalizer } from './normalizers/ReestreamNormalizer';
import { YoutubeNormalizer } from './normalizers/YoutubeNormalizer';
import { ApiVideoNormalizer } from './normalizers/ApiVideoNormalizer';
import { RadioStreamNormalizer } from './normalizers/RadioStreamNormalizer';

/**
 * StreamManager: Single point of access for all streaming operations
 * 
 * Usage:
 * ```typescript
 * // Normalize raw input
 * const normalized = streamManager.normalize('restream', formData);
 * 
 * // Validate
 * const isValid = streamManager.validate('restream', normalized.sources);
 * 
 * // Get playback
 * const playback = streamManager.getPlayback('restream', normalized.sources);
 * ```
 */
class StreamManager {
  private normalizers: Map<ProviderType, IStreamNormalizer>;

  constructor() {
    this.normalizers = new Map([
      ['restream', new ReestreamNormalizer()],
      ['app.restream', new AppReestreamNormalizer()],
      ['youtube', new YoutubeNormalizer()],
      ['api_video', new ApiVideoNormalizer()],
      ['radio_stream', new RadioStreamNormalizer()],
    ]);
  }

  /**
   * Normalize raw input to standard StreamSources format
   * 
   * @param provider - The provider type
   * @param raw - Raw input (may include legacy field names)
   * @returns Normalized stream with standardized sources
   */
  normalize(
    provider: ProviderType,
    raw: RawStreamInput & { id?: string; title?: string; stream_type?: 'tv' | 'radio' }
  ): NormalizedStream {
    const normalizer = this.normalizers.get(provider);
    if (!normalizer) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    const sources = normalizer.normalize(raw);
    return {
      id: raw.id,
      title: raw.title,
      provider,
      stream_type: raw.stream_type,
      sources,
    };
  }

  /**
   * Validate that StreamSources are appropriate for this provider
   * 
   * @param provider - The provider type
   * @param sources - The sources to validate
   * @returns true if valid, false otherwise
   */
  validate(provider: ProviderType, sources: StreamSources): boolean {
    try {
      const normalizer = this.normalizers.get(provider);
      if (!normalizer) return false;
      return normalizer.validate(sources);
    } catch (error) {
      console.warn(`[StreamManager] Validation error for ${provider}:`, error);
      return false;
    }
  }

  /**
   * Get the preferred playback strategy for these sources
   * Returns null if no playback is possible
   * 
   * @param provider - The provider type
   * @param sources - The sources to play
   * @returns Playback instruction or null
   */
  getPlayback(provider: ProviderType, sources: StreamSources): Playback | null {
    try {
      const normalizer = this.normalizers.get(provider);
      if (!normalizer) return null;
      return normalizer.getPlayback(sources);
    } catch (error) {
      console.error(`[StreamManager] Playback error for ${provider}:`, error);
      return null;
    }
  }

  /**
   * Get all possible fallback playback options (ordered by preference)
   * Used for automatic failover if primary playback fails
   * 
   * @param provider - The provider type
   * @param sources - The sources to get fallbacks for
   * @returns Array of fallback playback options
   */
  getAllFallbacks(provider: ProviderType, sources: StreamSources): Playback[] {
    try {
      const normalizer = this.normalizers.get(provider);
      if (!normalizer || !normalizer.getAllFallbacks) return [];
      return normalizer.getAllFallbacks(sources) || [];
    } catch (error) {
      console.warn(`[StreamManager] Fallback error for ${provider}:`, error);
      return [];
    }
  }

  /**
   * Get metadata/capabilities for a specific provider
   * Used for rendering dynamic admin UI
   * 
   * @param provider - The provider type
   * @returns Provider capability metadata
   */
  getCapability(provider: ProviderType) {
    return getProviderCapability(provider);
  }

  /**
   * Get all available providers
   */
  getAllProviders() {
    return Array.from(this.normalizers.keys());
  }

  /**
   * Get all provider capabilities
   */
  getAllCapabilities() {
    const allProviders = this.getAllProviders();
    return allProviders.map(provider => this.getCapability(provider));
  }

  /**
   * Get providers suitable for primary playback
   * Filters out broadcast-only providers
   */
  getPrimaryPlaybackProviders() {
    return this.getAllCapabilities().filter(cap => cap.isPrimaryPlayback && !cap.isBroadcastOnly);
  }

  /**
   * Get recommended providers for a specific stream type
   * 
   * @param streamType - 'tv' or 'radio'
   * @returns Sorted list of recommended providers
   */
  getRecommendedProviders(streamType: 'tv' | 'radio') {
    const primary = this.getPrimaryPlaybackProviders();

    if (streamType === 'tv') {
      // For TV: Restream first, then others
      return primary.sort((a, b) => {
        if (a.id === 'restream') return -1;
        if (b.id === 'restream') return 1;
        return 0;
      });
    } else {
      // For radio: must support audio
      return primary.filter(
        cap => cap.inputFormats.includes('audio') || cap.playbackFormats.includes('audio')
      );
    }
  }

  /**
   * Helper: Check if provider supports a specific input format
   */
  supportsInputFormat(provider: ProviderType, format: 'url' | 'embed' | 'hls' | 'audio'): boolean {
    const capability = this.getCapability(provider);
    return capability.inputFormats.includes(format);
  }

  /**
   * Helper: Check if provider supports a specific playback type
   */
  supportsPlaybackType(provider: ProviderType, type: 'iframe' | 'hls' | 'audio'): boolean {
    const capability = this.getCapability(provider);
    return capability.playbackFormats.includes(type);
  }

  /**
   * Helper: Check if provider is suitable as primary playback
   */
  isPrimaryPlayback(provider: ProviderType): boolean {
    const capability = this.getCapability(provider);
    return capability.isPrimaryPlayback && !capability.isBroadcastOnly;
  }

  /**
   * Extract YouTube video ID from a string
   * Public utility for backward compatibility
   */
  extractYoutubeId(input: string): string | null {
    if (!input) return null;

    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
      /^([A-Za-z0-9_-]{11})$/,
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match && match[1]) return match[1];
    }

    return null;
  }
}

/**
 * Singleton instance - use this everywhere
 */
export const streamManager = new StreamManager();

/**
 * Also export the class for testing/extension
 */
export type { StreamManager };
export default streamManager;
