'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface SheetProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  showClose?: boolean
  dismissible?: boolean
}

/** Reusable premium bottom sheet (shared by Play Battle + auth gate). */
export function Sheet({ open, onClose, children, title, showClose = true, dismissible = true }: SheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismissible ? onClose : undefined}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            className="fixed bottom-0 inset-x-0 z-[61] mx-auto max-w-[480px] rounded-t-[28px] bg-white dark:bg-[var(--color-surface-dark-card)] p-5 pb-[max(env(safe-area-inset-bottom),20px)] shadow-2xl"
          >
            {(title || showClose) && (
              <div className="flex items-center justify-between mb-4">
                <p className="text-lg font-extrabold font-[var(--font-display)]">{title}</p>
                {showClose && (
                  <button
                    onClick={onClose}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-surface-light-muted)] dark:bg-[var(--color-surface-dark-muted)]"
                  >
                    <X size={17} />
                  </button>
                )}
              </div>
            )}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
