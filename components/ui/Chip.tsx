'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ChipProps {
  children: ReactNode
  active?: boolean
  onClick?: () => void
  icon?: ReactNode
  className?: string
}

export function Chip({ children, active = false, onClick, icon, className }: ChipProps) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
        active
          ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
          : 'bg-[var(--color-surface-light-muted)] dark:bg-[var(--color-surface-dark-muted)] text-neutral-600 dark:text-neutral-300 border border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)]',
        className,
      )}
    >
      {icon}
      {children}
    </motion.button>
  )
}
