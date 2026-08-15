'use client'

import type { ReactNode } from 'react'
import { BottomNav } from '@/components/layout/BottomNav'
import { DesktopSidebar } from '@/components/layout/DesktopSidebar'
import { AuthGateSheet } from '@/components/auth/AuthGateSheet'
import { useUser } from '@/features/auth/user-provider'

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user } = useUser()

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-light)] dark:bg-[var(--color-bg-dark)] flex flex-col">
        <main className="flex-1 flex flex-col min-w-0">
          {children}
        </main>
        <AuthGateSheet />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-light)] dark:bg-[var(--color-bg-dark)] flex flex-col lg:flex-row">
      {/* Fixed Desktop Sidebar on >= lg screens */}
      <DesktopSidebar />

      {/* Main content container with left padding on >= lg screens */}
      <div className="flex-1 lg:pl-64 xl:pl-72 flex flex-col min-w-0">
        {children}
      </div>

      {/* Bottom Navigation for Mobile */}
      <BottomNav />
      <AuthGateSheet />
    </div>
  )
}
