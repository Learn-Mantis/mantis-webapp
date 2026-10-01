'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { BATTLE_MODES, type BattleModeKey } from '@/lib/config/battle-modes'
import { categoryLabel } from '@/lib/config/subjects'

interface Props {
  mode: BattleModeKey
  categoryId: string
  rated: boolean
  waited: number
  showFallback: boolean
  error: string | null
  fallbackBot: { name: string; rating: number } | null
  onCancel: () => void
  onPlayBot: () => void
  onChallenge: () => void
}

/**
 * Searching screen for live matchmaking. After the fallback delay it offers a
 * rating-matched bot (unrated) or turning the game into a challenge link,
 * while the search keeps running underneath.
 */
export function MatchmakingOverlay({
  mode,
  categoryId,
  rated,
  waited,
  showFallback,
  error,
  fallbackBot,
  onCancel,
  onPlayBot,
  onChallenge,
}: Props) {
  const [keepSearching, setKeepSearching] = useState(false)
  const mm = Math.floor(waited / 60)
  const ss = String(waited % 60).padStart(2, '0')

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[var(--color-bg-light)]/95 dark:bg-[var(--color-bg-dark)]/95 p-6">
      <div className="w-full max-w-sm flex flex-col items-center text-center gap-6">
        <motion.div
          className="h-14 w-14 rounded-full border-2 border-brand-500/30 border-t-brand-500"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
        />
        <div>
          <h2 className="text-lg font-semibold">Finding an opponent</h2>
          <p className="text-sm text-neutral-500 mt-1">
            {BATTLE_MODES[mode].label} · {categoryLabel(categoryId)} · {rated ? 'Ranked' : 'Friendly'}
          </p>
          <p className="text-sm tabular-nums text-neutral-400 mt-2">
            {mm}:{ss}
          </p>
          {error && <p className="text-xs text-danger-500 mt-2">{error}</p>}
        </div>

        {showFallback && !keepSearching && (
          <div className="w-full flex flex-col gap-2">
            <p className="text-sm text-neutral-600 dark:text-neutral-300">No one is around right now.</p>
            {fallbackBot && (
              <Button onClick={onPlayBot}>
                Play {fallbackBot.name} (bot, {fallbackBot.rating}) instead
              </Button>
            )}
            <Button variant="secondary" onClick={onChallenge}>
              Send a challenge link instead
            </Button>
            <button className="text-sm text-neutral-500 py-2" onClick={() => setKeepSearching(true)}>
              Keep searching
            </button>
            {fallbackBot && <p className="text-[11px] text-neutral-400">Bot games are practice and don&rsquo;t change your rating.</p>}
          </div>
        )}

        <button className="text-sm text-neutral-500 underline-offset-4 hover:underline" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}
