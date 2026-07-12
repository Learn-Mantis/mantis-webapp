'use client'

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto max-w-[480px] px-4 pt-[calc(env(safe-area-inset-top)+16px)] pb-[140px] flex flex-col gap-6"
    >
      {children}
    </motion.main>
  )
}
