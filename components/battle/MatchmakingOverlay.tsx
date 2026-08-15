'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Swords, X, Sparkles } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { RankBadge } from '@/components/battle/RankBadge'
import { getRank } from '@/lib/config/ranks'
import type { MatchPlayer } from '@/features/battle/service'

interface MatchmakingOverlayProps {
  open: boolean
  user: MatchPlayer
  opponent: MatchPlayer | null
  modeLabel: string
  categoryLabel: string
  onCancel: () => void
  onReadyToStart: () => void
}

export function MatchmakingOverlay({
  open,
  user,
  opponent,
  modeLabel,
  categoryLabel,
  onCancel,
  onReadyToStart,
}: MatchmakingOverlayProps) {
  const phase = opponent ? 'found' : 'searching'
  const [countdown, setCountdown] = useState<number>(3)

  // Manage countdown timer safely without triggering setState during render
  useEffect(() => {
    if (!open || !opponent) {
      setCountdown(3)
      return
    }

    if (countdown === 0) {
      const startTimer = setTimeout(() => {
        onReadyToStart()
      }, 50)
      return () => clearTimeout(startTimer)
    }

    const stepTimer = setTimeout(() => {
      setCountdown((c) => Math.max(0, c - 1))
    }, 1000)

    return () => clearTimeout(stepTimer)
  }, [open, opponent, countdown, onReadyToStart])

  if (!open) return null

  const userRank = getRank(user.rating)
  const oppRank = opponent ? getRank(opponent.rating) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 text-white">
      {/* Background glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-brand-500/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-gold-500/20 blur-3xl pointer-events-none" />

      {/* Cancel button in searching phase */}
      {phase === 'searching' && (
        <button
          onClick={onCancel}
          className="absolute top-6 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Cancel matchmaking"
        >
          <X size={20} />
        </button>
      )}

      <AnimatePresence mode="wait">
        {phase === 'searching' ? (
          <motion.div
            key="searching"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center text-center gap-6 max-w-sm w-full"
          >
            {/* Animated Radar Pulse */}
            <div className="relative flex items-center justify-center h-44 w-44">
              <motion.div
                animate={{ scale: [1, 1.8, 2.2], opacity: [0.7, 0.3, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
                className="absolute inset-0 rounded-full border-2 border-brand-400/60"
              />
              <motion.div
                animate={{ scale: [1, 1.5, 1.8], opacity: [0.8, 0.4, 0] }}
                transition={{ duration: 2.2, delay: 0.7, repeat: Infinity, ease: 'easeOut' }}
                className="absolute inset-4 rounded-full border-2 border-gold-400/60"
              />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-800 shadow-2xl shadow-brand-500/50 border border-white/20">
                <Swords size={38} className="text-white animate-pulse" />
              </div>
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider mb-2">
                {modeLabel} · {categoryLabel}
              </span>
              <h2 className="text-2xl font-extrabold font-[var(--font-display)]">Finding Opponent…</h2>
              <p className="text-sm text-neutral-300 mt-1">
                Searching near rating {user.rating} ({userRank.name})
              </p>
            </div>

            {/* User identity card */}
            <div className="flex items-center gap-3.5 bg-white/10 border border-white/15 rounded-2xl p-3.5 w-full">
              <Avatar initials={user.avatarKey || user.name.slice(0, 2).toUpperCase()} size={44} />
              <div className="flex-1 text-left min-w-0">
                <p className="font-bold text-sm truncate">{user.name}</p>
                <p className="text-xs text-neutral-300 truncate">{user.college || 'Medical Student'}</p>
              </div>
              <div className="text-right">
                <p className="font-extrabold text-sm">{user.rating}</p>
                <p className="text-[10px] text-brand-300 font-semibold">{userRank.name}</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="found"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex flex-col items-center text-center gap-6 max-w-md w-full"
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex items-center gap-2 rounded-full bg-gold-500/20 border border-gold-400/40 px-4 py-1.5 text-xs font-bold text-gold-300"
            >
              <Sparkles size={14} /> MATCH FOUND!
            </motion.div>

            {/* VS Card */}
            <div className="grid grid-cols-2 gap-4 w-full relative">
              {/* User Side */}
              <div className="flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-brand-950/70 border border-brand-500/40 text-center">
                <Avatar initials={user.avatarKey || user.name.slice(0, 2).toUpperCase()} size={56} />
                <div className="w-full">
                  <p className="font-bold text-sm truncate">{user.name}</p>
                  <p className="text-[11px] text-neutral-300 truncate">{user.college || 'Player 1'}</p>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <RankBadge tier={userRank} size={32} />
                  <span className="text-xs font-extrabold">{user.rating}</span>
                </div>
              </div>

              {/* VS Badge */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-gold-500 to-amber-600 font-extrabold text-black shadow-lg shadow-gold-500/40 z-10 text-xs">
                VS
              </div>

              {/* Opponent Side */}
              {opponent && oppRank && (
                <div className="flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-neutral-900/80 border border-neutral-700 text-center">
                  <Avatar initials={opponent.avatarKey || opponent.name.slice(0, 2).toUpperCase()} size={56} />
                  <div className="w-full">
                    <p className="font-bold text-sm truncate">{opponent.name}</p>
                    <p className="text-[11px] text-neutral-300 truncate">{opponent.college || 'Opponent'}</p>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <RankBadge tier={oppRank} size={32} />
                    <span className="text-xs font-extrabold">{opponent.rating}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Countdown */}
            <div className="flex flex-col items-center gap-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-300">Battle Starting in</p>
              <motion.span
                key={countdown}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-5xl font-black font-[var(--font-display)] text-gold-400"
              >
                {countdown}
              </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
