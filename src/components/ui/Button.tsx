import { type ReactNode, type ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
  fullWidth?: boolean
}

const variantClass: Record<Variant, string> = {
  primary:   'bg-accent text-white hover:bg-[#2a2a2a] font-semibold',
  secondary: 'bg-surface text-text border border-border hover:bg-surface-2',
  ghost:     'text-muted hover:text-text hover:bg-surface-2',
  danger:    'bg-red-lt text-red border border-red/30 hover:bg-red/10',
}

const sizeClass: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-5 py-3.5 text-base rounded-xl gap-2',
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  fullWidth,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center transition-all active:scale-[0.97]
        font-condensed tracking-wide
        ${variantClass[variant]}
        ${sizeClass[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-40 pointer-events-none' : ''}
        ${className}
      `.trim()}
    >
      {children}
    </button>
  )
}
