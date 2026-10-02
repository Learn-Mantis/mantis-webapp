'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { BottomNav } from '@/components/layout/BottomNav'
import { DesktopSidebar } from '@/components/layout/DesktopSidebar'
import { AuthGateSheet } from '@/components/auth/AuthGateSheet'
import { useUser } from '@/features/auth/user-provider'

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useUser()
  const pathname = usePathname()

  // Visitors on "/" see the landing page; battles and study sessions are focus modes.
  const landing = pathname === '/' && !user && !loading
  const focus = pathname.startsWith('/battle/play')
  const chrome = !landing && !focus

  return (
    <div className="min-h-screen bg-app">
      {chrome && <DesktopSidebar />}
      <div className={chrome ? 'flex min-w-0 flex-col lg:pl-[248px]' : 'flex min-w-0 flex-col'}>{children}</div>
      {chrome && <BottomNav />}
      <AuthGateSheet />
    </div>
  )
}
