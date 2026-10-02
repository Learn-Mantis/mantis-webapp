'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Link2Off, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/Feedback'
import { MantisLogo } from '@/components/ui/Logo'
import { Sheet } from '@/components/ui/Sheet'
import { StickyFooter } from '@/components/layout/TopBar'
import { RankBadge } from '@/components/battle/RankBadge'
import { ensurePlayer } from '@/features/auth/guest'
import { useUser } from '@/features/auth/user-provider'
import { battleApi, BattleApiError, type ChallengePeek } from '@/features/battle/api'
import { playPath } from '@/features/battle/use-start-battle'
import { BATTLE_MODES } from '@/lib/config/battle-modes'
import { categoryLabel } from '@/lib/config/subjects'

const DEAD_ENDS: Record<string, { title: string; body: string }> = {
  not_found: { title: 'Link not found', body: 'Check that you copied the whole link.' },
  used: { title: 'This link has been used', body: 'Each challenge link can be played once. Ask your friend for a new one.' },
  expired: { title: 'This challenge has expired', body: 'Challenge links last 24 hours.' },
  own_challenge: { title: 'This is your own link', body: 'Send it to a friend. It can be played once.' },
}

/** Landing page for a shared challenge link. Works signed out. */
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
    <main className="mx-auto flex min-h-svh w-full max-w-[440px] flex-col bg-app px-5">
      <header className="flex h-14 items-center">
        <MantisLogo size={20} href="/" />
      </header>

      {!peek && <p className="mt-24 text-center text-sm text-fg-3">Loading challenge…</p>}

      {deadEnd && (
        <div className="flex flex-1 flex-col justify-center">
          <EmptyState
            icon={<Link2Off size={24} strokeWidth={1.75} />}
            title={deadEnd.title}
            body={deadEnd.body}
            action={
              <Link href="/battle/new" className="hover:no-underline">
                <Button>Start your own battle</Button>
              </Link>
            }
          />
        </div>
      )}

      {peek?.status === 'yours' && peek.battle_id && (
        <div className="flex flex-1 flex-col justify-center gap-4 text-center">
          <h1 className="text-[21px] leading-7 font-semibold">You’ve started this challenge</h1>
          <p className="text-[15px] text-fg-3">Pick up where you left off. The clock kept running.</p>
          <Button size="lg" fullWidth onClick={() => router.push(playPath(peek.battle_id!))}>
            Continue
          </Button>
        </div>
      )}

      {peek?.status === 'open' && mode && peek.host && (
        <>
          <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
            <Avatar name={peek.host.username} size={80} />
            <div className="flex flex-col items-center gap-1.5">
              <h1 className="text-[21px] leading-7 font-semibold tracking-[-0.02em]">{peek.host.username} challenged you</h1>
              <RankBadge rating={peek.host.rating} showRating />
            </div>
            <Card tone="sunken" className="flex justify-center gap-6 px-5 py-3.5">
              {[
                [categoryLabel(peek.category_id ?? 'all'), 'Subjects'],
                [mode.label, 'Mode'],
                [peek.question_count ? String(peek.question_count) : '5 min', peek.question_count ? 'Questions' : 'Time'],
                [peek.rated ? 'Ranked' : 'Friendly', 'Type'],
              ].map(([v, l]) => (
                <div key={l}>
                  <p className="text-[15px] font-semibold text-fg">{v}</p>
                  <p className="text-xs text-fg-3">{l}</p>
                </div>
              ))}
            </Card>
            <p className="text-sm text-fg-3">Their score stays hidden until you finish.</p>
          </div>

          <StickyFooter>
            <Button size="lg" fullWidth onClick={() => setConfirming(true)}>
              Play challenge
            </Button>
            {!sessionUser && (
              <p className="text-center text-[13px] text-fg-3">
                No account needed.{' '}
                <Link href={`/login?next=/c/${token}`}>Log in</Link> to play with your rating.
              </p>
            )}
          </StickyFooter>

          <Sheet
            open={confirming}
            onClose={() => !starting && setConfirming(false)}
            showClose={false}
            footer={
              <>
                <Button size="lg" fullWidth loading={starting} onClick={start}>
                  Start now
                </Button>
                <Button variant="ghost" fullWidth disabled={starting} onClick={() => setConfirming(false)}>
                  Not now
                </Button>
              </>
            }
          >
            <div className="flex flex-col gap-2 pt-1">
              <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-sunken text-fg">
                <Lock size={22} strokeWidth={1.75} />
              </div>
              <p className="text-[19px] leading-[26px] font-semibold text-fg">This link can only be played once</p>
              <p className="text-[15px] text-fg-2">Once you start, leaving counts as finished. Start now?</p>
            </div>
          </Sheet>
        </>
      )}
    </main>
  )
}
