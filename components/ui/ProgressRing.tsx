'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface ProgressRingProps {
  progress: number // 0 - 100
  size?: number
  strokeWidth?: number
  color?: string
  trackColor?: string
  children?: ReactNode
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 10,
  color = 'var(--color-brand-500)',
  trackColor,
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor ?? 'currentColor'}
          strokeOpacity={trackColor ? 1 : 0.08}
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}
