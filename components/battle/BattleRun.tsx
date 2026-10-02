'use client'

import { useState } from 'react'
import { Bot as BotIcon, Check, Flag } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/Dialog'
import { EmptyState, Timer } from '@/components/ui/Feedback'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { MCQOption, type OptionState } from '@/components/ui/Quiz'
import { TopBar } from '@/components/layout/TopBar'
import { BattleRunResults } from '@/components/battle/BattleRunResults'
import { useBattleRun } from '@/features/battle/use-battle-run'
import type { BattleState, Option } from '@/features/battle/api'
import { BATTLE_MODES } from '@/lib/config/battle-modes'
import { categoryLabel, subjectName } from '@/lib/config/subjects'
import { cn } from '@/lib/utils'

const OPTIONS: Option[] = ['A', 'B', 'C', 'D']

export function battleTag(state: Pick<BattleState, 'kind' | 'rated'>): string {
  if (state.kind === 'bot') return 'Practice'
  if (state.kind === 'challenge') return state.rated ? 'Ranked challenge' : 'Friendly challenge'
  return state.rated ? 'Ranked' : 'Friendly'
}

export function BotAvatar({ size = 36 }: { size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-sunken text-fg-2"
      style={{ width: size, height: size }}
    >
      <BotIcon size={Math.round(size * 0.5)} strokeWidth={1.75} />
    </div>
  )
}

function PlayerScore({
  name,
  avatarName,
  score,
  bot,
  done,
  note,
  align = 'left',
}: {
  name: string
  /** Name the avatar initials come from (defaults to `name`). */
  avatarName?: string
  score: number | null
  bot?: boolean
  done?: boolean
  note?: string
  align?: 'left' | 'right'
}) {
  return (
    <div className={cn('flex min-w-0 flex-1 items-center gap-2.5', align === 'right' && 'flex-row-reverse text-right')}>
      {bot ? <BotAvatar /> : <Avatar name={avatarName ?? name} size={36} />}
      <div className="min-w-0">
        <p className={cn('flex items-center gap-1 text-[13px] text-fg-2', align === 'right' && 'justify-end')}>
          <span className="truncate">{name}</span>
          {done && <Check size={13} strokeWidth={2.5} className="shrink-0 text-on-correct" />}
        </p>
        <p className="num text-[21px] leading-[26px] text-fg">{score ?? '–'}</p>
        {note && <p className="text-[11px] text-fg-3">{note}</p>}
      </div>
    </div>
  )
}

interface BattleRunProps {
  battleId: string
  onExit: () => void
  onPlayAgain?: (state: BattleState) => void
}

