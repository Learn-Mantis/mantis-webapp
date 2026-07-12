'use client'

import type { ReactNode } from 'react'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/lib/theme'
import { QueryProvider } from '@/lib/query'
import { UserProvider } from '@/features/auth/user-provider'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <UserProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                borderRadius: '16px',
                fontSize: '14px',
              },
            }}
          />
        </UserProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}
