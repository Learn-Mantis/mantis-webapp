import type { ReactNode } from 'react'
import { BottomNav } from '@/components/layout/BottomNav'
import { AuthGateSheet } from '@/components/auth/AuthGateSheet'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <BottomNav />
      <AuthGateSheet />
    </>
  )
}
