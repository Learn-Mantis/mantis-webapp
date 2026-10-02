'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name (also the tooltip). */
  label: string
  children: ReactNode
  variant?: 'ghost' | 'secondary' | 'soft'
  size?: 'sm' | 'md' | 'lg'
  active?: boolean
}

export function IconButton({
  label,
  children,
  variant = 'ghost',
  size = 'md',
  active,
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-xl transition-[background-color,color,transform] duration-[120ms] active:scale-[.94]',
        size === 'sm' ? 'h-9 w-9' : size === 'lg' ? 'h-12 w-12' : 'h-11 w-11',
        variant === 'secondary' && 'border border-line-2 bg-surface',
        variant === 'soft' && 'bg-sunken',
        active ? 'text-fg' : 'text-fg-2',
        'hover:bg-hover disabled:text-fg-4',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
