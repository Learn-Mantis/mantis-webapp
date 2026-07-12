'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Select, Label } from '@/components/ui/Field'
import { GoogleIcon } from '@/components/icons/GoogleIcon'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { signInWithGoogle, NOT_CONFIGURED } from '@/features/auth/actions'
import { COUNTRIES, INDIAN_STATES } from '@/lib/config/geo'
import { cn } from '@/lib/utils'

const AVATARS = ['🦉', '🧠', '⚡', '🩺', '🧬', '🔬', '💉', '🫀', '🧫', '🩻', '⚕️', '🧑‍⚕️']

type Step = 1 | 2 | 3

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)

  // Step 1 — credentials
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // Step 2 — geo (required for leaderboards)
  const [country, setCountry] = useState<string>('India')
  const [state, setState] = useState('')
  const [college, setCollege] = useState('')
  // Step 3 — battle profile (separate identity)
  const [battleUsername, setBattleUsername] = useState('')
  const [avatarKey, setAvatarKey] = useState(AVATARS[0])

  function back() {
    if (step === 1) router.push('/')
    else setStep((s) => (s - 1) as Step)
  }

  function nextFromStep1(e: React.FormEvent) {
    e.preventDefault()
    if (!email || password.length < 6) {
      toast.error('Enter a valid email and a password of at least 6 characters.')
      return
    }
    setStep(2)
  }

  function nextFromStep2(e: React.FormEvent) {
    e.preventDefault()
    if (!country || !state || !college.trim()) {
      toast.error('Please complete country, state, and college.')
      return
    }
    setStep(3)
  }

  async function handleFinish(e: React.FormEvent) {
    e.preventDefault()
    if (battleUsername.trim().length < 3) {
      toast.error('Choose a battle username of at least 3 characters.')
      return
    }
    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      toast.info(NOT_CONFIGURED)
      return
    }
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          country,
          state,
          college: college.trim(),
          battle_username: battleUsername.trim(),
          avatar_key: avatarKey,
        },
      },
    })
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    // Profile + battle profile rows are created by the handle_new_user trigger.
    if (data.session) {
      toast.success('Account created')
      router.push('/')
    } else {
      toast.success('Check your email to confirm your account')
      router.push('/login')
    }
  }

  const stateOptions = country === 'India' ? INDIAN_STATES : null

  return (
    <>
      <div className="flex items-center justify-between">
        <button
          onClick={back}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-light-muted)] dark:bg-[var(--color-surface-dark-muted)]"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                'h-2 rounded-full transition-all',
                s === step ? 'w-6 bg-brand-500' : 'w-2 bg-[var(--color-surface-light-muted)] dark:bg-[var(--color-surface-dark-muted)]',
              )}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center py-6">
        {step === 1 && (
          <form onSubmit={nextFromStep1} className="flex flex-col gap-4">
            <div className="mb-3">
              <h1 className="text-[26px] font-extrabold font-[var(--font-display)]">Create your account</h1>
              <p className="text-sm text-neutral-500 mt-1">Start free. No card required.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Email</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" autoComplete="email" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Password</Label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" size="lg" className="w-full mt-2">
              Continue
            </Button>
            <div className="flex items-center gap-3 my-2">
              <div className="h-px flex-1 bg-[var(--color-surface-light-border)] dark:bg-[var(--color-surface-dark-border)]" />
              <span className="text-xs text-neutral-400">or</span>
              <div className="h-px flex-1 bg-[var(--color-surface-light-border)] dark:bg-[var(--color-surface-dark-border)]" />
            </div>
            <Button variant="secondary" size="lg" className="w-full" onClick={signInWithGoogle} type="button">
              <GoogleIcon /> Continue with Google
            </Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={nextFromStep2} className="flex flex-col gap-4">
            <div className="mb-3">
              <h1 className="text-[26px] font-extrabold font-[var(--font-display)]">Where do you study?</h1>
              <p className="text-sm text-neutral-500 mt-1">Used to rank you on college, state, and national leaderboards.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Country</Label>
              <Select value={country} onChange={(e) => setCountry(e.target.value)}>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>State</Label>
              {stateOptions ? (
                <Select value={state} onChange={(e) => setState(e.target.value)}>
                  <option value="">Select your state</option>
                  {stateOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="Your state / province" />
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Medical College</Label>
              <Input value={college} onChange={(e) => setCollege(e.target.value)} placeholder="e.g. AIIMS Jodhpur" />
            </div>
            <Button type="submit" size="lg" className="w-full mt-2">
              Continue
            </Button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleFinish} className="flex flex-col gap-4">
            <div className="mb-1">
              <h1 className="text-[26px] font-extrabold font-[var(--font-display)]">Your battle identity</h1>
              <p className="text-sm text-neutral-500 mt-1">
                This is the only name shown in Battle — your real identity stays private.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Battle Username</Label>
              <Input
                value={battleUsername}
                onChange={(e) => setBattleUsername(e.target.value)}
                placeholder="e.g. NightOwl_MD"
                maxLength={20}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Avatar</Label>
              <div className="grid grid-cols-6 gap-2">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAvatarKey(a)}
                    className={cn(
                      'aspect-square rounded-2xl text-2xl flex items-center justify-center border transition-colors',
                      avatarKey === a
                        ? 'border-brand-500 bg-brand-500/10'
                        : 'border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)] bg-[var(--color-surface-light-muted)]/40 dark:bg-[var(--color-surface-dark-muted)]/40',
                    )}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full mt-2" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </Button>
          </form>
        )}
      </div>

      <p className="text-center text-sm text-neutral-500">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-brand-600 dark:text-brand-400">
          Log in
        </Link>
      </p>
    </>
  )
}
