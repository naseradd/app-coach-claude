import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { spring } from '../../design/motion.js';

interface Props {
  leading?: ReactNode;
  label: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  showChevron?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ListRow({
  leading,
  label,
  subtitle,
  trailing,
  showChevron,
  onClick,
  className,
}: Props) {
  const Comp = onClick ? motion.button : motion.div;
  const interactive = !!onClick;

  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      whileTap={interactive ? { backgroundColor: 'rgba(28,27,31,0.06)' } : undefined}
      transition={spring.tap}
      className={className}
      style={{
        width: '100%',
        minHeight: 44,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: 'transparent',
        border: 0,
        textAlign: 'left',
        cursor: interactive ? 'pointer' : 'default',
        color: 'var(--ink)',
      }}
    >
      {leading ? <div style={{ display: 'inline-flex', flexShrink: 0 }}>{leading}</div> : null}
      <div style={{ flex: 1, minWidth: 0, display: 'grid', gap: 2 }}>
        <div className="t-headline" style={{ color: 'var(--ink)' }}>
          {label}
        </div>
        {subtitle ? (
          <div className="t-footnote" style={{ color: 'var(--ink-3)' }}>
            {subtitle}
          </div>
        ) : null}
      </div>
      {trailing ? (
        <div className="t-callout" style={{ color: 'var(--ink-2)', flexShrink: 0 }}>
          {trailing}
        </div>
      ) : null}
      {showChevron ? (
        <ChevronRight size={18} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
      ) : null}
    </Comp>
  );
}
