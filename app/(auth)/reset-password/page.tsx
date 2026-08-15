'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Lock, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Field'
import { MantisLogo } from '@/components/ui/Logo'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { NOT_CONFIGURED } from '@/features/auth/actions'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [updated, setUpdated] = useState(false)
  const router = useRouter()

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      toast.info(NOT_CONFIGURED)
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }

    setUpdated(true)
    toast.success('Password updated successfully!')
  }

  return (
    <>
      <div className="flex items-center">
        <Link
          href="/login"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-light-muted)] dark:bg-[var(--color-surface-dark-muted)]"
        >
          <ArrowLeft size={18} />
        </Link>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="mb-7">
          <MantisLogo size={44} withText href="/" />
          <h1 className="text-[26px] font-extrabold font-[var(--font-display)] mt-4">
            {updated ? 'Password updated' : 'Create new password'}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {updated
              ? 'Your password has been changed. You can now use your new password.'
              : 'Choose a strong password with at least 6 characters.'}
          </p>
        </div>

        {updated ? (
          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-3">
              <CheckCircle2 size={20} className="shrink-0 text-emerald-500" />
              <span>Your account password is now secure and updated.</span>
            </div>
            <Button size="lg" className="w-full mt-2 font-bold" onClick={() => router.push('/')}>
              Continue to Dashboard
            </Button>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>New Password</Label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                autoComplete="new-password"
              />
            </div>

            <Button type="submit" size="lg" className="w-full mt-2 font-bold" disabled={loading}>
              {loading ? 'Updating password…' : 'Set New Password'}
            </Button>
          </form>
        )}
      </div>
    </>
  )
}
