import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  className?: string
}

export function Toggle({ checked, onChange, className }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-8 w-14 rounded-full transition-colors duration-300 shrink-0',
        checked ? 'bg-brand-500' : 'bg-[var(--color-surface-light-muted)] dark:bg-[var(--color-surface-dark-muted)]',
        className,
      )}
    >
      <motion.span
        className="absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-md"
        animate={{ x: checked ? 24 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
      />
    </button>
  )
}
