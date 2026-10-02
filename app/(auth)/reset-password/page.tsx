'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CircleCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/Feedback'
import { PasswordField } from '@/components/ui/Field'
import { TopBar } from '@/components/layout/TopBar'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { NOT_CONFIGURED } from '@/features/auth/actions'

/** Reached from the reset email (via /auth/callback, which signs the person in). */
export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) return toast.error('Password needs at least 8 characters')
    if (password !== confirm) return toast.error('Passwords don’t match')
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return toast.info(NOT_CONFIGURED)
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) return toast.error(error.message)
    setDone(true)
  }

  if (done) {
    return (
      <div className="flex flex-1 flex-col justify-center">
        <EmptyState
          icon={<CircleCheck size={24} strokeWidth={1.75} />}
          title="Password updated"
          body="Use your new password next time you log in."
          action={<Button onClick={() => router.push('/')}>Continue</Button>}
        />
      </div>
    )
  }

  return (
    <>
      <TopBar onBack={() => router.push('/login')} />
      <form onSubmit={save} className="flex flex-col gap-4 pt-2">
        <h1 className="mb-2 text-[26px] leading-8 font-semibold tracking-[-0.02em]">Set a new password</h1>
        <PasswordField
          label="New password"
          autoComplete="new-password"
          hint="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <PasswordField
          label="Confirm password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        <Button type="submit" size="lg" fullWidth loading={loading} className="mt-2">
          Save password
        </Button>
      </form>
    </>
  )
}
