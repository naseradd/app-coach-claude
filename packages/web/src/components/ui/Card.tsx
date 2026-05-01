import type { ReactNode } from 'react';

export type CardVariant = 'surface' | 'elev' | 'tinted' | 'outlined' | 'mesh';

interface Props {
  variant?: CardVariant;
  padding?: number | string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

function styleFor(variant: CardVariant): React.CSSProperties {
  switch (variant) {
    case 'surface':
      return { background: 'var(--bg-surface)' };
    case 'elev':
      return { background: 'var(--bg-elev)', boxShadow: 'var(--shadow-md)' };
    case 'tinted':
      return { background: 'var(--bg-tinted)' };
    case 'outlined':
      return { background: 'var(--bg-surface)', border: '1px solid var(--separator)' };
    case 'mesh':
      return {
        background:
          'radial-gradient(120% 90% at 0% 0%, var(--accent-soft), transparent 60%), var(--bg-surface)',
      };
  }
}

export function Card({ variant = 'surface', padding = 16, children, className, onClick }: Props) {
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        borderRadius: 18,
        padding,
        cursor: onClick ? 'pointer' : undefined,
        ...styleFor(variant),
      }}
    >
      {children}
    </div>
  );
}
