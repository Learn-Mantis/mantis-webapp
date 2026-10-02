'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BookmarkPlus, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ListRow } from '@/components/ui/ListRow'
import { RatingDelta } from '@/components/ui/Feedback'
import { Sheet } from '@/components/ui/Sheet'
import { StatTile } from '@/components/ui/StatTile'
import { Explanation, MCQOption, type OptionState } from '@/components/ui/Quiz'
import { StickyFooter } from '@/components/layout/TopBar'
import { RankBadge } from '@/components/battle/RankBadge'
import { BotAvatar, battleTag } from '@/components/battle/BattleRun'
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

export function ResultIcon({ ok }: { ok: boolean | null | undefined }) {
  if (ok == null) return <span className="h-[22px] w-[22px] rounded-md bg-sunken" />
  return (
    <span
      className={cn(
        'flex h-[22px] w-[22px] items-center justify-center rounded-md',
        ok ? 'bg-correct text-on-correct' : 'bg-incorrect text-on-incorrect',
      )}
    >
      {ok ? <Check size={14} strokeWidth={2.5} /> : <X size={14} strokeWidth={2.5} />}
    </span>
  )
}

function avgSeconds(items: ReviewItem[], who: 'mine' | 'theirs'): string {
  const answered = items.map((i) => i[who]).filter((a) => a && a.selected)
  if (!answered.length) return '–'
  return (answered.reduce((s, a) => s + (a?.response_ms ?? 0), 0) / answered.length / 1000).toFixed(1)
}

