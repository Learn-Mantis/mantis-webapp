'use client'

import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLMotionProps<'div'> {
  interactive?: boolean
  /** Recessed grey panel with no border, for secondary content. */
  tone?: 'default' | 'sunken'
  elevated?: boolean
  /** @deprecated The design has no glass surfaces; ignored. */
  glass?: boolean
}

/** White card, 1px subtle border, 16px radius, no shadow at rest. */
export function Card({
  className,
  interactive = false,
  tone = 'default',
  elevated = false,
  glass: _glass,
  children,
  ...props
}: CardProps) {
  void _glass
  return (
    <motion.div
      whileTap={interactive ? { scale: 0.995 } : undefined}
      transition={{ duration: 0.12, ease: [0.2, 0.8, 0.2, 1] }}
      className={cn(
        'rounded-2xl border',
        tone === 'sunken' ? 'bg-sunken border-transparent' : 'bg-surface border-line',
        elevated && 'shadow-e1',
        interactive && 'cursor-pointer transition-colors duration-[120ms] hover:border-line-3',
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}
