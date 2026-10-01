'use client'

import { X, Bot as BotIcon, Check } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { BattleRunResults } from '@/components/battle/BattleRunResults'
import { useBattleRun } from '@/features/battle/use-battle-run'
import type { BattleState, Option } from '@/features/battle/api'
import { BATTLE_MODES } from '@/lib/config/battle-modes'
import { categoryLabel, subjectName } from '@/lib/config/subjects'
import { cn } from '@/lib/utils'

const OPTIONS: Option[] = ['A', 'B', 'C', 'D']

function mmss(ms: number): string {
  const total = Math.ceil(ms / 1000)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

function initials(name: string): string {
  return name.replace(/^Guest-/, '').slice(0, 2).toUpperCase()
}

export function battleTag(state: Pick<BattleState, 'kind' | 'rated'>): string {
  if (state.kind === 'bot') return 'Practice'
  if (state.kind === 'challenge') return state.rated ? 'Ranked challenge' : 'Friendly challenge'
  return state.rated ? 'Ranked' : 'Friendly'
}

interface BattleRunProps {
  battleId: string
  onExit: () => void
  onPlayAgain?: (state: BattleState) => void
}

export function BattleRun({ battleId, onExit, onPlayAgain }: BattleRunProps) {
  const run = useBattleRun(battleId)
  const { phase, state, question, selected, verdict } = run

  if (phase === 'error') {
    return (
      <Card className="p-6 flex flex-col items-center gap-4 text-center max-w-md mx-auto mt-10">
        <p className="font-semibold">{run.error ?? 'This battle could not be loaded.'}</p>
        <Button variant="secondary" onClick={onExit}>
          Back to Battle
        </Button>
      </Card>
    )
  }

  if (phase === 'loading' || !state) {
    return <p className="text-center text-sm text-neutral-500 mt-16">Loading battle…</p>
  }

  if (phase === 'finished') {
    return <BattleRunResults battleId={battleId} initialState={state} onExit={onExit} onPlayAgain={onPlayAgain} />
  }

  const mode = BATTLE_MODES[state.mode]
  const me = state.players.find((p) => p.me)
  const opponent = state.kind === 'live' ? state.players.find((p) => !p.me) : null
  const host = state.kind === 'challenge' && state.me.role === 'challenger' ? state.players.find((p) => p.role === 'host') : null
  const revealed = phase === 'revealing' && verdict

  function confirmLeave() {
    const msg =
      state?.kind === 'bot'
        ? 'Leave this practice game?'
        : 'Leave now? Your run ends here and unanswered questions count as not answered.'
    if (window.confirm(msg)) run.leave()
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full py-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
          {mode.label} · {categoryLabel(state.category_id)} · {battleTag(state)}
        </p>
        <button
          onClick={confirmLeave}
          className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          aria-label="Leave battle"
        >
          <X size={16} />
        </button>
      </div>

      {/* Scoreboard */}
      <Card className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Avatar initials={initials(me?.username ?? 'You')} size={36} />
          <div className="min-w-0">
            <p className="text-xs text-neutral-500 truncate">{me?.username ?? 'You'}</p>
            <p className="text-xl font-bold tabular-nums">{state.me.score}</p>
          </div>
        </div>

        <div className="text-center shrink-0">
          {state.mode === 'blitz' && run.perQuestionLeft !== null ? (
            <p className={cn('text-2xl font-bold tabular-nums', run.perQuestionLeft <= 5000 && 'text-danger-500')}>
              {Math.ceil(run.perQuestionLeft / 1000)}
            </p>
          ) : state.mode === 'rapid' && run.overallLeft !== null ? (
            <p className={cn('text-xl font-bold tabular-nums', run.overallLeft <= 30000 && 'text-danger-500')}>
              {mmss(run.overallLeft)}
            </p>
          ) : (
            <p className="text-sm font-semibold tabular-nums">
              {(question?.index ?? state.me.index) + 1}
              {state.total_questions ? ` / ${state.total_questions}` : ''}
            </p>
          )}
          <p className="text-[11px] text-neutral-500">
            {state.mode === 'rapid'
              ? `Question ${(question?.index ?? state.me.index) + 1}`
              : state.mode === 'blitz'
                ? `${(question?.index ?? state.me.index) + 1} / ${state.total_questions}`
                : 'No timer'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 min-w-0 flex-1 justify-end text-right">
          {state.kind === 'bot' && state.bot ? (
            <>
              <div className="min-w-0">
                <p className="text-xs text-neutral-500 truncate">{state.bot.username} · Bot</p>
                <div className="flex items-center justify-end gap-1.5">
                  <span className="text-[11px] text-neutral-400">
                    {revealed ? (verdict.bot?.correct ? 'Correct' : 'Wrong') : run.botLockedIn ? 'Answered' : 'Thinking'}
                  </span>
                  <p className="text-xl font-bold tabular-nums">
                    {state.bot.score}
                  </p>
                </div>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                <BotIcon size={18} />
              </div>
            </>
          ) : opponent ? (
            <>
              <div className="min-w-0">
                <p className="text-xs text-neutral-500 truncate">{opponent.username}</p>
                <div className="flex items-center justify-end gap-1.5">
                  <span className="text-[11px] text-neutral-400">
                    {opponent.finished ? 'Finished' : `Q${opponent.answered + 1}`}
                  </span>
                  <p className="text-xl font-bold tabular-nums">{opponent.score}</p>
                </div>
              </div>
              <Avatar initials={initials(opponent.username)} size={36} />
            </>
          ) : host ? (
            <>
              <div className="min-w-0">
                <p className="text-xs text-neutral-500 truncate">{host.username}&rsquo;s score</p>
                <p className="text-xl font-bold tabular-nums">{host.score}</p>
              </div>
              <Avatar initials={initials(host.username)} size={36} />
            </>
          ) : (
            <p className="text-xs text-neutral-500">Your challenge</p>
          )}
        </div>
      </Card>

      {/* Question */}
      {question && (
        <>
          <Card className="p-5 flex flex-col gap-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
              {subjectName(question.subject)}
            </p>
            <p className="text-base sm:text-lg leading-relaxed text-neutral-900 dark:text-neutral-100">
              {question.question}
            </p>
          </Card>

          <div className="flex flex-col gap-2.5">
            {OPTIONS.map((opt) => {
              const isSelected = selected === opt
              const isCorrect = revealed && verdict.correctOption === opt
              const isWrongPick = revealed && isSelected && !verdict.correct
              return (
                <button
                  key={opt}
                  disabled={phase !== 'question'}
                  onClick={() => run.answer(opt)}
                  className={cn(
                    'flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors',
                    'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900',
                    phase === 'question' && 'hover:border-brand-400',
                    isSelected && !revealed && 'border-brand-500 bg-brand-50 dark:bg-brand-500/10',
                    isCorrect && 'border-brand-500 bg-brand-500/10',
                    isWrongPick && 'border-danger-500 bg-danger-500/10',
                    revealed && !isCorrect && !isWrongPick && 'opacity-50',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold',
                      'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
                      isCorrect && 'bg-brand-500 text-white',
                      isWrongPick && 'bg-danger-500 text-white',
                    )}
                  >
                    {isCorrect ? <Check size={14} /> : opt}
                  </span>
                  <span className="text-sm sm:text-[15px] leading-snug pt-0.5">{question.options[opt]}</span>
                </button>
              )
            })}
          </div>

          <p className="text-center text-sm min-h-5 text-neutral-500">
            {revealed
              ? verdict.selected === null
                ? 'Time’s up'
                : verdict.correct
                  ? 'Correct'
                  : `Answer: ${verdict.correctOption}`
              : run.error ?? ''}
          </p>
        </>
      )}
    </div>
  )
}
