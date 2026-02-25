import { StreamSources, RawStreamInput, Playback } from '../types';
import { StreamNationalizerBase } from './StreamNormalizerBase';

/**
 * Instagram provider normalizer
 *
 * This is mainly broadcast-only: we don't attempt full playback on the site.
 * The admin can enter a page/post/video URL or raw embed HTML. We store both
 * the URL (fallback) and any iframe embed.
 */
export class InstagramNormalizer extends StreamNationalizerBase {
  validate(sources: StreamSources): boolean {
    if (sources.url) {
      const u = sources.url.trim();
      if (/instagram\.com/.test(u)) return true;
    }
    if (sources.embed) {
      const e = sources.embed.trim();
      if (e.startsWith('<iframe') && e.includes('instagram.com')) return true;
    }
    return false;
  }

  normalize(raw: RawStreamInput): StreamSources {
    let url: string | undefined;
    let embed: string | undefined;

    if (raw.stream_url) {
      const txt = raw.stream_url.trim();
      if (this.isIframe(txt) && txt.includes('instagram.com')) {
        embed = this.clean(txt);
      } else {
        url = txt;
      }
    }

    if (!url && raw.url) {
      url = raw.url.trim();
    }

    if (!embed && raw.embed && this.isIframe(raw.embed) && raw.embed.includes('instagram.com')) {
      embed = this.clean(raw.embed);
    }
    if (!embed && raw.embed_html && this.isIframe(raw.embed_html) && raw.embed_html.includes('instagram.com')) {
      embed = this.clean(raw.embed_html);
    }

    return { url, embed };
  }

  getPlayback(sources: StreamSources): Playback | null {
    // Instagram cannot be played directly; return null to fall back to ProviderManager
    // which will show a default message via provider.renderPlayer
    return null;
  }
}
