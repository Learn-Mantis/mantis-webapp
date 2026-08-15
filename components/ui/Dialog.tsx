'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  showClose?: boolean
  className?: string
}

export function Dialog({ open, onClose, children, showClose = true, className }: DialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ y: '100%', opacity: 0.5, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: '100%', opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            className={cn(
              'relative z-[61] w-full max-w-lg bg-white dark:bg-[var(--color-surface-dark-card)]',
              'rounded-t-[28px] sm:rounded-[28px]',
              'max-h-[90vh] sm:max-h-[86vh]',
              'flex flex-col shadow-2xl border border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)]',
              'p-6 overflow-y-auto',
              className,
            )}
          >
            {showClose && (
              <button
                onClick={onClose}
                className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface-light-muted)] dark:bg-[var(--color-surface-dark-muted)] text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export function DialogHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-col gap-1 pr-6', className)}>{children}</div>
}

export function DialogTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn('text-lg sm:text-xl font-extrabold font-[var(--font-display)] tracking-tight', className)}>{children}</h3>
}

export function DialogDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed', className)}>{children}</p>
}

export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex items-center justify-end gap-2 pt-3 mt-1 border-t border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)]', className)}>{children}</div>
}
