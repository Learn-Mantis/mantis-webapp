'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Copy, Link2, Lock, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { IconButton } from '@/components/ui/IconButton'
import { ListRow } from '@/components/ui/ListRow'
import { battleApi, challengeUrl, BattleApiError, type ChallengeLink } from '@/features/battle/api'

function hoursLeft(iso: string | null, now: number): string {
  if (!iso || !now) return ''
  const ms = Date.parse(iso) - now
  if (ms <= 0) return 'expired'
  const h = Math.floor(ms / 3_600_000)
  return h >= 1 ? `expires in ${h}h` : `expires in ${Math.max(1, Math.floor(ms / 60_000))}m`
}

function shareText(url: string, rated: boolean) {
  return `Can you beat my score on Mantis? ${rated ? 'Ranked' : 'Friendly'} challenge. This link works once: ${url}`
}

/**
 * Host's share panel. Each link is single-use, so the panel always offers one
 * unplayed link and makes a fresh one once a friend has used it.
 */
export function ChallengeLinksPanel({
  battleId,
  expiresAt,
  rated,
  questionCount,
}: {
  battleId: string
  expiresAt: string | null
  rated: boolean
  questionCount: number | null
}) {
  const [links, setLinks] = useState<ChallengeLink[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(0)
  const autoCreated = useRef(false)

  const load = useCallback(
    () =>
      battleApi
        .listLinks(battleId)
        .then((l) => {
          setLinks(l)
          return l
        })
        .catch(() => {
          setLinks([])
          return [] as ChallengeLink[]
        })
        .finally(() => setNow(Date.now())),
    [battleId],
  )

  const expired = Boolean(expiresAt && now && Date.parse(expiresAt) <= now)

  const create = useCallback(async () => {
    setBusy(true)
    try {
      await battleApi.createLinks(battleId, 1)
      await load()
    } catch (e) {
      toast.error(e instanceof BattleApiError ? e.message : 'Could not create a link')
    } finally {
      setBusy(false)
    }
  }, [battleId, load])

  // Make sure there is always one unplayed link ready to send.
  useEffect(() => {
    load().then((l) => {
      if (autoCreated.current || l.some((x) => !x.claimed) || l.length >= 20) return
      autoCreated.current = true
      create()
    })
    const id = setInterval(load, 15000)
    return () => clearInterval(id)
  }, [load, create])

  const current = links?.find((l) => !l.claimed) ?? null
  const url = current ? challengeUrl(current.token) : ''
  const played = links?.filter((l) => l.claimed) ?? []

  function copy() {
    if (!url) return
    navigator.clipboard.writeText(url).then(() => toast.success('Link copied'))
  }

  function whatsapp() {
    if (!url) return
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText(url, rated))}`, '_blank', 'noopener')
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-center text-[15px] text-fg-3">
        They play the same {questionCount ? `${questionCount} ` : ''}questions. Their score is compared with yours.
      </p>

      {!expired && (
        <Card className="flex items-center gap-3 p-4">
          <Link2 size={18} strokeWidth={1.75} className="shrink-0 text-fg-3" />
          <span className="num min-w-0 flex-1 truncate text-sm text-fg">{url ? url.replace(/^https?:\/\//, '') : 'Creating link…'}</span>
          <IconButton label="Copy link" size="sm" onClick={copy} disabled={!url}>
            <Copy size={18} strokeWidth={1.75} />
          </IconButton>
        </Card>
      )}

      <p className="flex items-center justify-center gap-1.5 text-[13px] text-fg-3">
        <Lock size={14} strokeWidth={1.75} />
        {expired ? 'This challenge has expired' : `Plays once · ${hoursLeft(expiresAt, now)} · ${rated ? 'Ranked' : 'Friendly'}`}
      </p>

      {!expired && (
        <div className="flex flex-col gap-2">
          <Button size="lg" fullWidth onClick={whatsapp} disabled={!url}>
            <MessageCircle size={20} strokeWidth={1.75} /> Share on WhatsApp
          </Button>
          <Button variant="secondary" fullWidth onClick={copy} disabled={!url}>
            Copy link
          </Button>
          {played.length > 0 && (
            <Button variant="ghost" fullWidth disabled={busy} onClick={create}>
              New link for another friend
            </Button>
          )}
        </div>
      )}

      {played.length > 0 && (
        <Card className="overflow-hidden p-0">
          {played.map((l, i) => (
            <ListRow
              key={l.token}
              divider={i < played.length - 1}
              leading={<Avatar name={l.player?.username ?? '?'} size={32} />}
              title={l.player?.username ?? 'Someone'}
              subtitle={!l.finished ? 'Playing…' : l.outcome === 'win' ? 'Beat you' : l.outcome === 'loss' ? 'You won' : 'Draw'}
              trailing={<span className="num text-[15px] text-fg">{l.finished ? l.score : '…'}</span>}
            />
          ))}
        </Card>
      )}
    </div>
  )
}