export function BattleRunResults({ battleId, initialState, onExit, onPlayAgain }: Props) {
  const { isGuest } = useUser()
  const [state, setState] = useState<BattleState>(initialState)
  const [review, setReview] = useState<ReviewItem[] | null>(null)
  const [open, setOpen] = useState<ReviewItem | null>(null)
  const [saved, setSaved] = useState<Record<number, boolean>>({})
  const addFromMistake = useFlashcardStore((s) => s.addFromMistake)

  const waiting = state.kind === 'live' && state.status !== 'finished'

  useEffect(() => {
    let stopped = false
    battleApi.state(battleId).then((s) => !stopped && setState(s)).catch(() => {})
    battleApi
      .review(battleId)
      .then((r) => !stopped && setReview(r))
      .catch(() => !stopped && setReview([]))
    return () => {
      stopped = true
    }
  }, [battleId])

  // Live: wait for the opponent, then reload the review with their answers.
  useEffect(() => {
    if (!waiting) return
    const id = setInterval(() => {
      battleApi
        .state(battleId)
        .then((s) => {
          setState(s)
          if (s.status === 'finished') battleApi.review(battleId).then(setReview).catch(() => {})
        })
        .catch(() => {})
    }, 2500)
    return () => clearInterval(id)
  }, [waiting, battleId])

  const isHost = state.kind === 'challenge' && state.me.role === 'host'
  const isChallenger = state.kind === 'challenge' && state.me.role === 'challenger'
  const opponent =
    state.kind === 'live'
      ? state.players.find((p) => !p.me)
      : isChallenger
        ? state.players.find((p) => p.role === 'host')
        : null
  const oppName = state.kind === 'bot' ? `${state.bot?.username ?? ''} bot` : opponent?.username ?? ''
  const oppScore = state.kind === 'bot' ? state.bot?.score ?? 0 : opponent?.score ?? 0
  const answered = state.me.answered
  const accuracy = answered ? Math.round((state.me.score / answered) * 100) : 0
  const delta = state.me.rating_delta ?? 0
  const outcome = state.me.outcome

  const title = useMemo(() => {
    if (waiting) return `Waiting for ${oppName}`
    if (isHost) return 'Send this to a friend'
    if (isChallenger) {
      if (outcome === 'win') return `You beat ${oppName}`
      if (outcome === 'loss') return `${oppName} wins`
      return 'Dead even'
    }
    if (state.kind === 'bot') {
      if (outcome === 'win') return 'You beat the bot'
      if (outcome === 'loss') return 'The bot wins this one'
      return 'Draw'
    }
    return outcome === 'win' ? 'You won' : outcome === 'loss' ? 'You lost' : 'Draw'
  }, [waiting, isHost, isChallenger, outcome, oppName, state.kind])

  function saveMistake(item: ReviewItem) {
    addFromMistake({
      question: item.question,
      correctAnswer: `${item.correct_option}. ${item.options[item.correct_option]}`,
      explanation: item.explanation ?? undefined,
      subject: item.subject,
    })
    setSaved((s) => ({ ...s, [item.index]: true }))
    toast.success('Saved to mistake notebook')
  }

  const meta = `${categoryLabel(state.category_id)} · ${BATTLE_MODES[state.mode].label}${
    state.kind === 'bot' ? ' · Practice' : state.rated ? '' : ' · Friendly'
  }`

  return (
    <div className="flex flex-col gap-4 pt-8">
      {/* Outcome */}
      <div className="flex flex-col items-center gap-2.5 text-center">
        <p className="text-sm text-fg-3">{meta}</p>
        <h1 className="text-[34px] leading-10 font-semibold tracking-[-0.02em] [text-wrap:balance]">{title}</h1>

        {isHost ? (
          <p className="text-[15px] text-fg-3">
            You scored <span className="num text-fg">{state.me.score}</span>
            {state.total_questions ? ` of ${state.total_questions}` : ''}. Friends play the same questions.
          </p>
        ) : (
          <>
            <div className="mt-2 flex items-center gap-4">
              <Avatar name={state.players.find((p) => p.me)?.username ?? 'You'} size={40} />
              <span className="num text-[34px] leading-10 tracking-[-0.03em]">
                {state.me.score}
                <span className="mx-2.5 text-fg-4">–</span>
                {waiting ? '…' : oppScore}
              </span>
              {state.kind === 'bot' ? <BotAvatar size={40} /> : <Avatar name={oppName || '?'} size={40} />}
            </div>
            <p className="text-[13px] text-fg-3">
              vs {oppName}
              {waiting && opponent && !opponent.finished ? ` · on question ${opponent.answered + 1}` : ''}
            </p>
          </>
        )}
      </div>

      {isHost && <ChallengeLinksPanel battleId={battleId} expiresAt={state.link_expires_at} rated={state.rated} questionCount={state.total_questions} />}

      {/* Rating */}
      {state.rated && !waiting && state.me.rating_delta !== null && (
        <Card className="flex items-center justify-between p-4">
          <div>
            <p className="mb-1 text-[13px] text-fg-3">Rating</p>
            <p className="num text-[21px]">{(state.me.rating_before + delta).toLocaleString('en-IN')}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <RatingDelta value={delta} size="lg" />
            <RankBadge rating={state.me.rating_before + delta} />
          </div>
        </Card>
      )}
      {!state.rated && state.kind !== 'bot' && !isHost && <p className="text-center text-[13px] text-fg-3">{battleTag(state)} · ratings unchanged</p>}

      {/* Challenger comparison / stats */}
      {isChallenger && review ? (
        <Card className="p-5">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-line pb-2.5 text-center">
            <span className="text-[13px] text-fg-2">You</span>
            <span />
            <span className="truncate text-[13px] text-fg-2">{oppName}</span>
          </div>
          {[
            ['Correct', `${state.me.score}/${answered}`, `${oppScore}/${opponent?.answered ?? 0}`],
            ['Accuracy', `${accuracy}%`, `${opponent?.answered ? Math.round((oppScore / opponent.answered) * 100) : 0}%`],
            ['Avg time', `${avgSeconds(review, 'mine')}s`, `${avgSeconds(review, 'theirs')}s`],
          ].map(([label, a, b]) => (
            <div key={label} className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-line py-2.5 text-center">
              <span className="num text-[15px]">{a}</span>
              <span className="text-xs text-fg-3">{label}</span>
              <span className="num text-[15px]">{b}</span>
            </div>
          ))}
        </Card>
      ) : (
        !isHost && (
          <div className="grid grid-cols-2 gap-2.5">
            <StatTile label="Accuracy" value={accuracy} unit="%" />
            <StatTile label="Avg time" value={review ? avgSeconds(review, 'mine') : '–'} unit="s" />
          </div>
        )
      )}

      {isGuest && (
        <Card tone="sunken" className="flex items-center justify-between gap-3 p-4">
          <p className="text-sm text-fg-2">Sign up to keep your rating and battles.</p>
          <Link href="/signup" className="shrink-0 hover:no-underline">
            <Button size="sm">Sign up</Button>
          </Link>
        </Card>
      )}

      {/* Questions */}
      <h2 className="mt-2 text-[15px] font-semibold">Questions</h2>
      {review === null ? (
        <p className="text-sm text-fg-3">Loading…</p>
      ) : (
        <Card className="overflow-hidden p-0">
          {(state.kind !== 'challenge' || isChallenger) && (
            <div className="flex justify-end gap-3.5 px-4 pt-2.5 text-xs text-fg-3">
              <span className="w-[22px] text-center">You</span>
              <span className="w-[22px] text-center">{state.kind === 'bot' ? 'Bot' : 'Opp'}</span>
            </div>
          )}
          {review.map((item, i) => (
            <ListRow
              key={item.index}
              divider={i < review.length - 1}
              title={`${item.index + 1}. ${subjectName(item.subject)}`}
              subtitle={item.question}
              onClick={() => setOpen(item)}
              trailing={
                <span className="flex gap-3.5">
                  <ResultIcon ok={item.mine ? item.mine.correct : null} />
                  {(state.kind !== 'challenge' || isChallenger) && <ResultIcon ok={item.theirs ? item.theirs.correct : null} />}
                </span>
              }
            />
          ))}
        </Card>
      )}

      <StickyFooter>
        {onPlayAgain && !waiting && !isHost && (
          <Button size="lg" fullWidth onClick={() => onPlayAgain(state)}>
            Play again
          </Button>
        )}
        <Button variant="ghost" fullWidth onClick={onExit}>
          Done
        </Button>
      </StickyFooter>

      <Sheet open={open !== null} onClose={() => setOpen(null)} title={open ? `Question ${open.index + 1}` : ''}>
        {open && <ReviewDetail item={open} saved={Boolean(saved[open.index])} onSave={() => saveMistake(open)} />}
      </Sheet>
    </div>
  )
}

