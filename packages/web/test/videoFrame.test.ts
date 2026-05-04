import { describe, it, expect } from 'vitest';
import { isEmbeddable, normalizeEmbedUrl } from '../src/components/workout/VideoFrame.js';

describe('video embed URL guard', () => {
  it('accepts youtube.com/embed/<id>', () => {
    expect(isEmbeddable('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(true);
  });
  it('rewrites youtube.com/watch?v=<id> into embed', () => {
    expect(normalizeEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
    );
  });
  it('rewrites youtu.be/<id> into embed', () => {
    expect(normalizeEmbedUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
    );
  });
  it('accepts player.vimeo.com/video/<id>', () => {
    expect(isEmbeddable('https://player.vimeo.com/video/76979871')).toBe(true);
  });
  it('rewrites vimeo.com/<id> into player.vimeo.com', () => {
    expect(normalizeEmbedUrl('https://vimeo.com/76979871')).toBe(
      'https://player.vimeo.com/video/76979871',
    );
  });
  it('rejects arbitrary origins', () => {
    expect(isEmbeddable('https://evil.example.com/clip')).toBe(false);
    expect(normalizeEmbedUrl('https://evil.example.com/clip')).toBe(null);
  });
  it('rejects non-https schemes', () => {
    expect(isEmbeddable('http://www.youtube.com/embed/abc')).toBe(false);
  });
});
