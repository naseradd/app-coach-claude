import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { spring } from '../../design/motion.js';

export type IconButtonVariant = 'tinted' | 'acid';

interface Props {
  variant?: IconButtonVariant;
  ariaLabel: string;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}

export function IconButton({
  variant = 'tinted',
  ariaLabel,
  disabled,
  onClick,
  children,
  className,
}: Props) {
  const styles: React.CSSProperties =
    variant === 'acid'
      ? { background: 'var(--accent)', color: 'var(--bg-elev)' }
      : { background: 'var(--bg-tinted)', color: 'var(--ink)' };

  return (
    <motion.button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.94 }}
      transition={spring.tap}
      className={className}
      style={{
        width: 36,
        height: 36,
        minWidth: 36,
        borderRadius: 999,
        border: 0,
        display: 'grid',
        placeItems: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        ...styles,
      }}
    >
      {children}
    </motion.button>
  );
}
