import type { ReactNode } from 'react';

export type BadgeVariant = 'accent' | 'neutral' | 'success' | 'warn' | 'danger' | 'pr';

interface Props {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const palette: Record<BadgeVariant, { bg: string; fg: string }> = {
  accent:  { bg: 'var(--accent-soft)',  fg: 'var(--accent)' },
  neutral: { bg: 'var(--bg-tinted)',    fg: 'var(--ink-2)' },
  success: { bg: 'var(--success-soft)', fg: 'var(--success)' },
  warn:    { bg: 'var(--warn-soft)',    fg: 'var(--warn)' },
  danger:  { bg: 'var(--danger-soft)',  fg: 'var(--danger)' },
  pr:      { bg: 'var(--pr-soft)',      fg: 'var(--pr, var(--danger))' },
};

export function Badge({ variant = 'neutral', children, className }: Props) {
  const { bg, fg } = palette[variant];
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 9px',
        borderRadius: 999,
        background: bg,
        color: fg,
        fontSize: 12,
        lineHeight: '16px',
        fontWeight: 500,
        letterSpacing: 0,
        textTransform: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}
