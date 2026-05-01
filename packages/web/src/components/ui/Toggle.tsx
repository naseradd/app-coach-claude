import { motion } from 'motion/react';
import { spring } from '../../design/motion.js';

interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}

export function Toggle({ checked, onChange, ariaLabel, disabled, className }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={className}
      style={{
        width: 51,
        height: 31,
        borderRadius: 999,
        border: 0,
        padding: 2,
        background: checked ? 'var(--accent)' : 'var(--bg-tinted)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        transition: 'background 180ms ease',
      }}
    >
      <motion.span
        layout
        animate={{ x: checked ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        style={{
          width: 27,
          height: 27,
          borderRadius: 999,
          background: '#FFFFFF',
          boxShadow: '0 2px 4px rgba(0,0,0,0.15), 0 1px 1px rgba(0,0,0,0.10)',
          display: 'block',
        }}
      />
    </button>
  );
}
