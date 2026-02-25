import { StreamSources, RawStreamInput, Playback } from '../types';
import { StreamNationalizerBase } from './StreamNormalizerBase';

/**
 * TikTok provider normalizer
 *
 * Similar to Instagram, our site doesn't directly play TikTok videos. We just
 * store URL/embed for record keeping and potentially show a link.
 */
export class TikTokNormalizer extends StreamNationalizerBase {
  validate(sources: StreamSources): boolean {
    if (sources.url) {
      const u = sources.url.trim();
      if (/tiktok\.com/.test(u) || /vm\.tiktok\.com/.test(u)) return true;
    }
    if (sources.embed) {
      const e = sources.embed.trim();
      if (e.startsWith('<iframe') && e.includes('tiktok.com')) return true;
    }
    return false;
  }

  normalize(raw: RawStreamInput): StreamSources {
    let url: string | undefined;
    let embed: string | undefined;

    if (raw.stream_url) {
      const txt = raw.stream_url.trim();
      if (this.isIframe(txt) && txt.includes('tiktok.com')) {
        embed = this.clean(txt);
      } else {
        url = txt;
      }
    }

    if (!url && raw.url) {
      url = raw.url.trim();
    }

    if (!embed && raw.embed && this.isIframe(raw.embed) && raw.embed.includes('tiktok.com')) {
      embed = this.clean(raw.embed);
    }
    if (!embed && raw.embed_html && this.isIframe(raw.embed_html) && raw.embed_html.includes('tiktok.com')) {
      embed = this.clean(raw.embed_html);
    }

    return { url, embed };
  }

  getPlayback(sources: StreamSources): Playback | null {
    return null;
  }
}
