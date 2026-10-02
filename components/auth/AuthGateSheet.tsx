'use client'

import { useRouter } from 'next/navigation'
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { useUIStore } from '@/stores/ui'

/** Global sign-in prompt for account-only actions. */
export function AuthGateSheet() {
  const open = useUIStore((s) => s.authGateOpen)
  const reason = useUIStore((s) => s.authGateReason)
  const close = useUIStore((s) => s.closeAuthGate)
  const router = useRouter()

  function go(path: string) {
    close()
    router.push(path)
  }

  return (
    <Sheet
      open={open}
      onClose={close}
      showClose={false}
      footer={
        <>
          <Button size="lg" fullWidth onClick={() => go('/signup')}>
            Create account
          </Button>
          <Button variant="ghost" fullWidth onClick={() => go('/login')}>
            I have an account
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-2 pt-1">
        <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-sunken text-fg">
          <UserPlus size={22} strokeWidth={1.75} />
        </div>
        <p className="text-[19px] leading-[26px] font-semibold text-fg">Create a free account</p>
        <p className="text-[15px] text-fg-2">
          {reason ? `You need an account to ${reason}.` : 'You need an account for this.'} Your progress stays with you.
        </p>
      </div>
    </Sheet>
  )
}
