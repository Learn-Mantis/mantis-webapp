'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { MantisLogo } from '@/components/ui/Logo'
import { ensurePlayer } from '@/features/auth/guest'
import { useUser } from '@/features/auth/user-provider'
import { battleApi, BattleApiError, type ChallengePeek } from '@/features/battle/api'
import { playPath } from '@/features/battle/use-start-battle'
import { BATTLE_MODES } from '@/lib/config/battle-modes'
import { categoryLabel } from '@/lib/config/subjects'

const DEAD_ENDS: Record<string, { title: string; body: string }> = {
  not_found: { title: 'Link not found', body: 'Check that you copied the whole link.' },
  used: { title: 'This link has been used', body: 'Each challenge link can be played once. Ask for a new one.' },
  expired: { title: 'This challenge has expired', body: 'Challenge links last 24 hours.' },
  own_challenge: { title: 'This is your own challenge', body: 'Send this link to a friend — it works once.' },
}

/** Landing page for a shared challenge link. */
export default function ChallengeLinkPage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const { loading: authLoading, sessionUser } = useUser()
  const [peek, setPeek] = useState<ChallengePeek | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [starting, setStarting] = useState(false)

  // Peek again once we know who's looking (resume / own-link detection).
  useEffect(() => {
    if (authLoading) return
    battleApi
      .peekChallenge(token)
      .then(setPeek)
      .catch(() => setPeek({ status: 'not_found' }))
  }, [token, authLoading, sessionUser?.id])

  async function start() {
    setStarting(true)
    try {
      await ensurePlayer()
      const battleId = await battleApi.claimChallenge(token)
      router.push(playPath(battleId))
    } catch (e) {
      toast.error(e instanceof BattleApiError ? e.message : 'Could not start the challenge.')
      setStarting(false)
      setConfirming(false)
      battleApi.peekChallenge(token).then(setPeek).catch(() => {})
    }
  }

  const deadEnd = peek && DEAD_ENDS[peek.status]
  const mode = peek?.mode ? BATTLE_MODES[peek.mode] : null

  return (
    <main className="min-h-screen bg-[var(--color-bg-light)] dark:bg-[var(--color-bg-dark)] flex flex-col items-center px-4 py-8">
      <Link href="/" className="mb-10">
        <MantisLogo size={36} withText />
      </Link>

      <Card className="w-full max-w-md p-6 flex flex-col gap-5">
        {!peek && <p className="text-sm text-neutral-500 text-center">Loading challenge…</p>}

        {deadEnd && (
          <>
            <div className="text-center">
              <h1 className="text-lg font-semibold">{deadEnd.title}</h1>
              <p className="text-sm text-neutral-500 mt-1">{deadEnd.body}</p>
            </div>
            <Link href="/battle">
              <Button className="w-full">Make your own challenge</Button>
            </Link>
          </>
        )}

        {peek?.status === 'yours' && peek.battle_id && (
          <>
            <div className="text-center">
              <h1 className="text-lg font-semibold">You started this challenge</h1>
              <p className="text-sm text-neutral-500 mt-1">Pick up where you left off — the clock kept running.</p>
            </div>
            <Button className="w-full" onClick={() => router.push(playPath(peek.battle_id!))}>
              Continue
            </Button>
          </>
        )}

        {peek?.status === 'open' && mode && (
          <>
            <div className="text-center">
              <p className="text-sm text-neutral-500">{peek.host?.username} challenged you</p>
              <h1 className="text-2xl font-bold mt-1">
                Beat {peek.host_score}
                {peek.question_count ? ` / ${peek.question_count}` : ''}
              </h1>
            </div>

            <dl className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/50 py-2.5">
                <dt className="text-[11px] text-neutral-500">Mode</dt>
                <dd className="text-sm font-medium">{mode.label}</dd>
              </div>
              <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/50 py-2.5">
                <dt className="text-[11px] text-neutral-500">Subjects</dt>
                <dd className="text-sm font-medium truncate px-1">{categoryLabel(peek.category_id ?? 'all')}</dd>
              </div>
              <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/50 py-2.5">
                <dt className="text-[11px] text-neutral-500">Type</dt>
                <dd className="text-sm font-medium">{peek.rated ? 'Ranked' : 'Friendly'}</dd>
              </div>
            </dl>
            <p className="text-xs text-neutral-500 text-center -mt-2">{mode.description}</p>

            {!confirming ? (
              <Button size="lg" onClick={() => setConfirming(true)}>
                Play challenge
              </Button>
            ) : (
              <div className="flex flex-col gap-3 rounded-2xl border border-gold-500/40 bg-gold-500/10 p-4">
                <p className="text-sm font-semibold">This link can only be played once.</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                  As soon as you start, it&rsquo;s used up — even if you close the page. Ready to play now?
                </p>
                <div className="flex gap-2">
                  <Button className="flex-1" disabled={starting} onClick={start}>
                    {starting ? 'Starting…' : 'Start now'}
                  </Button>
                  <Button variant="secondary" className="flex-1" disabled={starting} onClick={() => setConfirming(false)}>
                    Not now
                  </Button>
                </div>
              </div>
            )}

            {!sessionUser && (
              <p className="text-xs text-neutral-500 text-center">
                No account needed — you&rsquo;ll play as a guest.{' '}
                <Link href={`/login?next=/c/${token}`} className="text-brand-600 hover:underline">
                  Log in
                </Link>{' '}
                to play with your rating.
              </p>
            )}
          </>
        )}
      </Card>
    </main>
  )
}
