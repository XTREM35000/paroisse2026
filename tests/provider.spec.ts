import { ProviderManager } from '@/lib/providers';
import { getEmbedUrl, extractVideoId } from '@/lib/providers/videoUtils';

describe('ProviderManager enhancements', () => {
  it('should include facebook and twitch in provider types', () => {
    const types = ProviderManager.ProviderTypes;
    expect(types).toContain('facebook');
    expect(types).toContain('twitch');
  });

  it('should detect facebook url correctly', () => {
    const result = ProviderManager.detect('https://www.facebook.com/NotrePage/videos/123456789/');
    expect(result.provider?.name).toBe('facebook');
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should render a facebook iframe element when asked', () => {
    const fakeStream = { provider: 'facebook', stream_url: 'https://www.facebook.com/NotrePage/videos/123456789/' } as any;
    const element = ProviderManager.renderPlayer(fakeStream, { autoplay: false, controls: true });
    // Should return a React element with iframe
    expect(element).toMatchSnapshot();
  });

  it('should detect instagram urls and render fallback link', () => {
    const result = ProviderManager.detect('https://www.instagram.com/tv/ABCDE12345/');
    expect(result.provider?.name).toBe('instagram');
    const fakeStream = { provider: 'instagram', stream_url: 'https://www.instagram.com/tv/ABCDE12345/' } as any;
    const element = ProviderManager.renderPlayer(fakeStream, {});
    expect(element).toMatchSnapshot();
  });

  it('should detect tiktok urls and render fallback link', () => {
    const result = ProviderManager.detect('https://www.tiktok.com/@user/video/9876543210');
    expect(result.provider?.name).toBe('tiktok');
    const fakeStream = { provider: 'tiktok', stream_url: 'https://www.tiktok.com/@user/video/9876543210' } as any;
    const element = ProviderManager.renderPlayer(fakeStream, {});
    expect(element).toMatchSnapshot();
  });

  it('embed URL helper works and extractVideoId works', () => {
    expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ', 'youtube')).toBe('dQw4w9WgXcQ');
    expect(getEmbedUrl('youtube', 'dQw4w9WgXcQ')).toContain('youtube.com/embed');
    expect(extractVideoId('https://facebook.com/videos/12345', 'facebook')).toBe('12345');
    expect(getEmbedUrl('facebook', '12345')).toContain('facebook.com/plugins');
    expect(extractVideoId('https://www.twitch.tv/ndcompassion', 'twitch')).toBe('ndcompassion');
    expect(getEmbedUrl('twitch', 'ndcompassion')).toContain('twitch.tv');
  });
});
