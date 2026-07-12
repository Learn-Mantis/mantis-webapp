import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface ProgressBarProps {
  progress: number
  className?: string
  color?: string
  trackClassName?: string
}

export function ProgressBar({ progress, className, color = 'var(--color-brand-500)', trackClassName }: ProgressBarProps) {
  return (
    <div
      className={cn(
        'h-2 w-full rounded-full bg-[var(--color-surface-light-muted)] dark:bg-[var(--color-surface-dark-muted)] overflow-hidden',
        trackClassName,
      )}
    >
      <motion.div
        className={cn('h-full rounded-full', className)}
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  )
}
