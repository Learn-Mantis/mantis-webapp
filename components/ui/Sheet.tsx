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
  /** Pinned under the scrolling body (primary actions). */
  footer?: ReactNode
  showClose?: boolean
  dismissible?: boolean
  className?: string
}

const EASE = [0.2, 0.8, 0.2, 1] as const

/** Bottom sheet on phones, centred panel from `sm` up. Flat scrim, no blur. */
export function Sheet({
  open,
  onClose,
  children,
  title,
  footer,
  showClose = true,
  dismissible = true,
  className,
}: SheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-5">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32, ease: EASE }}
            onClick={dismissible ? onClose : undefined}
            className="fixed inset-0 bg-scrim"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.32, ease: EASE }}
            className={cn(
              'relative z-[61] w-full max-w-[480px] bg-surface shadow-e3',
              'rounded-t-[22px] sm:rounded-[22px] max-h-[88vh] flex flex-col overflow-hidden',
              className,
            )}
          >
            <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
              <span className="h-1 w-9 rounded-full bg-line-3" />
            </div>
            {(title || showClose) && (
              <div className="flex items-center justify-between gap-3 px-5 pt-2.5 sm:pt-5 pb-1 shrink-0">
                <p className="text-[19px] leading-[26px] font-semibold tracking-[-0.01em] truncate">{title}</p>
                {showClose && (
                  <button
                    onClick={onClose}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-fg-3 hover:bg-hover"
                    aria-label="Close"
                  >
                    <X size={18} strokeWidth={1.75} />
                  </button>
                )}
              </div>
            )}
            <div className="flex-1 overflow-y-auto px-5 pt-2 pb-4 text-fg-2">{children}</div>
            {footer ? (
              <div className="shrink-0 px-5 pt-1 pb-[max(env(safe-area-inset-bottom),20px)] flex flex-col gap-2">
                {footer}
              </div>
            ) : (
              <div className="pb-[env(safe-area-inset-bottom)]" />
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
