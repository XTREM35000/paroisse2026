import React from 'react';
import {
  LiveProvider,
  ProviderType,
  ProviderOptions,
  DetectionResult,
  LiveStreamData,
  StreamType,
} from './types';
import {
  youtubeProvider,
  restreamProvider,
  apiVideoProvider,
  radioStreamProvider,
  customEmbedProvider,
  extractYouTubeId,
  facebookProvider,
  instagramProvider,
  tiktokProvider,
} from './providers';

/**
 * Central manager for all streaming providers
 * Handles detection, rendering, URL extraction, and validation
 */
export class ProviderManager {
  private static providers: LiveProvider[] = [
    youtubeProvider,
    restreamProvider,
    apiVideoProvider,
    radioStreamProvider,
    facebookProvider,
    instagramProvider,
    tiktokProvider,
  ];

  /**
   * Detect provider from URL with confidence scoring
   */
  static detect(url: string): DetectionResult {
    if (!url || typeof url !== 'string') {
      return {
        provider: null,
        confidence: 0,
        url,
      };
    }

    // Try exact matches first (higher confidence)
    for (const provider of this.providers) {
      if (provider.detect(url)) {
        return {
          provider,
          confidence: 1.0,
          url,
        };
      }
    }

    // Fallback to custom embed (lowest confidence)
    return {
      provider: customEmbedProvider,
      confidence: 0.5,
      url,
    };
  }

  /**
   * Get provider by name
   */
  static getProvider(name: ProviderType): LiveProvider | null {
    return this.providers.find((p) => p.name === name) || null;
  }

  /**
   * Get all available providers
   */
  static getAllProviders(): LiveProvider[] {
    return [...this.providers];
  }

  /**
   * Convenience: list of provider ids (ProviderType[])
   * Backward-compatible with older API that exposed `ProviderTypes`
   */
  static get ProviderTypes(): ProviderType[] {
    return this.getAllProviders().map((p) => p.name as ProviderType);
  }

  /**
   * Extract clean URL from various formats
   */
  static extractUrl(url: string, providerType?: ProviderType): string {
    if (!url) return '';

    if (providerType) {
      const provider = this.getProvider(providerType);
      if (provider) {
        return provider.extractUrl(url);
      }
    }

    const detection = this.detect(url);
    if (detection.provider) {
      return detection.provider.extractUrl(url);
    }

    return url;
  }

  /**
   * Validate URL for a specific provider
   */
  static validateUrl(url: string, providerType: ProviderType): {
    valid: boolean;
    error?: string;
  } {
    const provider = this.getProvider(providerType);
    if (!provider) {
      return {
        valid: false,
        error: `Provider "${providerType}" not found`,
      };
    }

    if (!url || url.trim().length === 0) {
      return {
        valid: false,
        error: 'URL is required',
      };
    }

    // Provider-specific validation
    switch (providerType) {
      case 'youtube': {
        const id = extractYouTubeId(url);
        if (!id) {
          return {
            valid: false,
            error: 'Invalid YouTube URL or ID',
          };
        }
        break;
      }
      case 'facebook': {
        // basic sanity check for facebook live/video URL
        if (!/facebook\.com\/.+\/(videos|watch)/.test(url) && !/fb\.watch\//.test(url)) {
          return {
            valid: false,
            error: 'URL ne ressemble pas à un Facebook Live valide',
          };
        }
        break;
      }
      case 'instagram': {
        if (!/instagram\.com/.test(url.toLowerCase())) {
          return { valid: false, error: 'Lien Instagram invalide' };
        }
        break;
      }
      case 'tiktok': {
        if (!/tiktok\.com/.test(url.toLowerCase()) && !/vm\.tiktok\.com/.test(url.toLowerCase())) {
          return { valid: false, error: 'Lien TikTok invalide' };
        }
        break;
      }
      case 'radio_stream': {
        if (!url.toLowerCase().match(/^https?:\/\/.+/)) {
          return {
            valid: false,
            error: 'Radio stream must be a valid HTTP(S) URL',
          };
        }
        break;
      }
      case 'restream':
      case 'api_video': {
        if (!url.toLowerCase().startsWith('http')) {
          return {
            valid: false,
            error: `${provider.displayName} URL must be a valid HTTP(S) URL`,
          };
        }
        break;
      }
    }

    return { valid: true };
  }

