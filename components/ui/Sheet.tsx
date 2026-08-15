'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SheetProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  showClose?: boolean
  dismissible?: boolean
  className?: string
}

/** Responsive modal & bottom sheet: centered on desktop/tablet, bottom drawer on mobile. */
export function Sheet({
  open,
  onClose,
  children,
  title,
  showClose = true,
  dismissible = true,
  className,
}: SheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismissible ? onClose : undefined}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal / Sheet Container */}
          <motion.div
            initial={{ y: '100%', opacity: 0.5, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: '100%', opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            className={cn(
              'relative z-[61] w-full max-w-[480px] bg-white dark:bg-[var(--color-surface-dark-card)]',
              'rounded-t-[28px] sm:rounded-[28px]',
              'max-h-[90vh] sm:max-h-[86vh]',
              'flex flex-col shadow-2xl border border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)]',
              'overflow-hidden',
              className,
            )}
          >
            {/* Header if title or showClose */}
            {(title || showClose) && (
              <div className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0">
                <p className="text-lg font-extrabold font-[var(--font-display)] truncate pr-2">
                  {title}
                </p>
                {showClose && (
                  <button
                    onClick={onClose}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-surface-light-muted)] dark:bg-[var(--color-surface-dark-muted)] text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors shrink-0"
                    aria-label="Close"
                  >
                    <X size={17} />
                  </button>
                )}
              </div>
            )}

            {/* Scrollable Body Container */}
            <div className="flex-1 overflow-y-auto px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-2">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
