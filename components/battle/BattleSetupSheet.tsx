'use client'

import { useEffect, useState } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { battleApi, type Bot } from '@/features/battle/api'
import { BATTLE_MODE_LIST, type BattleModeKey } from '@/lib/config/battle-modes'
import { BATTLE_CATEGORIES } from '@/lib/config/subjects'
import { RANK_TIERS } from '@/lib/config/ranks'
import { cn } from '@/lib/utils'

export type SetupAction = 'live' | 'bot' | 'challenge'

export interface SetupChoice {
  action: SetupAction
  mode: BattleModeKey
  categoryId: string
  rated: boolean
  botId?: string
}

const TITLES: Record<SetupAction, { title: string; sub: string; cta: string }> = {
  live: { title: 'Find an opponent', sub: 'Get matched with a player near your rating.', cta: 'Find opponent' },
  bot: { title: 'Practice vs a bot', sub: 'Pick a bot by rank. Practice never changes your rating.', cta: 'Start practice' },
  challenge: {
    title: 'Challenge a friend',
    sub: 'Play a set first, then send single-use links. Friends answer the same questions.',
    cta: 'Play my set',
  },
}

const GROUP_IDS = ['all', 'pre-clinical', 'para-clinical', 'clinical']

interface Props {
  open: boolean
  action: SetupAction
  onClose: () => void
  onStart: (choice: SetupChoice) => void
  /** Rating used to preselect a fair bot. */
  rating: number
  busy?: boolean
}

export function BattleSetupSheet({ open, action, onClose, onStart, rating, busy }: Props) {
  const [mode, setMode] = useState<BattleModeKey>('blitz')
  const [categoryId, setCategoryId] = useState('all')
  const [rated, setRated] = useState(true)
  const [showSubjects, setShowSubjects] = useState(false)
  const [bots, setBots] = useState<Bot[]>([])
  const [botId, setBotId] = useState<string | null>(null)

  useEffect(() => {
    if (!open || action !== 'bot' || bots.length) return
    battleApi
      .bots()
      .then((list) => {
        setBots(list)
        // Default to the bot closest to the player's rating.
        const nearest = [...list].sort((a, b) => Math.abs(a.rating - rating) - Math.abs(b.rating - rating))[0]
        setBotId((cur) => cur ?? nearest?.id ?? null)
      })
      .catch(() => {})
  }, [open, action, bots.length, rating])

  const t = TITLES[action]
  const groups = BATTLE_CATEGORIES.filter((c) => GROUP_IDS.includes(c.id))
  const subjects = BATTLE_CATEGORIES.filter((c) => !GROUP_IDS.includes(c.id))

  return (
    <Sheet open={open} onClose={onClose} className="sm:max-w-lg">
      <div className="flex flex-col gap-5">
        <div>
          <h2 className="text-lg font-semibold">{t.title}</h2>
          <p className="text-sm text-neutral-500 mt-0.5">{t.sub}</p>
        </div>

        {/* Subject */}
        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-medium text-neutral-500">Subjects</h3>
          <div className="flex flex-wrap gap-2">
            {groups.map((c) => (
              <Chip key={c.id} active={categoryId === c.id} onClick={() => setCategoryId(c.id)}>
                {c.label}
              </Chip>
            ))}
            <Chip active={showSubjects || !GROUP_IDS.includes(categoryId)} onClick={() => setShowSubjects((v) => !v)}>
              One subject
            </Chip>
          </div>
          {(showSubjects || !GROUP_IDS.includes(categoryId)) && (
            <div className="flex flex-wrap gap-2 pt-1">
              {subjects.map((c) => (
                <Chip key={c.id} active={categoryId === c.id} onClick={() => setCategoryId(c.id)} className="h-8 px-3 text-xs">
                  {c.label}
                </Chip>
              ))}
            </div>
          )}
        </section>

        {/* Mode */}
        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-medium text-neutral-500">Mode</h3>
          <div className="grid grid-cols-3 gap-2">
            {BATTLE_MODE_LIST.map((m) => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={cn(
                  'rounded-2xl border p-3 text-left transition-colors',
                  mode === m.key
                    ? 'border-brand-500 bg-brand-500/10'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300',
                )}
              >
                <p className="text-sm font-semibold">{m.label}</p>
                <p className="text-[11px] text-neutral-500 mt-0.5 leading-tight">{m.tagline}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Ranked / friendly */}
        {action !== 'bot' && (
          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-medium text-neutral-500">Type</h3>
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-neutral-100 dark:bg-neutral-800/60 p-1">
              {[
                { v: true, label: 'Ranked', sub: 'Changes rating' },
                { v: false, label: 'Friendly', sub: 'Just for fun' },
              ].map((o) => (
                <button
                  key={o.label}
                  onClick={() => setRated(o.v)}
                  className={cn(
                    'rounded-xl py-2 text-center transition-colors',
                    rated === o.v ? 'bg-white dark:bg-neutral-900 shadow-sm' : 'text-neutral-500',
                  )}
                >
                  <p className="text-sm font-medium">{o.label}</p>
                  <p className="text-[11px] text-neutral-500">{o.sub}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Bot picker */}
        {action === 'bot' && (
          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-medium text-neutral-500">Bot</h3>
            <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
              {bots.length === 0 && <p className="text-sm text-neutral-500">Loading bots…</p>}
              {bots.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setBotId(b.id)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
                    botId === b.id
                      ? 'border-brand-500 bg-brand-500/10'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300',
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {b.name} <span className="text-neutral-400 font-normal">· {RANK_TIERS.find((r) => r.key === b.rank_key)?.name}</span>
                    </p>
                    <p className="text-xs text-neutral-500 truncate">{b.blurb}</p>
                  </div>
                  <span className="text-sm tabular-nums text-neutral-500">{b.rating}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        <Button
          size="lg"
          disabled={busy || (action === 'bot' && !botId)}
          onClick={() => onStart({ action, mode, categoryId, rated: action === 'bot' ? false : rated, botId: botId ?? undefined })}
        >
          {busy ? 'Starting…' : t.cta}
        </Button>
      </div>
    </Sheet>
  )
}
