
/**
 * Utility functions to work with provider-specific video identifiers and embeds.
 */

export type LiveStreamProvider =
  | 'youtube'
  | 'facebook'
  | 'twitch'
  | 'tiktok'
  | 'instagram'; // keep for backward compatibility

/**
 * Build an embed URL from provider + id/channel
 */
export function getEmbedUrl(provider: LiveStreamProvider, id: string): string {
  switch (provider) {
    case 'youtube':
      return `https://www.youtube.com/embed/${id}?autoplay=1`;
    case 'facebook':
      return `https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/watch/?v=${id}&width=560&show_text=false`;
    case 'twitch':
      return `https://player.twitch.tv/?channel=${id}&parent=${window.location.hostname}`;
    case 'tiktok':
      // TikTok embed expects the id part after /embed/ but documentation varies; assume id is full path
      return `https://www.tiktok.com/embed/${id}`;
    default:
      return '';
  }
}

/**
 * Try to extract a raw video ID from a user-provided URL or ID.
 * If the text is already just an ID, return it directly.
 */
export function extractVideoId(input: string, provider: LiveStreamProvider): string {
  if (!input) return '';
  const trimmed = input.trim();

  if (provider === 'youtube') {
    const match = trimmed.match(/(?:youtu\.be\/|v=)([^&?/]+)/);
    return match ? match[1] : trimmed;
  }

  if (provider === 'facebook') {
    const match = trimmed.match(/\/videos\/(\d+)/);
    return match ? match[1] : trimmed;
  }

  if (provider === 'twitch') {
    // for twitch we only want the channel name
    // if user pasted full url, extract last segment
    const match = trimmed.match(/twitch\.tv\/(.+)$/);
    return match ? match[1] : trimmed;
  }

  if (provider === 'tiktok') {
    // tiktok URLs often look like /@user/video/123
    // but the embed endpoint only needs the pathname after "/embed/" which can be the original url
    return trimmed;
  }

  return trimmed;
}
