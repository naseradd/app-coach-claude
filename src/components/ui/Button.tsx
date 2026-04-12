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
  primary:   'bg-lime hover:bg-lime-bright text-[#08080F] font-bold',
  secondary: 'bg-surface-2 hover:bg-edge text-white border border-edge',
  ghost:     'hover:bg-surface-2 text-muted hover:text-white',
  danger:    'bg-loss/15 hover:bg-loss/25 text-loss border border-loss/30',
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
