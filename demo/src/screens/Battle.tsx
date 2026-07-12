import { useState } from 'react'
import { Swords, Trophy, Percent, Flame, Timer, ListChecks, Crown, ChevronRight } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { StatTile } from '../components/ui/StatTile'
import { SectionHeader } from '../components/ui/SectionHeader'
import { Avatar } from '../components/ui/Avatar'
import { PageContainer } from '../components/layout/PageContainer'
import { PlayBattleSheet } from '../components/battle/PlayBattleSheet'
import { recentBattles, leaderboard } from '../data/mock'
import { cn } from '../lib/utils'

const leagues = [
  { name: 'Bronze', color: '#B08D57', range: '0–999' },
  { name: 'Silver', color: '#9CA3AF', range: '1000–1299' },
  { name: 'Gold', color: '#F5B301', range: '1300–1699', current: true },
  { name: 'Platinum', color: '#4FD1C5', range: '1700–1999' },
  { name: 'Diamond', color: '#5B9DFF', range: '2000–2299' },
  { name: 'Master', color: '#A855F7', range: '2300–2599' },
  { name: 'Grandmaster', color: '#EF4444', range: '2600+' },
]

export function Battle() {
  const [sheetOpen, setSheetOpen] = useState(false)

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
              <p className="text-4xl font-extrabold font-[var(--font-display)] leading-none mt-1">1842</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
                <Trophy size={13} /> Gold III
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
              <p className="font-bold">Season 1</p>
              <p className="text-[11px] text-brand-100">42 days left</p>
            </div>
          </div>
          <Button
            size="lg"
            onClick={() => setSheetOpen(true)}
            className="w-full bg-white !text-brand-700 shadow-xl"
            variant="secondary"
          >
            <Swords size={19} /> Play Battle
          </Button>
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
          <StatTile icon={Swords} label="Battles Played" value="284" tone="info" />
          <StatTile icon={Trophy} label="Battles Won" value="193" tone="gold" />
        </div>
      </div>

      {/* Leaderboard preview */}
      <div>
        <SectionHeader title="Leaderboard" action="View full" />
        <Card className="p-2">
          <div className="flex px-3 pt-2 pb-1 gap-2">
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-500/10 rounded-full px-2.5 py-1">College</span>
            <span className="text-xs font-medium text-neutral-500 px-2.5 py-1">Global</span>
          </div>
          <div className="flex flex-col">
            {leaderboard.map((p) => (
              <div
                key={p.rank}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-2xl',
                  p.you && 'bg-brand-500/5',
                )}
              >
                <div className="w-6 flex justify-center">
                  {p.rank <= 3 ? (
                    <Crown size={16} className={p.rank === 1 ? 'text-gold-500' : p.rank === 2 ? 'text-neutral-400' : 'text-amber-700'} />
                  ) : (
                    <span className="text-xs font-bold text-neutral-400">{p.rank}</span>
                  )}
                </div>
                <Avatar initials={p.name.split(' ').map((s) => s[0]).join('')} size={34} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-semibold truncate">{p.name}{p.you && ' (You)'}</p>
                  <p className="text-[11px] text-neutral-500 truncate">{p.college}</p>
                </div>
                <span className="text-sm font-bold shrink-0">{p.rating}</span>
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
              <Avatar initials={b.opponent.split(' ').map((s) => s[0]).join('')} size={40} />
              <div className="flex-1">
                <p className="text-sm font-semibold">{b.opponent}</p>
                <p className="text-xs text-neutral-500">{b.time} · {b.score}</p>
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

      {/* League ladder */}
      <div>
        <SectionHeader title="League Ladder" />
        <div className="flex flex-col gap-2">
          {leagues.map((l) => (
            <Card
              key={l.name}
              className={cn('p-3.5 flex items-center gap-3.5', l.current && 'ring-2 ring-brand-500')}
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl shrink-0"
                style={{ background: `${l.color}22`, color: l.color }}
              >
                <Trophy size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">{l.name}</p>
                <p className="text-xs text-neutral-500">{l.range} rating</p>
              </div>
              {l.current ? (
                <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-brand-500 text-white">You</span>
              ) : (
                <ChevronRight size={16} className="text-neutral-400" />
              )}
            </Card>
          ))}
        </div>
      </div>

      <PlayBattleSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </PageContainer>
  )
}
