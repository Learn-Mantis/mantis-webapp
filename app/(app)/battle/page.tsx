'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Swords, Percent, Flame, Timer, ListChecks, Trophy, UserPlus, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatTile } from '@/components/ui/StatTile'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Avatar } from '@/components/ui/Avatar'
import { PageContainer } from '@/components/layout/PageContainer'
import { PlayBattleSheet, type BattleSelection } from '@/components/battle/PlayBattleSheet'
import { RankBadge } from '@/components/battle/RankBadge'
import { recentBattles, leaderboard } from '@/lib/mock'
import { RANK_TIERS, getRank, getNextRank } from '@/lib/config/ranks'
import { useAuthGate } from '@/features/auth/use-auth-gate'
import { cn } from '@/lib/utils'

const MY_RATING = 1842

function rangeLabel(index: number): string {
  const tier = RANK_TIERS[index]
  const next = RANK_TIERS[index + 1]
  return next ? `${tier.minRating}–${next.minRating - 1}` : `${tier.minRating}+`
}

export default function BattlePage() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const requireAuth = useAuthGate()
  const rank = getRank(MY_RATING)
  const next = getNextRank(MY_RATING)

  function handleFindMatch(sel: BattleSelection) {
    requireAuth({
      reason: 'find a match',
      onAuthed: () => toast.success(`Matchmaking (${sel.mode}) arrives in the next update ⚔️`),
    })
  }

  return (
    <PageContainer>
      <h1 className="text-[22px] font-extrabold tracking-tight font-[var(--font-display)] pt-1">Battle Arena</h1>

      {/* Hero */}
      <Card className="p-5 relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 border-0 text-white">
        <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-100">Current Rating</p>
              <p className="text-4xl font-extrabold font-[var(--font-display)] leading-none mt-1">{MY_RATING}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
                <Trophy size={13} /> {rank.name}
              </span>
              <span className="text-[11px] text-brand-100">Top 5%</span>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div>
              <p className="font-bold">#8</p>
              <p className="text-[11px] text-brand-100">College Rank</p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div>
              <p className="font-bold">{next ? `${next.minRating - MY_RATING} to ${next.name}` : 'Top tier'}</p>
              <p className="text-[11px] text-brand-100">Season 1</p>
            </div>
          </div>
          <div className="flex gap-2.5">
            <Button size="lg" onClick={() => setSheetOpen(true)} className="flex-1 bg-white !text-brand-700 shadow-xl" variant="secondary">
              <Swords size={19} /> Play Battle
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="bg-white/15 !text-white border-white/20 px-5"
              onClick={() => requireAuth({ reason: 'invite a friend' })}
            >
              <UserPlus size={19} />
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div>
        <SectionHeader title="Your Statistics" />
        <div className="grid grid-cols-3 gap-3">
          <StatTile icon={Percent} label="Win Rate" value="68%" tone="brand" />
          <StatTile icon={ListChecks} label="Accuracy" value="76%" tone="info" />
          <StatTile icon={Flame} label="Streak" value="5" tone="gold" />
          <StatTile icon={Timer} label="Avg Response" value="12.4s" tone="brand" />
          <StatTile icon={Swords} label="Games" value="284" tone="info" />
          <StatTile icon={Trophy} label="Wins" value="193" tone="gold" />
        </div>
      </div>

      {/* Leaderboard preview */}
      <div>
        <SectionHeader title="Leaderboard" action="View full" onAction={() => requireAuth({ reason: 'view the full leaderboard' })} />
        <Card className="p-2">
          <div className="flex px-3 pt-2 pb-1 gap-2">
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-500/10 rounded-full px-2.5 py-1">College</span>
            <span className="text-xs font-medium text-neutral-500 px-2.5 py-1">State</span>
            <span className="text-xs font-medium text-neutral-500 px-2.5 py-1">National</span>
          </div>
          <div className="flex flex-col">
            {leaderboard.map((p) => (
              <div key={p.rank} className={cn('flex items-center gap-3 px-3 py-2.5 rounded-2xl', p.you && 'bg-brand-500/5')}>
                <div className="w-6 flex justify-center">
                  <span className={cn('text-xs font-bold', p.rank <= 3 ? 'text-gold-500' : 'text-neutral-400')}>{p.rank}</span>
                </div>
                <Avatar initials={p.name.slice(0, 2).toUpperCase()} size={34} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-semibold truncate">
                    {p.name}
                    {p.you && ' (You)'}
                  </p>
                  <p className="text-[11px] text-neutral-500 truncate">{p.college}</p>
                </div>
                {p.you ? (
                  <span className="text-sm font-bold shrink-0">{p.rating}</span>
                ) : (
                  <button
                    onClick={() => requireAuth({ reason: `follow ${p.name}` })}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface-light-muted)] dark:bg-[var(--color-surface-dark-muted)] text-brand-600 dark:text-brand-400 shrink-0"
                    aria-label={`Follow ${p.name}`}
                  >
                    <UserPlus size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent battles */}
      <div>
        <SectionHeader title="Recent Battles" />
        <div className="flex flex-col gap-2.5">
          {recentBattles.map((b) => (
            <Card key={b.opponent + b.time} className="p-3.5 flex items-center gap-3">
              <Avatar initials={b.opponent.slice(0, 2).toUpperCase()} size={40} />
              <div className="flex-1">
                <p className="text-sm font-semibold">{b.opponent}</p>
                <p className="text-xs text-neutral-500">
                  {b.time} · {b.score}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <span
                  className={cn(
                    'text-xs font-bold px-2 py-0.5 rounded-full',
                    b.result === 'win'
                      ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                      : 'bg-danger-500/10 text-danger-600 dark:text-danger-400',
                  )}
                >
                  {b.result === 'win' ? 'Victory' : 'Defeat'}
                </span>
                <span className={cn('text-xs font-semibold mt-1', b.ratingChange > 0 ? 'text-brand-600 dark:text-brand-400' : 'text-danger-500')}>
                  {b.ratingChange > 0 ? '+' : ''}
                  {b.ratingChange}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Rank ladder */}
      <div>
        <SectionHeader title="Rank Ladder" subtitle="Climb from Intern to Consultant" />
        <div className="flex flex-col gap-2">
          {RANK_TIERS.map((tier, i) => (
            <Card key={tier.key} className={cn('p-3.5 flex items-center gap-3.5', tier.key === rank.key && 'ring-2 ring-brand-500')}>
              <RankBadge tier={tier} size={44} />
              <div className="flex-1">
                <p className="text-sm font-bold">{tier.name}</p>
                <p className="text-xs text-neutral-500">{rangeLabel(i)} rating</p>
              </div>
              {tier.key === rank.key ? (
                <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-brand-500 text-white">You</span>
              ) : (
                <ChevronRight size={16} className="text-neutral-400" />
              )}
            </Card>
          ))}
        </div>
      </div>

      <PlayBattleSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onFindMatch={handleFindMatch} />
    </PageContainer>
  )
}
