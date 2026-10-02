'use client'

import type { ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'soft' | 'ghost' | 'inverse' | 'danger' | 'gold'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  loading?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'bg-action text-on-action hover:bg-action-hover active:bg-action-pressed border border-transparent',
  secondary: 'bg-surface text-fg hover:bg-hover active:bg-pressed border border-line-2',
  soft: 'bg-action-soft text-on-action-soft hover:bg-action-soft-hover border border-transparent',
  ghost: 'bg-transparent text-fg-2 hover:bg-hover active:bg-pressed border border-transparent',
  inverse: 'bg-inverse text-on-inverse hover:opacity-90 border border-transparent',
  // Destructive actions stay calm: clay text on a neutral button.
  danger: 'bg-surface text-on-incorrect hover:bg-incorrect border border-incorrect-line',
  // Legacy name — the design has no gold buttons.
  gold: 'bg-action-soft text-on-action-soft hover:bg-action-soft-hover border border-transparent',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm gap-1.5 rounded-[10px]',
  md: 'h-11 px-[18px] text-[15px] gap-2 rounded-xl',
  lg: 'h-[52px] px-[22px] text-base gap-2 rounded-[14px]',
}

/** Buttons are verbs of 1–3 words in sentence case ("Start practice", "Copy link"). */
export function Button({
  className,
  variant = 'primary',
  size = 'md',
  fullWidth,
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={disabled || loading ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.12, ease: [0.2, 0.8, 0.2, 1] }}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-semibold tracking-[-0.005em] leading-none whitespace-nowrap select-none',
        'transition-[background-color,color,opacity] duration-[120ms] cursor-pointer',
        'disabled:bg-sunken disabled:text-fg-4 disabled:border-transparent disabled:cursor-default',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 size={size === 'lg' ? 20 : size === 'sm' ? 16 : 18} className="animate-spin" /> : null}
      {children as ReactNode}
    </motion.button>
  )
}
