'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, BookmarkPlus, Check, Bot as BotIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { ChallengeLinksPanel } from '@/components/battle/ChallengeLinksPanel'
import { battleApi, type BattleState, type ReviewItem } from '@/features/battle/api'
import { useUser } from '@/features/auth/user-provider'
import { useFlashcardStore } from '@/stores/flashcards'
import { BATTLE_MODES } from '@/lib/config/battle-modes'
import { categoryLabel, subjectName } from '@/lib/config/subjects'
import { cn } from '@/lib/utils'

interface Props {
  battleId: string
  initialState: BattleState
  onExit: () => void
  onPlayAgain?: (state: BattleState) => void
}

const OUTCOME_TITLE = { win: 'You won', loss: 'You lost', draw: 'Draw' } as const

export function BattleRunResults({ battleId, initialState, onExit, onPlayAgain }: Props) {
  const { isGuest } = useUser()
  const [state, setState] = useState<BattleState>(initialState)
  const [review, setReview] = useState<ReviewItem[] | null>(null)
  const [open, setOpen] = useState<number | null>(null)
  const [saved, setSaved] = useState<Record<number, boolean>>({})
  const addFromMistake = useFlashcardStore((s) => s.addFromMistake)

  // Settled state + review. Live battles wait for the opponent to finish.
  const waitingForOpponent = state.kind === 'live' && state.status !== 'finished'
  useEffect(() => {
    let stopped = false
    const load = () =>
      battleApi
        .state(battleId)
        .then((s) => !stopped && setState(s))
        .catch(() => {})
    load()
    battleApi
      .review(battleId)
      .then((r) => !stopped && setReview(r))
      .catch(() => !stopped && setReview([]))
    return () => {
      stopped = true
    }
  }, [battleId])

  useEffect(() => {
    if (!waitingForOpponent) return
    const id = setInterval(() => {
      battleApi.state(battleId).then(setState).catch(() => {})
    }, 2500)
    return () => clearInterval(id)
  }, [waitingForOpponent, battleId])

  // Review shows the opponent's answers once both are done.
  useEffect(() => {
    if (state.kind === 'live' && state.status === 'finished') {
      battleApi.review(battleId).then(setReview).catch(() => {})
    }
  }, [state.kind, state.status, battleId])

  const isHost = state.kind === 'challenge' && state.me.role === 'host'
  const delta = state.me.rating_delta
  const answered = state.me.answered
  const accuracy = answered ? Math.round((state.me.score / answered) * 100) : 0

  let title: string
  if (waitingForOpponent) title = 'Waiting for your opponent…'
  else if (isHost) title = `You scored ${state.me.score}`
  else if (state.me.outcome) title = OUTCOME_TITLE[state.me.outcome]
  else title = `You scored ${state.me.score}`

  function saveMistake(item: ReviewItem) {
    addFromMistake({
      question: item.question,
      correctAnswer: `${item.correct_option}. ${item.options[item.correct_option]}`,
      explanation: item.explanation ?? undefined,
      subject: item.subject,
    })
    setSaved((s) => ({ ...s, [item.index]: true }))
    toast.success('Saved to your Mistakes deck')
  }

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto w-full py-2">
      {/* Outcome */}
      <Card className="p-6 flex flex-col items-center text-center gap-2">
        <p className="text-xs text-neutral-500">
          {BATTLE_MODES[state.mode].label} · {categoryLabel(state.category_id)}
        </p>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-neutral-500">
          {state.me.score} correct of {answered} answered · {accuracy}% accuracy
        </p>
        {state.rated && delta !== null && !waitingForOpponent && (
          <p className={cn('text-sm font-semibold', delta >= 0 ? 'text-brand-600' : 'text-danger-500')}>
            Rating {delta >= 0 ? '+' : ''}
            {delta}
          </p>
        )}
        {!state.rated && state.kind !== 'bot' && (
          <p className="text-xs text-neutral-400">Friendly — ratings unchanged</p>
        )}
        {state.kind === 'bot' && <p className="text-xs text-neutral-400">Practice — ratings unchanged</p>}
      </Card>

      {/* Scoreboard */}
      <Card className="p-2">
        {state.kind === 'bot' && state.bot ? (
          <>
            <ScoreRow name={state.players[0]?.username ?? 'You'} score={state.me.score} highlight />
            <ScoreRow name={`${state.bot.username} · Bot`} score={state.bot.score} bot />
          </>
        ) : (
          state.players.map((p) => (
            <ScoreRow
              key={p.username}
              name={p.username + (p.role === 'host' && state.kind === 'challenge' ? ' (challenge creator)' : '')}
              score={p.score}
              highlight={p.me}
              note={!p.finished ? 'Playing…' : undefined}
            />
          ))
        )}
      </Card>

      {isHost && <ChallengeLinksPanel battleId={battleId} expiresAt={state.link_expires_at} rated={state.rated} />}

      {isGuest && (
        <Card className="p-4 flex items-center justify-between gap-3">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            You&rsquo;re playing as a guest. Sign up to keep your rating and battle history.
          </p>
          <Link href="/signup" className="shrink-0">
            <Button size="sm">Sign up</Button>
          </Link>
        </Card>
      )}

      {/* Review */}
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Review</h2>
        {review === null && <p className="text-sm text-neutral-500">Loading questions…</p>}
        {review?.map((item) => {
          const mine = item.mine
          const isOpen = open === item.index
          return (
            <Card key={item.index} className="p-0 overflow-hidden">
              <button
                onClick={() => setOpen(isOpen ? null : item.index)}
                className="w-full flex items-start gap-3 p-3.5 text-left"
              >
                <span
                  className={cn(
                    'mt-1 h-2.5 w-2.5 shrink-0 rounded-full',
                    mine?.correct ? 'bg-brand-500' : mine ? 'bg-danger-500' : 'bg-neutral-300',
                  )}
                />
                <span className="flex-1 text-sm leading-snug line-clamp-2">{item.question}</span>
                {isOpen ? <ChevronUp size={16} className="shrink-0 mt-0.5" /> : <ChevronDown size={16} className="shrink-0 mt-0.5" />}
              </button>
              {isOpen && (
                <div className="px-3.5 pb-4 flex flex-col gap-3 text-sm">
                  <p className="leading-relaxed">{item.question}</p>
                  <ul className="flex flex-col gap-1.5">
                    {(['A', 'B', 'C', 'D'] as const).map((o) => (
                      <li
                        key={o}
                        className={cn(
                          'rounded-xl px-3 py-2 border border-neutral-200 dark:border-neutral-800',
                          o === item.correct_option && 'border-brand-500 bg-brand-500/10',
                          mine?.selected === o && o !== item.correct_option && 'border-danger-500 bg-danger-500/10',
                        )}
                      >
                        <span className="font-semibold mr-2">{o}</span>
                        {item.options[o]}
                        {mine?.selected === o && <span className="ml-2 text-xs text-neutral-500">(you)</span>}
                        {item.theirs?.selected === o && (
                          <span className="ml-2 text-xs text-neutral-500">
                            ({state.kind === 'bot' ? 'bot' : state.kind === 'challenge' ? 'creator' : 'opponent'})
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-neutral-500">
                    {subjectName(item.subject)}
                    {mine ? ` · ${(mine.response_ms / 1000).toFixed(1)}s` : ''}
                    {!mine?.selected && mine ? ' · not answered' : ''}
                  </p>
                  {item.explanation && (
                    <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">{item.explanation}</p>
                  )}
                  {!mine?.correct && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="self-start"
                      disabled={saved[item.index]}
                      onClick={() => saveMistake(item)}
                    >
                      {saved[item.index] ? <Check size={14} /> : <BookmarkPlus size={14} />}
                      {saved[item.index] ? 'Saved' : 'Save to flashcards'}
                    </Button>
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <div className="flex gap-3">
        {onPlayAgain && !waitingForOpponent && (
          <Button className="flex-1" onClick={() => onPlayAgain(state)}>
            Play again
          </Button>
        )}
        <Button variant="secondary" className="flex-1" onClick={onExit}>
          Back
        </Button>
      </div>
    </div>
  )
}

function ScoreRow({
  name,
  score,
  highlight,
  bot,
  note,
}: {
  name: string
  score: number
  highlight?: boolean
  bot?: boolean
  note?: string
}) {
  return (
    <div className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5', highlight && 'bg-neutral-50 dark:bg-neutral-800/50')}>
      {bot ? (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
          <BotIcon size={16} />
        </div>
      ) : (
        <Avatar initials={name.replace(/^Guest-/, '').slice(0, 2).toUpperCase()} size={32} />
      )}
      <p className="flex-1 text-sm truncate">
        {name}
        {highlight && <span className="text-neutral-400"> · you</span>}
      </p>
      {note && <span className="text-xs text-neutral-400">{note}</span>}
      <p className="text-base font-semibold tabular-nums">{score}</p>
    </div>
  )
}
