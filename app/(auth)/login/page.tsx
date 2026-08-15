'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Field'
import { GoogleIcon } from '@/components/icons/GoogleIcon'
import { MantisLogo } from '@/components/ui/Logo'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { signInWithGoogle, NOT_CONFIGURED } from '@/features/auth/actions'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      toast.info(NOT_CONFIGURED)
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Welcome back')
    router.push('/')
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      toast.error('Please enter your email address')
      return
    }
    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      toast.info(NOT_CONFIGURED)
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    setResetSent(true)
    toast.success('Password reset link sent to your email!')
  }

  return (
    <>
      <div className="flex items-center">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-light-muted)] dark:bg-[var(--color-surface-dark-muted)]"
        >
          <ArrowLeft size={18} />
        </Link>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="mb-7">
          <MantisLogo size={44} withText href="/" />
          <h1 className="text-[26px] font-extrabold font-[var(--font-display)] mt-4">
            {forgotMode ? 'Reset password' : 'Welcome back'}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {forgotMode
              ? "Enter your registered email and we'll send you a reset link."
              : 'Log in to continue your streak.'}
          </p>
        </div>

        {forgotMode ? (
          <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
            {resetSent ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs leading-relaxed">
                <p className="font-bold text-sm mb-1">Check your email</p>
                We sent a password reset link to <strong className="font-extrabold">{email}</strong>. Open the link to create a new password.
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@college.edu"
                  autoComplete="email"
                />
              </div>
            )}

            {!resetSent ? (
              <Button type="submit" size="lg" className="w-full mt-2" disabled={loading}>
                {loading ? 'Sending link…' : 'Send Reset Link'}
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="w-full mt-2"
                onClick={() => {
                  setResetSent(false)
                  setForgotMode(false)
                }}
              >
                Back to Log In
              </Button>
            )}

            <button
              type="button"
              onClick={() => {
                setForgotMode(false)
                setResetSent(false)
              }}
              className="text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors text-center mt-2"
            >
              ← Back to Log In
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@college.edu"
                  autoComplete="email"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label>Password</Label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotMode(true)
                      setResetSent(false)
                    }}
                    className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" size="lg" className="w-full mt-2" disabled={loading}>
                {loading ? 'Logging in…' : 'Log In'}
              </Button>
            </form>

            <div className="flex items-center gap-3 my-6">
              <div className="h-px flex-1 bg-[var(--color-surface-light-border)] dark:bg-[var(--color-surface-dark-border)]" />
              <span className="text-xs text-neutral-400">or</span>
              <div className="h-px flex-1 bg-[var(--color-surface-light-border)] dark:bg-[var(--color-surface-dark-border)]" />
            </div>

            <Button variant="secondary" size="lg" className="w-full" onClick={signInWithGoogle} type="button">
              <GoogleIcon /> Continue with Google
            </Button>
          </>
        )}
      </div>

      {!forgotMode && (
        <div className="flex flex-col items-center gap-2 text-center text-sm text-neutral-500 mt-4">
          <p>
            New to Mantis?{' '}
            <Link href="/signup" className="font-semibold text-brand-600 dark:text-brand-400">
              Create account
            </Link>
          </p>
          <Link href="/" className="text-xs font-bold text-neutral-500 hover:text-brand-600 transition-colors">
            ⚡ Or take the 60-Second Diagnostic Duel
          </Link>
        </div>
      )}
    </>
  )
}
