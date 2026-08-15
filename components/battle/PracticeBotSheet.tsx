'use client'

import { useState } from 'react'
import { Bot, Zap, Target, Swords } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { BOT_ROSTER, type BotRosterItem } from '@/features/battle/bot'
import { BATTLE_MODES, type BattleModeKey } from '@/lib/config/battle-modes'
import { BATTLE_CATEGORIES } from '@/lib/config/subjects'
import { cn } from '@/lib/utils'

interface PracticeBotSheetProps {
  open: boolean
  onClose: () => void
  onStartPractice: (bot: BotRosterItem, mode: BattleModeKey, categoryId: string) => void
}

type TierFilter = 'all' | 'intern' | 'resident' | 'registrar' | 'specialist' | 'consultant'

const TIER_FILTERS: { key: TierFilter; label: string; range: string }[] = [
  { key: 'all', label: 'All Bots', range: '800–2200' },
  { key: 'intern', label: 'Intern', range: '800–900' },
  { key: 'resident', label: 'Resident', range: '1100–1200' },
  { key: 'registrar', label: 'Registrar', range: '1400–1500' },
  { key: 'specialist', label: 'Specialist', range: '1650–1750' },
  { key: 'consultant', label: 'Consultant', range: '2000–2200' },
]

export function PracticeBotSheet({ open, onClose, onStartPractice }: PracticeBotSheetProps) {
  const [selectedBot, setSelectedBot] = useState<BotRosterItem>(BOT_ROSTER[2]) // Default Dr. Priya Nair (Resident)
  const [tierFilter, setTierFilter] = useState<TierFilter>('all')
  const [mode, setMode] = useState<BattleModeKey>('rapid')
  const [categoryId, setCategoryId] = useState<string>('all')

  const filteredBots = tierFilter === 'all' ? BOT_ROSTER : BOT_ROSTER.filter((b) => b.rankKey === tierFilter)

  function handleStart() {
    onStartPractice(selectedBot, mode, categoryId)
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} showClose className="sm:max-w-2xl md:max-w-3xl">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Bot size={16} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              AI Doctor Training Arena
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold font-[var(--font-display)] mt-0.5">Practice vs AI Doctors</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Select an AI bot with calibrated Elo rating, response speed, and clinical accuracy. Zero rank risk.
          </p>
        </div>

        {/* Tier Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {TIER_FILTERS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTierFilter(t.key)}
              className={cn(
                'flex flex-col items-start px-3 py-1 rounded-xl border text-left shrink-0 transition-all',
                tierFilter === t.key
                  ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)] text-neutral-500 hover:border-neutral-400',
              )}
            >
              <span className="text-xs font-bold">{t.label}</span>
              <span className="text-[10px] text-neutral-400">{t.range} Elo</span>
            </button>
          ))}
        </div>

        {/* Bot Roster Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[220px] sm:max-h-[250px] overflow-y-auto pr-1">
          {filteredBots.map((bot) => {
            const isSelected = selectedBot.id === bot.id
            return (
              <button
                key={bot.id}
                type="button"
                onClick={() => setSelectedBot(bot)}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-2xl border text-left transition-all',
                  isSelected
                    ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/30'
                    : 'border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)] hover:border-purple-500/40 bg-[var(--color-surface-light-muted)]/30 dark:bg-[var(--color-surface-dark-muted)]/30',
                )}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-xl shadow-inner">
                  {bot.avatarKey}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5">
                    <p className="text-sm font-bold truncate">{bot.name}</p>
                    <span className="text-xs font-black px-2 py-0.5 rounded-full bg-purple-500 text-white shrink-0">
                      {bot.rating} Elo
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 truncate mt-0.5">{bot.title} · {bot.college}</p>

                  <div className="flex items-center gap-3 mt-1.5 text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
                    <span className="flex items-center gap-1">
                      <Zap size={11} className="text-amber-500" /> {bot.speedLabel}
                    </span>
                    <span className="flex items-center gap-1">
                      <Target size={11} className="text-emerald-500" /> {bot.accuracyPct}% Acc
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Selected Bot Highlight Card */}
        <Card className="p-3 bg-gradient-to-br from-purple-500/5 via-brand-500/5 to-transparent border-purple-500/20 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{selectedBot.avatarKey}</span>
              <div>
                <p className="text-sm font-extrabold font-[var(--font-display)]">{selectedBot.name}</p>
                <p className="text-[11px] text-neutral-500">{selectedBot.rankName} ({selectedBot.rating} Elo)</p>
              </div>
            </div>
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full">
              ⚡ ~{selectedBot.avgResponseSec}s Avg Speed
            </span>
          </div>

          <p className="text-xs italic text-neutral-600 dark:text-neutral-300 bg-white/40 dark:bg-black/20 p-2 rounded-xl border border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)]">
            "{selectedBot.quote}"
          </p>
        </Card>

        {/* Match Settings: Mode & Subject */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-neutral-500 px-0.5">Game Mode</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(BATTLE_MODES) as BattleModeKey[]).map((key) => {
                const m = BATTLE_MODES[key]
                const isCur = mode === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMode(key)}
                    className={cn(
                      'p-1.5 rounded-xl border text-center transition-all',
                      isCur
                        ? 'border-purple-500 bg-purple-500/10 font-bold text-purple-600 dark:text-purple-400'
                        : 'border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)] text-xs text-neutral-500',
                    )}
                  >
                    <p className="text-xs font-bold">{m.label}</p>
                    <p className="text-[10px] text-neutral-400">{m.questionCount} Qs</p>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-neutral-500 px-0.5">Subject Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-10 rounded-xl border border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)] bg-[var(--color-surface-light-muted)]/50 dark:bg-[var(--color-surface-dark-muted)]/50 px-3 text-xs font-bold outline-none focus:border-purple-500"
            >
              {BATTLE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CTA Launch */}
        <Button size="lg" onClick={handleStart} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold gap-2">
          <Swords size={18} /> Start Practice vs {selectedBot.name} ({selectedBot.rating} Elo)
        </Button>
      </div>
    </Sheet>
  )
}
