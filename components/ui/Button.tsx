'use client'

import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: Variant
  size?: Size
}

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-b from-brand-400 to-brand-600 text-white shadow-[var(--shadow-glow-brand)] border border-brand-400/40',
  secondary:
    'bg-[var(--color-surface-light-muted)] dark:bg-[var(--color-surface-dark-muted)] text-neutral-900 dark:text-neutral-50 border border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)]',
  ghost: 'bg-transparent text-neutral-700 dark:text-neutral-200',
  danger: 'bg-gradient-to-b from-danger-400 to-danger-600 text-white shadow-lg shadow-danger-500/20',
  gold: 'bg-gradient-to-b from-gold-400 to-gold-600 text-neutral-900 shadow-lg shadow-gold-500/25',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm rounded-2xl',
  md: 'h-12 px-6 text-[15px] rounded-2xl',
  lg: 'h-14 px-8 text-base rounded-[20px]',
}

export function Button({ className, variant = 'primary', size = 'md', children, ...props }: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold tracking-tight select-none',
        'transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  )
}