  static renderPlayer(
    stream: LiveStreamData,
    options: ProviderOptions = {}
  ): React.ReactElement {
    const provider = this.getProvider(stream.provider);

    console.log('🖼️ ProviderManager.renderPlayer:', {
      provider: stream.provider,
      stream_url: stream.stream_url?.substring(0, 100),
      has_provider_obj: !!provider,
    });

    if (!provider) {
      return (
        <div className="w-full bg-red-900/20 border border-red-500 rounded-lg p-4 text-red-400">
          <p className="font-semibold">Provider not found: {stream.provider}</p>
          <p className="text-sm">URL: {stream.stream_url}</p>
        </div>
      );
    }

    // If the stored stream_url contains raw embed HTML (iframe/audio/video), render it directly
    if (stream.stream_url && typeof stream.stream_url === 'string') {
      const s = stream.stream_url.trim();
      if (s.startsWith('<iframe') || s.startsWith('<audio') || s.startsWith('<video')) {
        return (
          <div className="w-full rounded-lg overflow-hidden" dangerouslySetInnerHTML={{ __html: s }} />
        );
      }
    }

    try {
      const element = provider.renderPlayer(stream.stream_url, {
        ...options,
        className: `provider-${provider.name} ${options.className || ''}`,
      });
      console.log('✅ Player rendered successfully for', provider.name);
      return element;
    } catch (error) {
      console.error(`Error rendering ${provider.name} player:`, error);
      return (
        <div className="w-full bg-red-900/20 border border-red-500 rounded-lg p-4 text-red-400">
          <p className="font-semibold">Error rendering {provider.displayName} player</p>
          <p className="text-sm">{String(error)}</p>
        </div>
      );
    }
  }

  /**
   * Auto-detect and normalize live stream data
   */
  static normalizeStream(data: Partial<LiveStreamData>): LiveStreamData {
    const url = data.stream_url || '';
    
    // Try to detect provider if not provided
    let provider = data.provider;
    if (!provider) {
      const detection = this.detect(url);
      provider = (detection.provider?.name || 'youtube') as ProviderType;
    }

    // Get provider for stream type validation
    const providerObj = this.getProvider(provider);
    const streamType = data.stream_type || providerObj?.streamType || 'tv';

    return {
      title: data.title || 'Live Stream',
      stream_url: this.extractUrl(url, provider),
      provider: provider as ProviderType,
      stream_type: streamType as StreamType,
      is_active: data.is_active ?? false,
      scheduled_at: data.scheduled_at || null,
      replay_created: data.replay_created ?? false,
      description: data.description || '',
      id: data.id,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  /**
   * Get provider-specific options for admin UI
   */
  static getProviderUIConfig(providerType: ProviderType) {
    const provider = this.getProvider(providerType);
    if (!provider) return null;

    return {
      displayName: provider.displayName,
      description: provider.description,
      urlPlaceholder: provider.urlPlaceholder,
      supportedFormats: provider.supportedFormats,
      streamType: provider.streamType,
    };
  }

  /**
   * Check if provider is for radio
   */
  static isRadio(providerType: ProviderType): boolean {
    const provider = this.getProvider(providerType);
    return provider?.streamType === 'radio';
  }

  /**
   * Check if provider is for TV
   */
  static isTv(providerType: ProviderType): boolean {
    const provider = this.getProvider(providerType);
    return provider?.streamType === 'tv';
  }
}

/**
 * Export convenience functions for common use cases
 */

export function detectProvider(url: string) {
  return ProviderManager.detect(url);
}

export function getProvider(name: ProviderType) {
  return ProviderManager.getProvider(name);
}

export function getAllProviders() {
  return ProviderManager.getAllProviders();
}

export function renderPlayerForStream(
  stream: LiveStreamData,
  options?: ProviderOptions
) {
  return ProviderManager.renderPlayer(stream, options);
}

export function validateStreamUrl(url: string, providerType: ProviderType) {
  return ProviderManager.validateUrl(url, providerType);
}

export function normalizeStreamData(data: Partial<LiveStreamData>) {
  return ProviderManager.normalizeStream(data);
}
