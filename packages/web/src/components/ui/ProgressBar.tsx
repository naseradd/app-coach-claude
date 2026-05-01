import { motion } from 'motion/react';
import { spring } from '../../design/motion.js';

interface Props {
  value: number; // 0..1
  className?: string;
  ariaLabel?: string;
}

export function ProgressBar({ value, className, ariaLabel }: Props) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuenow={v}
      className={className}
      style={{
        height: 4,
        width: '100%',
        background: 'var(--bg-tinted)',
        borderRadius: 999,
        overflow: 'hidden',
      }}
    >
      <motion.div
        animate={{ width: `${v * 100}%` }}
        transition={spring.default}
        style={{
          height: '100%',
          background: 'var(--accent)',
          borderRadius: 999,
        }}
      />
    </div>
  );
}
