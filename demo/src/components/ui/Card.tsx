import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '../../lib/utils'

interface CardProps extends HTMLMotionProps<'div'> {
  interactive?: boolean
  glass?: boolean
}

export function Card({ className, interactive = false, glass = false, children, ...props }: CardProps) {
  return (
    <motion.div
      whileTap={interactive ? { scale: 0.97 } : undefined}
      whileHover={interactive ? { y: -2 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className={cn(
        'rounded-[24px] border',
        glass
          ? 'glass border-white/10 dark:border-white/5'
          : 'bg-white dark:bg-[var(--color-surface-dark-card)] border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)]',
        'shadow-[var(--shadow-soft)] dark:shadow-[var(--shadow-soft-dark)]',
        interactive && 'cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}
