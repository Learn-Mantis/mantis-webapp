'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageContainerProps {
  children: ReactNode
  className?: string
  /** Wider column for dense, two-column desktop pages. */
  fluid?: boolean
  /** Focus mode (battle / study session): no room reserved for the bottom nav. */
  focus?: boolean
}

/** Calm reading column: 20px gutter, capped at 720px (or wider when fluid). */
export function PageContainer({ children, className, fluid = false, focus = false }: PageContainerProps) {
  return (
    <main
      className={cn(
        'mx-auto flex w-full flex-col gap-4 px-5 animate-[mantis-fade_200ms_cubic-bezier(.2,.8,.2,1)]',
        'pt-[calc(env(safe-area-inset-top)+16px)] lg:pt-8',
        focus ? 'pb-10' : 'pb-[calc(64px+env(safe-area-inset-bottom)+24px)] lg:pb-12',
        fluid ? 'max-w-5xl' : 'max-w-[720px]',
        className,
      )}
    >
      {children}
    </main>
  )
}
