import { StreamSources, RawStreamInput, Playback } from '../types';
import { StreamNationalizerBase } from './StreamNormalizerBase';

/**
 * Facebook Live Normalizer
 *
 * Accepts:
 * - Page video URLs like `https://www.facebook.com/YourPage/videos/123456789/`
 * - Shortened `fb.watch/...` links
 * - Raw iframe embed code produced by Facebook
 *
 * The normalizer tries to keep both a clean URL and an iframe embed. When only a
 * URL is provided we build the Facebook "plugins/video.php" embed URL because
 * that's the only reliable way to display the stream inside an `<iframe>`.
 *
 * Playback strategy is always an iframe pointing to either the provided embed
 * HTML or the generated plugin URL.
 */
export class FacebookNormalizer extends StreamNationalizerBase {
  validate(sources: StreamSources): boolean {
    if (sources.url) {
      const u = sources.url.trim();
      if (/facebook\.com\/.+\/videos\/.+/.test(u) || /fb\.watch\//.test(u)) {
        return true;
      }
    }
    if (sources.embed) {
      const e = sources.embed.trim();
      if (e.includes('facebook.com/plugins/video.php') || this.isIframe(e)) {
        return true;
      }
    }
    return false;
  }

  normalize(raw: RawStreamInput): StreamSources {
    let url: string | undefined;
    let embed: string | undefined;

    if (raw.stream_url) {
      const txt = raw.stream_url.trim();
      if (this.isIframe(txt)) {
        embed = this.clean(txt);
      } else {
        url = txt;
      }
    }

    if (!url && raw.url) {
      url = raw.url.trim();
    }

    if (!embed && raw.embed && this.isIframe(raw.embed)) {
      embed = this.clean(raw.embed);
    }
    if (!embed && raw.embed_html && this.isIframe(raw.embed_html)) {
      embed = this.clean(raw.embed_html);
    }

    // If we have a plain URL but no embed, build a facebook plugin embed URL
    if (url && !embed) {
      embed = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
        url
      )}&width=560&show_text=false&appId`;
    }

    return {
      url,
      embed,
    };
  }

  getPlayback(sources: StreamSources): Playback | null {
    if (sources.embed) {
      // raw iframe or plugin URL
      const trimmed = sources.embed.trim();
      if (trimmed.startsWith('<iframe')) {
        return { type: 'iframe', src: trimmed };
      }
      // treat as plugin src
      return { type: 'iframe', src: trimmed };
    }
    if (sources.url) {
      const href = encodeURIComponent(sources.url);
      return {
        type: 'iframe',
        src: `https://www.facebook.com/plugins/video.php?href=${href}&width=560&show_text=false&appId`,
      };
    }
    return null;
  }

  // no special fallbacks
}
