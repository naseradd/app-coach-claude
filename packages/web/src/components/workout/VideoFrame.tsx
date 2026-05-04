import { ExternalLink } from 'lucide-react';

const YT_EMBED = /^https:\/\/www\.youtube\.com\/embed\/([\w-]{6,})(?:\?[^\s]*)?$/;
const YT_WATCH = /^https:\/\/(?:www\.)?youtube\.com\/watch\?v=([\w-]{6,})(?:[&#][^\s]*)?$/;
const YT_SHORT = /^https:\/\/youtu\.be\/([\w-]{6,})(?:[?#][^\s]*)?$/;
const VIMEO_PLAYER = /^https:\/\/player\.vimeo\.com\/video\/(\d+)(?:\?[^\s]*)?$/;
const VIMEO_CANONICAL = /^https:\/\/(?:www\.)?vimeo\.com\/(\d+)(?:[?#][^\s]*)?$/;

export function normalizeEmbedUrl(url: string): string | null {
  if (YT_EMBED.test(url)) return url;
  const yt = url.match(YT_WATCH) ?? url.match(YT_SHORT);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  if (VIMEO_PLAYER.test(url)) return url;
  const vm = url.match(VIMEO_CANONICAL);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

export function isEmbeddable(url: string): boolean {
  return normalizeEmbedUrl(url) !== null;
}

interface Props {
  url: string;
  title?: string;
}

export function VideoFrame({ url, title }: Props) {
  const safe = normalizeEmbedUrl(url);
  if (!safe) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          background: 'var(--bg-tinted)',
          borderRadius: 12,
          color: 'var(--accent)',
          textDecoration: 'none',
          fontSize: 14,
        }}
      >
        <ExternalLink size={16} />
        Voir la vidéo
      </a>
    );
  }
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 9',
        borderRadius: 14,
        overflow: 'hidden',
        background: 'var(--bg-tinted)',
      }}
    >
      <iframe
        src={safe}
        title={title ?? "Démonstration de l'exercice"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
      />
    </div>
  );
}