export function BattleRun({ battleId, onExit, onPlayAgain }: BattleRunProps) {
  const run = useBattleRun(battleId)
  const { phase, state, question, selected, verdict } = run
  const [leaving, setLeaving] = useState(false)
  // Per-question results seen this session (for the progress segments).
  const [mine, setMine] = useState<Record<number, boolean>>({})
  const [theirs, setTheirs] = useState<Record<number, boolean>>({})
  const [recorded, setRecorded] = useState<number | null>(null)

  // Record each verdict once, when it arrives (state derived during render).
  if (verdict && question && recorded !== question.index) {
    setRecorded(question.index)
    setMine((m) => ({ ...m, [question.index]: verdict.correct }))
    if (verdict.bot) setTheirs((t) => ({ ...t, [question.index]: Boolean(verdict.bot?.correct) }))
  }

  if (phase === 'error') {
    return (
      <EmptyState
        icon={<Flag size={24} strokeWidth={1.75} />}
        title="This battle can’t be opened"
        body={run.error ?? undefined}
        action={
          <Button variant="secondary" onClick={onExit}>
            Back to battle
          </Button>
        }
      />
    )
  }

  if (phase === 'loading' || !state) {
    return <p className="mt-24 text-center text-sm text-fg-3">Loading battle…</p>
  }

  if (phase === 'finished') {
    return <BattleRunResults battleId={battleId} initialState={state} onExit={onExit} onPlayAgain={onPlayAgain} />
  }

  const mode = BATTLE_MODES[state.mode]
  const opponent = state.kind === 'live' ? state.players.find((p) => !p.me) : null
  const index = question?.index ?? state.me.index
  const total = state.total_questions
  const revealed = phase === 'revealing' && verdict !== null

  const segments = (results: Record<number, boolean>) =>
    total
      ? Array.from({ length: total }, (_, i) =>
          i in results ? (results[i] ? 'correct' : 'incorrect') : i === index ? 'current' : i < index ? 'skipped' : 'pending',
        )
      : undefined

  function optionState(opt: Option): OptionState {
    if (revealed && verdict) {
      if (opt === verdict.correctOption) return 'correct'
      if (opt === verdict.selected) return 'incorrect'
      return 'dimmed'
    }
    return selected === opt ? 'selected' : 'idle'
  }

  const clock =
    state.mode === 'blitz' && run.perQuestionLeft !== null ? (
      <Timer variant="ring" seconds={run.perQuestionLeft / 1000} total={state.per_q_sec ?? 20} warnAt={5} />
    ) : state.mode === 'rapid' && run.overallLeft !== null ? (
      <Timer seconds={run.overallLeft / 1000} warnAt={30} />
    ) : null

  return (
    <div className="flex flex-col">
      <TopBar
        backIcon="x"
        onBack={() => setLeaving(true)}
        title={`${categoryLabel(state.category_id)} · ${mode.label}`}
        subtitle={total ? `${index + 1} of ${total}` : `Question ${index + 1}`}
        center
      />

      <div className="flex items-center gap-3 pb-3 pt-1">
        <PlayerScore
          name="You"
          avatarName={state.players.find((p) => p.me)?.username}
          score={state.me.score}
          done={revealed}
        />
        {clock}
        {state.kind === 'bot' && state.bot ? (
          <PlayerScore
            name={`${state.bot.username} bot`}
            bot
            score={state.bot.score}
            done={revealed || run.botLockedIn}
            align="right"
          />
        ) : opponent ? (
          <PlayerScore
            name={opponent.username}
            score={opponent.score}
            done={opponent.finished}
            note={opponent.finished ? 'Finished' : `On ${opponent.answered + 1}`}
            align="right"
          />
        ) : state.kind === 'challenge' && state.me.role === 'challenger' ? (
          <PlayerScore
            name={state.players.find((p) => p.role === 'host')?.username ?? 'Challenger'}
            score={null}
            note="Score hidden"
            align="right"
          />
        ) : (
          <div className="flex-1 text-right text-[13px] text-fg-3">{battleTag(state)}</div>
        )}
      </div>

      {total && (
        <div className="flex flex-col gap-1.5 pb-4">
          <ProgressBar segments={segments(mine)} />
          {state.kind === 'bot' && <ProgressBar segments={segments(theirs)} />}
        </div>
      )}

      {question && (
        <div className="flex flex-col gap-4 pb-8">
          <p className="text-[13px] text-fg-3">{subjectName(question.subject)}</p>
          <p className="text-[17px] leading-[27px] text-fg [text-wrap:pretty]">{question.question}</p>
          <div className="flex flex-col gap-2">
            {OPTIONS.map((opt) => (
              <MCQOption
                // Keyed per question so a new question never inherits the last reveal's fade.
                key={`${question.index}-${opt}`}
                letter={opt}
                state={optionState(opt)}
                disabled={phase !== 'question'}
                onClick={() => run.answer(opt)}
              >
                {question.options[opt]}
              </MCQOption>
            ))}
          </div>
          <p className="min-h-[23px] text-sm text-fg-3">
            {revealed && verdict?.selected === null ? 'Time’s up' : run.error && phase === 'question' ? run.error : ''}
          </p>
        </div>
      )}

      <Dialog open={leaving} onClose={() => setLeaving(false)} showClose={false}>
        <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-sunken text-fg">
          <Flag size={22} strokeWidth={1.75} />
        </div>
        <DialogTitle>Leave this battle?</DialogTitle>
        <DialogDescription>
          {state.kind === 'bot'
            ? 'Your practice game ends here.'
            : 'Leaving counts as finished. Questions you haven’t answered score nothing.'}
        </DialogDescription>
        <DialogFooter>
          <Button fullWidth onClick={() => setLeaving(false)}>
            Keep playing
          </Button>
          <Button
            variant="ghost"
            fullWidth
            onClick={() => {
              setLeaving(false)
              run.leave()
            }}
          >
            Leave
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
