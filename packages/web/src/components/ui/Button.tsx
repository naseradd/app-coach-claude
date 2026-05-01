import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { spring } from '../../design/motion.js';

export type ButtonVariant = 'primary' | 'tinted' | 'bordered' | 'plain';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface Props {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}

const heightOf: Record<ButtonSize, number> = { sm: 32, md: 40, lg: 48, xl: 56 };
const fontOf: Record<ButtonSize, number> = { sm: 14, md: 15, lg: 17, xl: 17 };
const paddingOf: Record<ButtonSize, string> = {
  sm: '0 12px', md: '0 16px', lg: '0 20px', xl: '0 24px',
};

function styleFor(variant: ButtonVariant): React.CSSProperties {
  switch (variant) {
    case 'primary':
      return { background: 'var(--accent)', color: 'var(--bg-elev)', border: 'none' };
    case 'tinted':
      return { background: 'var(--accent-soft)', color: 'var(--accent)', border: 'none' };
    case 'bordered':
      return { background: 'transparent', color: 'var(--ink)', border: '1px solid var(--separator)' };
    case 'plain':
      return { background: 'transparent', color: 'var(--accent)', border: 'none' };
  }
}

export function Button({
  variant = 'primary',
  size = 'md',
  leadingIcon,
  trailingIcon,
  fullWidth,
  disabled,
  type = 'button',
  onClick,
  children,
  className,
}: Props) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={spring.tap}
      className={className}
      style={{
        height: heightOf[size],
        padding: paddingOf[size],
        borderRadius: 14,
        fontSize: fontOf[size],
        fontWeight: 600,
        letterSpacing: '-0.012em',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        width: fullWidth ? '100%' : undefined,
        ...styleFor(variant),
      }}
    >
      {leadingIcon ? <span style={{ display: 'inline-flex' }}>{leadingIcon}</span> : null}
      <span>{children}</span>
      {trailingIcon ? <span style={{ display: 'inline-flex' }}>{trailingIcon}</span> : null}
    </motion.button>
  );
}
