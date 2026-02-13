/**
 * Provider Registry: Centralized declaration of all supported streaming providers
 * 
 * Each provider declares:
 * - What input formats it accepts
 * - What playback formats it produces
 * - Whether it's suitable as primary player or broadcast-only
 * - Examples and hints for admins
 */

import { ProviderCapability, ProviderType } from '../types';

/**
 * Master registry - defines capabilities of all available providers
 * Used to:
 * - Render dynamic admin UI (show only supported fields)
 * - Validate user input (check if format is supported)
 * - Display helpful hints and examples
 */
export const PROVIDER_REGISTRY: Record<ProviderType, ProviderCapability> = {
  // ============================================================================
  // PRIMARY PLAYBACK PROVIDERS (Recommended for main player)
  // ============================================================================

  restream: {
    id: 'restream',
    label: 'Restream (Recommandé)',
    description: 'Lecteur principal pour streaming vidéo - support embed iframe, HLS, et URL de fallback',
    isPrimaryPlayback: true,
    mobileFriendly: true,
    corsRequired: false,
    inputFormats: ['embed', 'hls', 'url'],
    playbackFormats: ['iframe', 'hls'],
    example: 'Exemple: https://restream.io/live/votre-stream ou utiliser l\'embed iframe fourni par Restream',
    isBroadcastOnly: false,
  },

  'app.restream': {
    id: 'app.restream',
    label: 'app.restream (Alternative)',
    description: 'Variante app.restream - comportement identique à Restream avec le même support de formats',
    isPrimaryPlayback: true,
    mobileFriendly: true,
    corsRequired: false,
    inputFormats: ['embed', 'hls', 'url'],
    playbackFormats: ['iframe', 'hls'],
    example: 'Exemple: https://app.restream.io/... ou embed iframe',
    isBroadcastOnly: false,
  },

  api_video: {
    id: 'api_video',
    label: 'API.Video',
    description: 'Lecteur API.Video - embed sécurisé et performant pour contenu vidéo',
    isPrimaryPlayback: true,
    mobileFriendly: true,
    corsRequired: false,
    inputFormats: ['url', 'embed'],
    playbackFormats: ['iframe'],
    example: 'Exemple: https://embed.api.video/abc123xyz',
    isBroadcastOnly: false,
  },

  radio_stream: {
    id: 'radio_stream',
    label: 'Flux Radio/Audio',
    description: 'Lecteur audio spécialisé pour streaming radio paroissial et contenu audio',
    isPrimaryPlayback: true,
    mobileFriendly: true,
    corsRequired: true,
    inputFormats: ['audio', 'url'],
    playbackFormats: ['audio'],
    example: 'Exemple: https://radio.example.com/live.mp3 ou /live.m3u8',
    isBroadcastOnly: false,
  },

  // ============================================================================
  // BROADCAST DESTINATIONS (Primarily for distribution, not primary playback)
  // ============================================================================

  youtube: {
    id: 'youtube',
    label: 'YouTube',
    description: '⚠️ Destination de diffusion + fallback uniquement. NON recommandé comme lecteur principal',
    isPrimaryPlayback: false,
    mobileFriendly: true,
    corsRequired: true,
    isBroadcastOnly: true, // Marquer comme broadcast-only
    inputFormats: ['url', 'embed'],
    playbackFormats: ['iframe'],
    example: 'Exemple: https://www.youtube.com/watch?v=VIDEO_ID ou ID seul (11 caractères)',
  },
};

/**
 * Helper: Get all providers suitable for primary playback
 * Filters out broadcast-only providers
 */
export function getPrimaryPlaybackProviders(): ProviderCapability[] {
  return Object.values(PROVIDER_REGISTRY).filter(p => p.isPrimaryPlayback && !p.isBroadcastOnly);
}

/**
 * Helper: Get all providers
 */
export function getAllProviders(): ProviderCapability[] {
  return Object.values(PROVIDER_REGISTRY);
}

/**
 * Helper: Get capability for a specific provider
 */
export function getProviderCapability(providerType: ProviderType): ProviderCapability {
  const capability = PROVIDER_REGISTRY[providerType];
  if (!capability) {
    throw new Error(`Unknown provider: ${providerType}`);
  }
  return capability;
}

/**
 * Helper: Check if a provider can handle a specific input format
 */
export function supportsInputFormat(
  providerType: ProviderType,
  format: 'url' | 'embed' | 'hls' | 'audio'
): boolean {
  const capability = getProviderCapability(providerType);
  return capability.inputFormats.includes(format);
}

/**
 * Helper: Get recommended providers for a stream type
 */
export function getRecommendedProviders(streamType: 'tv' | 'radio'): ProviderCapability[] {
  const primary = getPrimaryPlaybackProviders();

  if (streamType === 'tv') {
    // For TV: Restream is first choice, then others
    return primary.sort((a, b) => {
      if (a.id === 'restream') return -1;
      if (b.id === 'restream') return 1;
      return 0;
    });
  } else {
    // For radio: must support audio, so filter
    return primary.filter(p => p.inputFormats.includes('audio') || p.playbackFormats.includes('audio'));
  }
}
