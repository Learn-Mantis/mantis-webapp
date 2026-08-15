'use client'

import { useState } from 'react'
import { Zap, Timer, Trophy } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { BATTLE_CATEGORIES } from '@/lib/config/subjects'
import { BATTLE_MODE_LIST, type BattleModeKey } from '@/lib/config/battle-modes'
import { cn } from '@/lib/utils'

const MODE_ICON: Record<BattleModeKey, typeof Zap> = { rapid: Zap, blitz: Timer, marathon: Trophy }
const MODE_TONE: Record<BattleModeKey, string> = {
  rapid: 'bg-gold-500/10 text-gold-600 dark:text-gold-400',
  blitz: 'bg-brand-500/10 text-brand-600 dark:text-brand-400',
  marathon: 'bg-info-500/10 text-info-600 dark:text-info-400',
}

export interface BattleSelection {
  categoryId: string
  mode: BattleModeKey
}

interface PlayBattleSheetProps {
  open: boolean
  onClose: () => void
  /** Invoked when the user taps Find Match. Callers apply the auth gate here. */
  onFindMatch: (selection: BattleSelection) => void
}

export function PlayBattleSheet({ open, onClose, onFindMatch }: PlayBattleSheetProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [categoryId, setCategoryId] = useState('all')
  const [mode, setMode] = useState<BattleModeKey | null>(null)

  function reset() {
    setStep(1)
    setCategoryId('all')
    setMode(null)
  }

  function handleClose() {
    onClose()
    setTimeout(reset, 300)
  }

  function handleFind() {
    if (!mode) return
    onFindMatch({ categoryId, mode })
    handleClose()
  }

  return (
    <Sheet
      open={open}
      onClose={handleClose}
      title={step === 1 ? 'Choose Category' : 'Choose Mode'}
      className="sm:max-w-lg"
    >
      {step === 1 && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-2 max-h-[46vh] overflow-y-auto no-scrollbar">
            {BATTLE_CATEGORIES.map((c) => (
              <Chip key={c.id} active={categoryId === c.id} onClick={() => setCategoryId(c.id)}>
                {c.label}
              </Chip>
            ))}
          </div>
          <Button size="lg" className="w-full" onClick={() => setStep(2)}>
            Continue
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            {BATTLE_MODE_LIST.map((m) => {
              const Icon = MODE_ICON[m.key]
              const selected = mode === m.key
              return (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  className={cn(
                    'flex items-center gap-3.5 rounded-2xl border p-4 text-left transition-colors',
                    selected
                      ? 'border-brand-500 bg-brand-500/5'
                      : 'border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)]',
                  )}
                >
                  <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl shrink-0', MODE_TONE[m.key])}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[15px]">{m.label}</p>
                    <p className="text-xs text-neutral-500">{m.tagline}</p>
                  </div>
                  <div
                    className={cn(
                      'h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0',
                      selected ? 'border-brand-500' : 'border-neutral-300 dark:border-neutral-600',
                    )}
                  >
                    {selected && <div className="h-2.5 w-2.5 rounded-full bg-brand-500" />}
                  </div>
                </button>
              )
            })}
          </div>
          <Button size="lg" className="w-full" disabled={!mode} onClick={handleFind}>
            Find Match
          </Button>
        </div>
      )}
    </Sheet>
  )
}
