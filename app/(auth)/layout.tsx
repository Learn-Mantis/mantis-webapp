import type { ReactNode } from 'react'

/** Auth screens: a calm 400px column on the app background. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh bg-app">
      <div className="mx-auto flex min-h-svh w-full max-w-[440px] flex-col px-5 pb-[max(env(safe-area-inset-bottom),24px)] pt-[env(safe-area-inset-top)]">
        {children}
      </div>
    </div>
  )
}
