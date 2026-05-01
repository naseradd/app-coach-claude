import { useEffect, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft } from 'lucide-react';
import { spring } from '../../design/motion.js';

interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  trailing?: ReactNode;
  scrollThreshold?: number;
  className?: string;
}

export function NavBar({
  title,
  subtitle,
  onBack,
  trailing,
  scrollThreshold = 16,
  className,
}: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > scrollThreshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [scrollThreshold]);

  return (
    <div
      className={className}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        paddingTop: 'env(safe-area-inset-top)',
        background: scrolled ? 'var(--material)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'none',
        borderBottom: scrolled ? '1px solid var(--separator)' : '1px solid transparent',
        transition: 'background 200ms ease, border-color 200ms ease',
      }}
    >
      {/* Compact bar (always present, holds back/trailing) */}
      <div
        style={{
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1 }}>
          {onBack ? (
            <motion.button
              type="button"
              onClick={onBack}
              whileTap={{ scale: 0.94 }}
              transition={spring.tap}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
                background: 'transparent',
                color: 'var(--accent)',
                border: 0,
                padding: '6px 8px',
                fontSize: 17,
                fontWeight: 500,
                cursor: 'pointer',
              }}
              aria-label="Retour"
            >
              <ChevronLeft size={22} />
              <span>Retour</span>
            </motion.button>
          ) : null}
          <motion.div
            animate={{ opacity: scrolled ? 1 : 0 }}
            transition={spring.default}
            className="t-headline"
            style={{
              flex: 1,
              textAlign: 'center',
              color: 'var(--ink)',
              pointerEvents: 'none',
            }}
          >
            {scrolled ? title : ''}
          </motion.div>
        </div>
        {trailing ? (
          <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>{trailing}</div>
        ) : null}
      </div>

      {/* Large title — only when not scrolled */}
      <motion.div
        animate={{
          opacity: scrolled ? 0 : 1,
          height: scrolled ? 0 : 'auto',
        }}
        transition={spring.default}
        style={{ overflow: 'hidden', padding: '0 20px 12px' }}
      >
        <h1 className="t-large" style={{ margin: 0, color: 'var(--ink)' }}>{title}</h1>
        {subtitle ? (
          <div className="t-callout" style={{ color: 'var(--ink-3)', marginTop: 2 }}>{subtitle}</div>
        ) : null}
      </motion.div>
    </div>
  );
}
