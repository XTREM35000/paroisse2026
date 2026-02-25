/**
 * Core types for the streaming provider system (REFACTORED v2)
 * 
 * This defines the contract that all streaming providers must follow,
 * enabling extensible, robust multi-provider support.
 */

/**
 * Input formats that providers can accept
 */
export type StreamInputFormat = 'url' | 'embed' | 'hls' | 'audio';

/**
 * Output playback types that players support
 */
export type PlaybackType = 'iframe' | 'hls' | 'audio';

/**
 * Supported streaming provider identifiers
 */
export type ProviderType =
  | 'youtube'
  | 'restream'
  | 'app.restream'
  | 'api_video'
  | 'radio_stream'
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'twitch';

/**
 * Stream type classification
 */
export type StreamType = 'tv' | 'radio';

/**
 * Structured storage of multiple playback formats
 * Allows fallback support and flexible provider strategies
 */
export interface StreamSources {
  /** Direct URL (fallback) */
  url?: string;

  /** HTML iframe embed (for embedded players) */
  embed?: string;

  /** HLS manifest (.m3u8) for adaptive streaming */
  hls?: string;

  /** Audio stream URL (for radio/audio content) */
  audio?: string;
}

/**
 * Raw input from admin form or API
 * Includes legacy field names for backward compatibility
 */
export interface RawStreamInput extends Partial<StreamSources> {
  stream_url?: string;      // Legacy single-field input
  embed_html?: string;      // Legacy field name for embed
  hls_url?: string;         // Legacy field name for hls
}

/**
 * Internal normalized representation of a stream
 * All provider-specific transformations are applied
 */
export interface NormalizedStream {
  id?: string;
  title?: string;
  provider: ProviderType;
  stream_type?: StreamType;
  sources: StreamSources;   // Provider-normalized sources
  metadata?: {
    autoplay?: boolean;
    poster?: string;
  };
}

/**
 * Playback instruction for the video player
 * Tells the player exactly what type of element to render and where to get the content
 */
export interface Playback {
  /** Type of playback element to use */
  type: PlaybackType;

  /** Source URL for this playback type */
  src: string;

  /** Optional fallback playback options if this one fails */
  fallbacks?: Playback[];
}

/**
 * Metadata about a streaming provider's capabilities
 * Used to render admin UI dynamically and validate input
 */
export interface ProviderCapability {
  /** Unique identifier for this provider */
  id: ProviderType;

  /** Human-readable label */
  label: string;

  /** Description of what this provider does */
  description: string;

  /** What input formats can this provider accept? */
  inputFormats: StreamInputFormat[];

  /** What output playback types can this provider produce? */
  playbackFormats: PlaybackType[];

  /**
   * Can this provider be used as PRIMARY playback source?
   * If false, it's primarily for broadcast-only (e.g., YouTube)
   */
  isPrimaryPlayback: boolean;

  /**
   * Is this provider suitable only for broadcast/distribution?
   * (Not for playback on the website)
   */
  isBroadcastOnly?: boolean;

  /**
   * Example of how to use this provider
   * Shown to admins as guidance
   */
  example?: string;

  /**
   * Mobile playback hint
   */
  mobileFriendly?: boolean;

  /**
   * CORS-related information
   */
  corsRequired?: boolean;
}

/**
 * Interface that each provider normalizer must implement
 * Enables strategy pattern for provider-specific logic
 */
export interface IStreamNormalizer {
  /**
   * Check if the given sources are valid for this provider
   * Should validate that at least one required source is present
   */
  validate(sources: StreamSources): boolean;

  /**
   * Transform raw input (from form or API) to normalized StreamSources
   * Handles legacy field names, format detection, etc.
   */
  normalize(raw: RawStreamInput): StreamSources;

  /**
   * Get the preferred playback strategy for these sources
   * Returns null if no valid playback is possible
   */
  getPlayback(sources: StreamSources): Playback | null;

  /**
   * Get all possible fallback playback options (ordered by preference)
   * Used for robust playback with automatic failover
   */
  getAllFallbacks?(sources: StreamSources): Playback[];
}

/**
 * Complete stream record from database
 * Combines with stream_sources for full context
 */
export interface LiveStream {
  id: string;
  title: string;
  description?: string | null;

  // New structure
  stream_sources?: StreamSources | null;

  // Legacy (backward compat)
  stream_url: string;

  // Metadata
  stream_type: 'tv' | 'radio';
  provider: ProviderType;

  // Playback hints
  playback_strategy?: 'primary' | 'fallback' | null;

  // Activation
  is_active: boolean;
  scheduled_at?: string | null;

  // Replay
  replay_created?: boolean;
  replay_video_id?: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// -----------------------------------------------------------------------------
// `LiveStreamData` is a simple alias used throughout the provider system. It
// represents the shape of data that the ProviderManager and related helpers
// operate on. We keep it separate so that the provider code does not have to
// depend directly on the full media query types and it leaves room for future
// alterations without affecting the database interfaces.
// -----------------------------------------------------------------------------
export type LiveStreamData = LiveStream;

/**
 * Partial stream for insert/update operations
 */
export type LiveStreamInput = Omit<LiveStream, 'created_at' | 'updated_at'> & { id?: string };

/**
 * Options for normalizing and rendering a stream
 */
export interface PlayerOptions {
  autoplay?: boolean;
  poster?: string;
  controls?: boolean;
  muted?: boolean;
  playsInline?: boolean;
}

/**
 * Legacy types (kept for backward compatibility)
 * These are deprecated and should not be used in new code
 */
/**
 * Legacy types (kept for backward compatibility)
 * These are deprecated and should not be used in new code
 */
export interface ProviderOptions {
  autoplay?: boolean;
  poster?: string;
}
