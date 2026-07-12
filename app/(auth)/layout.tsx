import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-[480px] min-h-svh px-6 pt-[calc(env(safe-area-inset-top)+20px)] pb-[max(env(safe-area-inset-bottom),24px)] flex flex-col">
      {children}
    </div>
  )
}
