/**
 * Provider system - exports (REFACTORED v2)
 * 
 * This module provides unified access to all streaming provider functionality:
 * - Type definitions (ProviderType, StreamSources, etc.)
 * - Stream normalization and validation
 * - Playback strategy determination
 * - Provider metadata and capabilities
 */

// Core types
export * from './types';

// Stream manager (main entry point)
export { streamManager, StreamManager } from './StreamManager';

// Provider registry (capability metadata)
export {
  PROVIDER_REGISTRY,
  getPrimaryPlaybackProviders,
  getAllProviders,
  getProviderCapability,
  supportsInputFormat,
  getRecommendedProviders,
} from './registry/ProviderRegistry';

// Normalizers (for advanced usage)
export { StreamNormalizerBase } from './normalizers/StreamNormalizerBase';
export { ReestreamNormalizer, AppReestreamNormalizer } from './normalizers/ReestreamNormalizer';
export { YoutubeNormalizer } from './normalizers/YoutubeNormalizer';
export { ApiVideoNormalizer } from './normalizers/ApiVideoNormalizer';
export { RadioStreamNormalizer } from './normalizers/RadioStreamNormalizer';

/**
 * Backward compatibility exports
 * (These maintain compatibility with existing code)
 */
export { extractYoutubeId } from './legacy-compatibility';

