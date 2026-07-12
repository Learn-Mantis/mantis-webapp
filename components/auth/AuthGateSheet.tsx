'use client'

import { useRouter } from 'next/navigation'
import { Swords, Brain, Layers } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { useUIStore } from '@/stores/ui'
import { hasSeenOnboarding } from '@/features/auth/onboarding'

/** Global login gate. Guests hitting a protected action see this sheet. */
export function AuthGateSheet() {
  const open = useUIStore((s) => s.authGateOpen)
  const reason = useUIStore((s) => s.authGateReason)
  const close = useUIStore((s) => s.closeAuthGate)
  const router = useRouter()

  function navigate(path: string) {
    close()
    router.push(path)
  }

  function handleContinue() {
    navigate(hasSeenOnboarding() ? '/login' : '/onboarding')
  }

  return (
    <Sheet open={open} onClose={close} showClose>
      <div className="flex flex-col items-center gap-4 text-center pb-1">
        <div className="flex items-center gap-2">
          {[Swords, Brain, Layers].map((Icon, i) => (
            <div
              key={i}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400"
            >
              <Icon size={22} />
            </div>
          ))}
        </div>
        <div>
          <h2 className="text-xl font-extrabold font-[var(--font-display)]">Create your free account</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1.5 max-w-[300px]">
            Sign in to {reason ?? 'continue'} — track progress, climb the ranks, and save your flashcards.
          </p>
        </div>
        <Button size="lg" className="w-full mt-1" onClick={handleContinue}>
          Continue
        </Button>
        <button onClick={() => navigate('/login')} className="text-sm font-semibold text-brand-600 dark:text-brand-400">
          I already have an account
        </button>
      </div>
    </Sheet>
  )
}
