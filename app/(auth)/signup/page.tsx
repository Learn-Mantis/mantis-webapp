'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AtSign, MailCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/Feedback'
import { PasswordField, TextField } from '@/components/ui/Field'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { GoogleIcon } from '@/components/icons/GoogleIcon'
import { StickyFooter, TopBar } from '@/components/layout/TopBar'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { signInWithGoogle, NOT_CONFIGURED } from '@/features/auth/actions'

const USERNAME_RE = /^[a-z0-9_]{3,20}$/
const WORDS_A = ['quiet', 'night_shift', 'calm', 'steady', 'swift', 'sharp', 'late', 'early']
const WORDS_B = ['scalpel', 'synapse', 'vagus', 'retina', 'pulse', 'cortex', 'suture', 'atrium']

function suggestions(seed: string): string[] {
  const base = seed.toLowerCase().replace(/[^a-z]/g, '').slice(0, 8)
  let h = 0
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) | 0
  const pick = (arr: string[], n: number) => arr[Math.abs(h + n) % arr.length]
  return [
    `${pick(WORDS_A, 1)}_${pick(WORDS_B, 2)}`,
    base.length >= 3 ? `${base}_${pick(WORDS_B, 3)}` : `${pick(WORDS_A, 4)}_${pick(WORDS_B, 5)}`,
    `${pick(WORDS_B, 6)}_${(Math.abs(h) % 90) + 10}`,
  ]
}

/** Exact, case-insensitive match: escape LIKE wildcards (`_` is common in usernames). */
function likeExact(s: string) {
  return s.replace(/[\\%_]/g, (m) => `\\${m}`)
}

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<0 | 1 | 'sent'>(0)
  const [loading, setLoading] = useState(false)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [usernameError, setUsernameError] = useState<string | null>(null)

  const ideas = useMemo(() => suggestions(fullName || email || 'mantis'), [fullName, email])

  function next(e: React.FormEvent) {
    e.preventDefault()
    if (fullName.trim().length < 2) return toast.error('Enter your name')
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return toast.error('Enter a valid email')
    if (phone.replace(/\D/g, '').length < 10) return toast.error('Enter a valid phone number')
    if (password.length < 8) return toast.error('Password needs at least 8 characters')
    if (!username) setUsername(ideas[0])
    setStep(1)
  }

  async function finish(e: React.FormEvent) {
    e.preventDefault()
    const name = username.trim().toLowerCase()
    if (!USERNAME_RE.test(name)) {
      setUsernameError('3–20 characters: letters, numbers and underscores')
      return
    }
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return toast.info(NOT_CONFIGURED)
    setLoading(true)

    const { data: taken } = await supabase
      .from('battle_profiles')
      .select('user_id')
      .ilike('battle_username', likeExact(name))
      .limit(1)
    if (taken?.length) {
      setLoading(false)
      setUsernameError('That username is taken. Try another.')
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: fullName.trim(),
          name: fullName.trim(),
          phone: phone.trim(),
          battle_username: name,
        },
      },
    })
    setLoading(false)
    if (error) return toast.error(error.message)
    if (data.session) router.push('/')
    else setStep('sent')
  }

  if (step === 'sent') {
    return (
      <div className="flex flex-1 flex-col justify-center">
        <EmptyState
          icon={<MailCheck size={24} strokeWidth={1.75} />}
          title="Check your email"
          body={`We sent a confirmation link to ${email.trim()}. Open it to finish signing up.`}
          action={
            <Link href="/login" className="hover:no-underline">
              <Button variant="secondary">Back to log in</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <form onSubmit={step === 0 ? next : finish} className="flex flex-1 flex-col gap-4">
      <TopBar
        onBack={() => (step === 0 ? router.push('/') : setStep(0))}
        title={`Step ${step === 0 ? 1 : 2} of 2`}
        center
      />
      <ProgressBar segments={step === 0 ? ['current', 'pending'] : ['correct', 'current']} />
      <h1 className="my-2 text-[26px] leading-8 font-semibold tracking-[-0.02em]">
        {step === 0 ? 'Create your account' : 'Pick a username'}
      </h1>

      {step === 0 ? (
        <>
          <TextField label="Full name" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="Phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+91"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <PasswordField
            label="Password"
            autoComplete="new-password"
            hint="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="flex items-center gap-3 text-[13px] text-fg-4">
            <span className="h-px flex-1 bg-line" />
            or
            <span className="h-px flex-1 bg-line" />
          </div>
          <Button type="button" variant="secondary" size="lg" fullWidth onClick={signInWithGoogle}>
            <GoogleIcon /> Continue with Google
          </Button>
          <p className="text-center text-sm text-fg-3">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold">
              Log in
            </Link>
          </p>
        </>
      ) : (
        <>
          <TextField
            label="Username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            leading={<AtSign size={18} strokeWidth={1.75} />}
            value={username}
            onChange={(e) => {
              setUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))
              setUsernameError(null)
            }}
            hint="Shown in battles and leaderboards instead of your name."
            error={usernameError}
          />
          <div className="flex flex-wrap gap-2">
            {ideas.map((s) => (
              <Chip
                key={s}
                size="sm"
                active={username === s}
                onClick={() => {
                  setUsername(s)
                  setUsernameError(null)
                }}
              >
                {s}
              </Chip>
            ))}
          </div>
          <p className="text-[13px] text-fg-3">You can add your college, exam and daily goal later in your profile.</p>
        </>
      )}

      <StickyFooter className="mt-auto">
        <Button type="submit" size="lg" fullWidth loading={loading}>
          {step === 0 ? 'Continue' : 'Create account'}
        </Button>
      </StickyFooter>
    </form>
  )
}
