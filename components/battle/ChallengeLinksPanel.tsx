'use client'

import { useCallback, useEffect, useState } from 'react'
import { Copy, Share2, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { battleApi, challengeUrl, BattleApiError, type ChallengeLink } from '@/features/battle/api'
import { cn } from '@/lib/utils'

function timeLeft(iso: string | null, now: number): string {
  if (!iso || !now) return ''
  const ms = Date.parse(iso) - now
  if (ms <= 0) return 'Expired'
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`
}

async function shareLink(token: string, rated: boolean) {
  const url = challengeUrl(token)
  const text = `Can you beat my score on Mantis? ${rated ? 'Ranked' : 'Friendly'} challenge — this link works once.`
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Mantis challenge', text, url })
      return
    } catch {
      // cancelled — fall through to copy
    }
  }
  await navigator.clipboard.writeText(`${text} ${url}`)
  toast.success('Link copied')
}

/**
 * Host's control panel for a finished challenge: create single-use links (one
 * per friend), share/copy them, and see who has played.
 */
export function ChallengeLinksPanel({
  battleId,
  expiresAt,
  rated,
}: {
  battleId: string
  expiresAt: string | null
  rated: boolean
}) {
  const [links, setLinks] = useState<ChallengeLink[] | null>(null)
  const [creating, setCreating] = useState(false)
  const [now, setNow] = useState(0)

  const load = useCallback(() => {
    battleApi
      .listLinks(battleId)
      .then(setLinks)
      .catch(() => setLinks([]))
      .finally(() => setNow(Date.now()))
  }, [battleId])

  useEffect(() => {
    load()
    const id = setInterval(load, 15000)
    return () => clearInterval(id)
  }, [load])

  async function create(count: number) {
    setCreating(true)
    try {
      const res = await battleApi.createLinks(battleId, count)
      load()
      if (res.tokens.length === 1) await shareLink(res.tokens[0], rated)
      else toast.success(`${res.tokens.length} links created`)
    } catch (e) {
      toast.error(e instanceof BattleApiError ? e.message : 'Could not create links')
    } finally {
      setCreating(false)
    }
  }

  const expired = expiresAt && now ? Date.parse(expiresAt) <= now : false

  return (
    <Card className="p-4 flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-semibold">Challenge your friends</h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          Each link can be played by one person, once. They get the same questions you just answered.
          {expiresAt && now > 0 && ` ${timeLeft(expiresAt, now)}.`}
        </p>
      </div>

      {!expired && (
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" disabled={creating} onClick={() => create(1)}>
            <Link2 size={14} /> New link
          </Button>
          <Button size="sm" variant="secondary" disabled={creating} onClick={() => create(5)}>
            5 links
          </Button>
        </div>
      )}

      {links && links.length > 0 && (
        <ul className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-800">
          {links.map((l, i) => (
            <li key={l.token} className="flex items-center gap-3 py-2.5">
              <span className="text-xs text-neutral-400 w-5">#{i + 1}</span>
              <p className="flex-1 text-sm truncate">
                {l.player ? (
                  <>
                    {l.player.username}
                    <span className="text-neutral-400">
                      {l.finished ? ` · ${l.score}` : ' · playing…'}
                      {l.outcome === 'win' ? ' · beat you' : l.outcome === 'loss' ? ' · you won' : l.outcome === 'draw' ? ' · draw' : ''}
                    </span>
                  </>
                ) : (
                  <span className="text-neutral-500">Not played yet</span>
                )}
              </p>
              {!l.claimed && !expired && (
                <div className="flex gap-1">
                  <IconBtn label="Copy link" onClick={() => navigator.clipboard.writeText(challengeUrl(l.token)).then(() => toast.success('Link copied'))}>
                    <Copy size={14} />
                  </IconBtn>
                  <IconBtn label="Share link" onClick={() => shareLink(l.token, rated)}>
                    <Share2 size={14} />
                  </IconBtn>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500',
        'hover:bg-neutral-100 dark:hover:bg-neutral-800',
      )}
    >
      {children}
    </button>
  )
}
