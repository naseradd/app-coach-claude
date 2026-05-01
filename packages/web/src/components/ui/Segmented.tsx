import { useId } from 'react';
import { motion } from 'motion/react';
import { spring } from '../../design/motion.js';

export interface SegmentedOption<T extends string | number = string> {
  value: T;
  label: string;
}

interface Props<T extends string | number = string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel?: string;
  className?: string;
}

export function Segmented<T extends string | number = string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: Props<T>) {
  const groupId = useId();
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={className}
      style={{
        display: 'inline-flex',
        background: 'var(--bg-tinted)',
        borderRadius: 999,
        padding: 3,
        position: 'relative',
        gap: 0,
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            style={{
              position: 'relative',
              minWidth: 44,
              minHeight: 32,
              padding: '6px 14px',
              border: 0,
              background: 'transparent',
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '-0.003em',
              color: active ? 'var(--ink)' : 'var(--ink-3)',
              cursor: 'pointer',
              borderRadius: 999,
              zIndex: 1,
            }}
          >
            {active ? (
              <motion.div
                layoutId={`segmented-pill-${groupId}`}
                transition={spring.default}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'var(--bg-elev)',
                  borderRadius: 999,
                  boxShadow: 'var(--shadow-sm)',
                  zIndex: -1,
                }}
              />
            ) : null}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
