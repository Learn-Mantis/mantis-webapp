'use client'

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface PageContainerProps {
  children: ReactNode
  className?: string
  /** If true, allows the container to occupy max width on desktop */
  fluid?: boolean
}

export function PageContainer({ children, className, fluid = false }: PageContainerProps) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'mx-auto w-full px-4 pt-[calc(env(safe-area-inset-top)+14px)] pb-[130px]',
        'lg:px-8 lg:pt-6 lg:pb-12',
        fluid ? 'max-w-7xl' : 'max-w-[520px] lg:max-w-6xl xl:max-w-7xl',
        'flex flex-col gap-6',
        className,
      )}
    >
      {children}
    </motion.main>
  )
}
