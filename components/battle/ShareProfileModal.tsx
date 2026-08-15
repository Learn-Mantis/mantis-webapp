'use client'

import { useState } from 'react'
import { Share2, Copy, Check, MessageSquare, Trophy, Swords, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { RankBadge } from '@/components/battle/RankBadge'
import { getRank } from '@/lib/config/ranks'

interface ShareProfileModalProps {
  open: boolean
  onClose: () => void
  userName: string
  userRating: number
  userCollege?: string | null
  userBatch?: string | null
  gamesCount?: number
  winsCount?: number
}

export function ShareProfileModal({
  open,
  onClose,
  userName,
  userRating,
  userCollege,
  userBatch,
  gamesCount = 0,
  winsCount = 0,
}: ShareProfileModalProps) {
  const [copied, setCopied] = useState(false)
  const rank = getRank(userRating)
  const winRate = gamesCount > 0 ? Math.round((winsCount / gamesCount) * 100) : 100

  const shareText = `🩺 Challenge ${userName} on Mantis! Rating: ${userRating} Elo (${rank.name} Tier). Medical College: ${userCollege || 'India'}. Test your diagnostic speed: https://mantis-med.app`

  function handleCopy() {
    navigator.clipboard.writeText(shareText)
    setCopied(true)
    toast.success('Profile & challenge link copied to clipboard!')
    setTimeout(() => setCopied(false), 2500)
  }

  function handleWhatsAppShare() {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`
    window.open(url, '_blank')
  }

  return (
    <Sheet open={open} onClose={onClose} showClose className="sm:max-w-md">
      <div className="flex flex-col gap-4 text-center items-center">
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-bold uppercase tracking-wider mb-1.5">
            <Share2 size={13} /> Doctor Profile Card
          </div>
          <h2 className="text-2xl font-extrabold font-[var(--font-display)]">Share Your Profile</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Invite classmates and medical peers to 1v1 clinical battles.
          </p>
        </div>

        {/* Aesthetic Visual Doctor Card Preview */}
        <Card className="w-full p-6 relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 border-0 text-white shadow-xl shadow-brand-900/30 text-center flex flex-col items-center gap-3.5">
          <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10 blur-2xl" />

          <Avatar initials={userName.slice(0, 2).toUpperCase()} size={72} ring />

          <div>
            <h3 className="text-xl font-black font-[var(--font-display)]">{userName}</h3>
            <p className="text-xs text-brand-100 font-medium mt-0.5">
              {userCollege || 'Medical Doctor'} {userBatch ? `· ${userBatch}` : ''}
            </p>
          </div>

          <div className="flex items-center justify-center gap-6 border-t border-white/20 pt-3.5 w-full text-xs">
            <div>
              <p className="text-2xl font-black font-[var(--font-display)] leading-none">{userRating}</p>
              <p className="text-[10px] text-brand-100 font-bold uppercase mt-1">{rank.name} Elo</p>
            </div>
            <div className="h-7 w-px bg-white/20" />
            <div>
              <p className="text-2xl font-black font-[var(--font-display)] leading-none">{winRate}%</p>
              <p className="text-[10px] text-brand-100 font-bold uppercase mt-1">Win Rate</p>
            </div>
            <div className="h-7 w-px bg-white/20" />
            <div>
              <p className="text-2xl font-black font-[var(--font-display)] leading-none">{gamesCount}</p>
              <p className="text-[10px] text-brand-100 font-bold uppercase mt-1">Duels</p>
            </div>
          </div>

          <div className="w-full bg-white/10 rounded-xl py-1.5 px-3 text-[11px] font-bold text-brand-100 tracking-wide mt-1">
            ⚡ Powered by Mantis MedMCQA Battles
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          <Button size="lg" onClick={handleWhatsAppShare} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2">
            <MessageSquare size={18} /> Share on WhatsApp
          </Button>

          <Button size="lg" variant="secondary" onClick={handleCopy} className="w-full font-bold gap-2">
            {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
            {copied ? 'Link Copied!' : 'Copy Profile & Challenge Link'}
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
