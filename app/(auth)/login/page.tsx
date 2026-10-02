'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MailCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/Feedback'
import { PasswordField, TextField } from '@/components/ui/Field'
import { GoogleIcon } from '@/components/icons/GoogleIcon'
import { TopBar } from '@/components/layout/TopBar'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { signInWithGoogle, NOT_CONFIGURED } from '@/features/auth/actions'

function safeNext(): string {
  const next = new URLSearchParams(window.location.search).get('next')
  // Same-site paths only (e.g. back to a challenge link).
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/'
}

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'forgot' | 'sent'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return toast.info(NOT_CONFIGURED)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (error) return toast.error(error.message)
    router.push(safeNext())
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return toast.error('Enter your email address')
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return toast.info(NOT_CONFIGURED)
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })
    setLoading(false)
    if (error) return toast.error(error.message)
    setMode('sent')
  }

  if (mode === 'sent') {
    return (
      <>
        <TopBar onBack={() => setMode('login')} />
        <div className="flex flex-1 flex-col justify-center">
          <EmptyState
            icon={<MailCheck size={24} strokeWidth={1.75} />}
            title="Check your email"
            body={`We sent a link to ${email.trim()}. Open it to set a new password.`}
            action={
              <Button variant="secondary" onClick={() => setMode('login')}>
                Back to log in
              </Button>
            }
          />
        </div>
      </>
    )
  }

  if (mode === 'forgot') {
    return (
      <>
        <TopBar onBack={() => setMode('login')} />
        <form onSubmit={handleForgot} className="flex flex-col gap-4 pt-2">
          <div className="mb-2 flex flex-col gap-1.5">
            <h1 className="text-[26px] leading-8 font-semibold tracking-[-0.02em]">Reset password</h1>
            <p className="text-[15px] text-fg-3">We’ll email you a link to set a new one.</p>
          </div>
          <TextField label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Button type="submit" size="lg" fullWidth loading={loading} className="mt-2">
            Send reset link
          </Button>
        </form>
      </>
    )
  }

  return (
    <>
      <TopBar onBack={() => router.push('/')} />
      <form onSubmit={handleLogin} className="flex flex-col gap-4 pt-2">
        <h1 className="mb-2 text-[26px] leading-8 font-semibold tracking-[-0.02em]">Welcome back</h1>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <PasswordField
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="button" onClick={() => setMode('forgot')} className="self-start text-sm font-medium text-link">
          Forgot password?
        </button>
        <Button type="submit" size="lg" fullWidth loading={loading} className="mt-2">
          Log in
        </Button>
        <div className="flex items-center gap-3 text-[13px] text-fg-4">
          <span className="h-px flex-1 bg-line" />
          or
          <span className="h-px flex-1 bg-line" />
        </div>
        <Button type="button" variant="secondary" size="lg" fullWidth onClick={signInWithGoogle}>
          <GoogleIcon /> Continue with Google
        </Button>
        <p className="mt-2 text-center text-sm text-fg-3">
          New to Mantis?{' '}
          <Link href="/signup" className="font-semibold">
            Sign up
          </Link>
        </p>
      </form>
    </>
  )
}