function ReviewDetail({ item, saved, onSave }: { item: ReviewItem; saved: boolean; onSave: () => void }) {
  const stateFor = (o: 'A' | 'B' | 'C' | 'D'): OptionState =>
    o === item.correct_option ? 'correct' : o === item.mine?.selected ? 'incorrect' : 'dimmed'
  return (
    <div className="flex flex-col gap-4 pb-2">
      <p className="text-[17px] leading-[27px] text-fg">{item.question}</p>
      <div className="flex flex-col gap-2">
        {(['A', 'B', 'C', 'D'] as const).map((o) => (
          <MCQOption
            key={o}
            letter={o}
            state={stateFor(o)}
            note={item.mine?.selected === o ? 'You' : item.theirs?.selected === o ? 'Them' : undefined}
          >
            {item.options[o]}
          </MCQOption>
        ))}
      </div>
      {item.mine && !item.mine.selected && <p className="text-sm text-fg-3">Not answered</p>}
      {item.explanation && (
        <Explanation answerLetter={item.correct_option} answerText={item.options[item.correct_option]}>
          {item.explanation}
        </Explanation>
      )}
      {!item.mine?.correct && (
        <Button variant="secondary" disabled={saved} onClick={onSave}>
          {saved ? <Check size={16} /> : <BookmarkPlus size={16} />}
          {saved ? 'Saved' : 'Save to mistake notebook'}
        </Button>
      )}
    </div>
  )
}
