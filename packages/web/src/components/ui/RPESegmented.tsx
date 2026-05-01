import { useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { spring } from '../../design/motion.js';

interface Props {
  value: number; // 1..10
  onChange: (v: number) => void;
  className?: string;
}

const VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function RPESegmented({ value, onChange, className }: Props) {
  const groupId = useId();
  return (
    <div className={className} style={{ display: 'grid', gap: 8 }}>
      <div className="t-subhead" style={{ color: 'var(--ink-3)' }}>RPE</div>
      <div
        role="radiogroup"
        aria-label="RPE"
        style={{
          display: 'flex',
          background: 'var(--bg-tinted)',
          borderRadius: 999,
          padding: 3,
          width: '100%',
        }}
      >
        {VALUES.map((v) => {
          const active = v === value;
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(v)}
              className="tabular"
              style={{
                position: 'relative',
                flex: 1,
                minHeight: 36,
                border: 0,
                background: 'transparent',
                fontSize: 14,
                fontWeight: 600,
                color: active ? 'var(--bg-elev)' : 'var(--ink-3)',
                cursor: 'pointer',
                borderRadius: 999,
                zIndex: 1,
              }}
            >
              {active ? (
                <motion.div
                  layoutId={`rpe-pill-${groupId}`}
                  transition={spring.default}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'var(--accent)',
                    borderRadius: 999,
                    zIndex: -1,
                  }}
                />
              ) : null}
              {v}
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, justifyContent: 'center', minHeight: 44 }}>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={value}
            initial={{ y: 6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -6, opacity: 0 }}
            transition={spring.default}
            className="tabular"
            style={{ fontSize: 36, fontWeight: 600, lineHeight: 1, color: 'var(--ink)' }}
          >
            {value}
          </motion.div>
        </AnimatePresence>
        <span className="t-footnote" style={{ color: 'var(--ink-3)' }}>/ 10</span>
      </div>
    </div>
  );
}
