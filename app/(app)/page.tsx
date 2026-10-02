'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Flame, Layers, NotebookPen, Swords, Trophy } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Feedback'
import { ListRow } from '@/components/ui/ListRow'
import { MantisLogo } from '@/components/ui/Logo'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { PageContainer } from '@/components/layout/PageContainer'
import { RankBadge } from '@/components/battle/RankBadge'
import { Landing } from '@/components/onboarding/Landing'
import { useUser } from '@/features/auth/user-provider'
import { ensurePlayer } from '@/features/auth/guest'
import { battleApi, type BattleProfile, type MyStats } from '@/features/battle/api'
import { MISTAKE_DECK_ID, useFlashcardStore } from '@/stores/flashcards'
import { STARTING_RATING } from '@/lib/config/ranks'

const DEFAULT_GOAL = 50

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

function SignedInHome() {
  const router = useRouter()
  const { user } = useUser()
  const [hello] = useState(greeting)
  const [profile, setProfile] = useState<BattleProfile | null>(null)
  const [stats, setStats] = useState<MyStats | null>(null)
  const dueCount = useFlashcardStore((s) => s.getTotalDueCount())
  const mistakes = useFlashcardStore((s) => s.cards.filter((c) => c.deckId === MISTAKE_DECK_ID).length)

  useEffect(() => {
    let cancelled = false
    ensurePlayer()
      .then((p) => !cancelled && setProfile(p))
      .catch(() => {})
    battleApi
      .myStats()
      .then((s) => !cancelled && setStats(s))
      .catch(() => !cancelled && setStats({ answered_total: 0, correct_total: 0, answered_today: 0, day_streak: 0 }))
    return () => {
      cancelled = true
    }
  }, [])

  const meta = (user?.user_metadata ?? {}) as { daily_goal?: number; full_name?: string }
  const goal = Number(meta.daily_goal) || DEFAULT_GOAL
  const done = stats?.answered_today ?? 0
  const left = Math.max(0, goal - done)
  const rating = profile?.rating ?? STARTING_RATING
  const name = profile?.username ?? meta.full_name?.split(' ')[0] ?? ''

  return (
    <PageContainer>
      {/* Phone header (desktop has the sidebar) */}
      <div className="-mt-1 flex h-10 items-center justify-between lg:hidden">
        <MantisLogo size={20} />
        <div className="flex items-center gap-3">
          {stats && stats.day_streak > 0 && (
            <span className="num inline-flex items-center gap-1 text-sm text-on-highlight">
              <Flame size={16} strokeWidth={1.75} fill="var(--antenna)" />
              {stats.day_streak}
            </span>
          )}
          <Link href="/account" aria-label="Profile">
            <Avatar name={name || 'You'} size={32} />
          </Link>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-fg-3" suppressHydrationWarning>
            {hello}
          </p>
          <h1 className="text-[26px] leading-8 font-semibold tracking-[-0.02em]">{name || <Skeleton width={160} height={28} />}</h1>
        </div>
        {stats && stats.day_streak > 0 && (
          <span className="hidden items-center gap-1.5 text-sm font-medium text-on-highlight lg:inline-flex">
            <Flame size={16} strokeWidth={1.75} fill="var(--antenna)" />
            {stats.day_streak}-day streak
          </span>
        )}
      </div>

      <Card className="flex flex-col gap-[18px] p-5">
        <div className="flex items-center gap-[18px]">
          <ProgressRing progress={(done / goal) * 100} size={72} strokeWidth={6}>
            <span className="num text-[19px] leading-none">{done}</span>
            <span className="num text-[11px] text-fg-3">/{goal}</span>
          </ProgressRing>
          <div className="flex-1">
            <p className="text-[13px] text-fg-3">Today’s goal</p>
            <p className="text-[17px] leading-6 font-semibold">
              {left > 0 ? `${left} questions to go` : 'Goal done for today'}
            </p>
            <p className="mt-0.5 text-[13px] text-fg-3">Answered in battles today</p>
          </div>
        </div>
        <Link href="/battle/new" className="hover:no-underline">
          <Button size="lg" fullWidth>
            Start a battle <ArrowRight size={20} strokeWidth={1.75} />
          </Button>
        </Link>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card interactive onClick={() => router.push('/flashcards')} className="flex flex-col gap-2.5 p-4">
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-fg-3">
            <Layers size={16} strokeWidth={1.75} /> Due flashcards
          </p>
          <p className="num text-[28px] leading-8 tracking-[-0.03em]" suppressHydrationWarning>
            {dueCount}
          </p>
          <p className="text-[13px] font-medium text-link">{dueCount > 0 ? 'Review now' : 'All caught up'}</p>
        </Card>
        <Card interactive onClick={() => router.push('/leaderboard')} className="flex flex-col gap-2.5 p-4">
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-fg-3">
            <Trophy size={16} strokeWidth={1.75} /> Rating
          </p>
          <p className="num text-[28px] leading-8 tracking-[-0.03em]">{rating.toLocaleString('en-IN')}</p>
          <RankBadge rating={rating} />
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <ListRow
          icon={<Swords size={18} strokeWidth={1.75} />}
          title="Quick battle"
          subtitle="Blitz · Ranked · All subjects"
          chevron
          divider
          onClick={() => router.push('/battle/new?again=1&mode=blitz&cat=all&rated=1')}
        />
        <ListRow
          icon={<NotebookPen size={18} strokeWidth={1.75} />}
          title="Mistake notebook"
          subtitle={mistakes ? `${mistakes} questions to revisit` : 'Questions you get wrong land here'}
          chevron
          onClick={() => router.push('/flashcards?tab=mistakes')}
        />
      </Card>

      {stats && stats.answered_total > 0 && (
        <p className="text-center text-[13px] text-fg-3">
          <span className="num">{stats.answered_total.toLocaleString('en-IN')}</span> answered ·{' '}
          <span className="num">{Math.round((stats.correct_total / stats.answered_total) * 100)}%</span> accuracy
        </p>
      )}
    </PageContainer>
  )
}

export default function HomePage() {
  const { user, loading } = useUser()
  if (loading) {
    return (
      <PageContainer>
        <Skeleton height={176} radius={16} />
      </PageContainer>
    )
  }
  return user ? <SignedInHome /> : <Landing />
}
