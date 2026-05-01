import { Dumbbell } from 'lucide-react';

interface Props {
  src?: string | null;
  alt?: string;
  className?: string;
}

export function MediaThumb({ src, alt, className }: Props) {
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 9',
        borderRadius: 14,
        overflow: 'hidden',
        background: 'var(--bg-tinted)',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      {src ? (
        <img
          src={src}
          alt={alt ?? ''}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <Dumbbell size={32} style={{ color: 'var(--ink-4)' }} aria-hidden />
      )}
    </div>
  );
}
