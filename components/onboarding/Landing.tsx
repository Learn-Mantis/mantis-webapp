'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Timer } from '@/components/ui/Feedback'
import { ListRow } from '@/components/ui/ListRow'
import { MantisLogo } from '@/components/ui/Logo'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Explanation, MCQOption, type OptionState } from '@/components/ui/Quiz'
import { Sheet } from '@/components/ui/Sheet'
import { StickyFooter, TopBar } from '@/components/layout/TopBar'
import { RankBadge } from '@/components/battle/RankBadge'
import { BotAvatar } from '@/components/battle/BattleRun'
import { ResultIcon } from '@/components/battle/BattleRunResults'
import { DEMO_QUESTIONS, type ClinicalVignette } from '@/features/onboarding/demo-questions'

type Opt = 'A' | 'B' | 'C' | 'D'
const OPTS: Opt[] = ['A', 'B', 'C', 'D']
const SECONDS = 20
const REVEAL_MS = 1600

interface Round {
  mine: Opt | null
  mineCorrect: boolean
  bot: Opt
  botCorrect: boolean
}

/** Intern-level bot: right a bit over half the time, answers in 4–11 s. */
function botPlan(q: ClinicalVignette) {
  const correct = Math.random() < 0.55
  const wrong = OPTS.filter((o) => o !== q.correctOption)
  return {
    at: 4000 + Math.random() * 7000,
    pick: correct ? q.correctOption : wrong[Math.floor(Math.random() * wrong.length)],
  }
}

/** Signed-out landing page: a 5-question demo against a practice bot. */
export function Landing() {
  const [stage, setStage] = useState<'intro' | 'play' | 'result'>('intro')
  const [rounds, setRounds] = useState<Round[]>([])

  if (stage === 'play') {
    return (
      <DemoMatch
        onExit={() => setStage('intro')}
        onFinish={(r) => {
          setRounds(r)
          setStage('result')
        }}
      />
    )
  }
  if (stage === 'result') return <DemoResult rounds={rounds} onReplay={() => setStage('play')} />

  return (
    <div className="flex min-h-svh flex-col bg-app">
      <header className="mx-auto flex h-14 w-full max-w-[960px] items-center justify-between px-5">
        <MantisLogo size={22} />
        <Link href="/login" className="hover:no-underline">
          <Button variant="ghost" size="sm">
            Log in
          </Button>
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center gap-7 px-5 pb-12">
        <div className="flex flex-col gap-2.5">
          <h1 className="text-[34px] leading-10 font-semibold tracking-[-0.025em] [text-wrap:balance]">
            {/* Non-breaking hyphens keep exam names on one line. */}
            NEET&#8209;PG and INI&#8209;CET practice, one question at a time.
          </h1>
          <p className="text-[15px] text-fg-3">Try five questions against a practice bot. No account needed.</p>
        </div>

        <Card className="flex items-center gap-3 p-4">
          <Avatar name="you" size={40} />
          <div className="flex-1">
            <p className="font-semibold">You</p>
            <p className="text-[13px] text-fg-3">Guest</p>
          </div>
          <span className="text-[13px] font-semibold text-fg-4">vs</span>
          <div className="flex-1 text-right">
            <p className="font-semibold">Intern bot</p>
            <RankBadge rating={1000} showLabel={false} showRating />
          </div>
          <BotAvatar size={40} />
        </Card>

        <div className="flex flex-col gap-3">
          <Button size="lg" fullWidth onClick={() => setStage('play')}>
            Start demo
          </Button>
          <p className="text-center text-sm text-fg-3">
            Skip —{' '}
            <Link href="/signup" className="font-semibold">
              Sign up
            </Link>{' '}
            or{' '}
            <Link href="/login" className="font-semibold">
              log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

function DemoMatch({ onFinish, onExit }: { onFinish: (r: Round[]) => void; onExit: () => void }) {
  const [qi, setQi] = useState(0)
  const [selected, setSelected] = useState<Opt | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [botDone, setBotDone] = useState(false)
  const [left, setLeft] = useState(SECONDS)
  const [rounds, setRounds] = useState<Round[]>([])
  const plan = useRef(botPlan(DEMO_QUESTIONS[0]))
  const startedAt = useRef(0)
  const q = DEMO_QUESTIONS[qi]

  const reveal = useCallback(
    (choice: Opt | null) => {
      if (revealed) return
      setSelected(choice)
      setRevealed(true)
      setBotDone(true)
      const round: Round = {
        mine: choice,
        mineCorrect: choice === q.correctOption,
        bot: plan.current.pick,
        botCorrect: plan.current.pick === q.correctOption,
      }
      const next = [...rounds, round]
      setRounds(next)
      setTimeout(() => {
        if (qi + 1 >= DEMO_QUESTIONS.length) return onFinish(next)
        plan.current = botPlan(DEMO_QUESTIONS[qi + 1])
        setQi(qi + 1)
        setSelected(null)
        setRevealed(false)
        setBotDone(false)
        setLeft(SECONDS)
      }, REVEAL_MS)
    },
    [revealed, q, rounds, qi, onFinish],
  )

  // Latest reveal for the clock below, without restarting the clock.
  const revealRef = useRef(reveal)
  useEffect(() => {
    revealRef.current = reveal
  }, [reveal])

  // Question clock + the bot's simulated answer time.
  useEffect(() => {
    if (revealed) return
    startedAt.current = Date.now()
    const id = setInterval(() => {
      const elapsed = Date.now() - startedAt.current
      setLeft(Math.max(0, SECONDS - elapsed / 1000))
      if (elapsed >= plan.current.at) setBotDone(true)
      if (elapsed >= SECONDS * 1000) {
        clearInterval(id)
        revealRef.current(null)
      }
    }, 200)
    return () => clearInterval(id)
  }, [qi, revealed])

  const score = (key: 'mineCorrect' | 'botCorrect') => rounds.filter((r) => r[key]).length
  const segments = (key: 'mineCorrect' | 'botCorrect') =>
    DEMO_QUESTIONS.map((_, i) => (i < rounds.length ? (rounds[i][key] ? 'correct' : 'incorrect') : i === qi ? 'current' : 'pending')) as (
      | 'correct'
      | 'incorrect'
      | 'current'
      | 'pending'
    )[]

  function stateFor(o: Opt): OptionState {
    if (revealed) return o === q.correctOption ? 'correct' : o === selected ? 'incorrect' : 'dimmed'
    return selected === o ? 'selected' : 'idle'
  }

  return (
    <div className="min-h-svh bg-app">
      <main className="mx-auto flex w-full max-w-[720px] flex-col px-5 pb-10">
        <TopBar backIcon="x" onBack={onExit} title="Demo" subtitle={`${qi + 1} of ${DEMO_QUESTIONS.length}`} center />
        <div className="flex items-center gap-3 pb-3 pt-1">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <Avatar name="you" size={36} />
            <div>
              <p className="text-[13px] text-fg-2">You</p>
              <p className="num text-[21px] leading-[26px]">{score('mineCorrect')}</p>
            </div>
          </div>
          <Timer variant="ring" seconds={left} total={SECONDS} warnAt={5} />
          <div className="flex min-w-0 flex-1 flex-row-reverse items-center gap-2.5 text-right">
            <BotAvatar />
            <div>
              <p className="flex items-center justify-end gap-1 text-[13px] text-fg-2">
                Intern bot
                {botDone && <Check size={13} strokeWidth={2.5} className="text-on-correct" />}
              </p>
              <p className="num text-[21px] leading-[26px]">{score('botCorrect')}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 pb-4">
          <ProgressBar segments={segments('mineCorrect')} />
          <ProgressBar segments={segments('botCorrect')} />
        </div>
        <div className="flex flex-col gap-4">
          <p className="text-[13px] text-fg-3">{q.subjectLabel}</p>
          <p className="text-[17px] leading-[27px] [text-wrap:pretty]">{q.question}</p>
          <div className="flex flex-col gap-2">
            {OPTS.map((o) => (
              <MCQOption key={`${qi}-${o}`} letter={o} state={stateFor(o)} onClick={() => reveal(o)}>
                {q.options[o]}
              </MCQOption>
            ))}
          </div>
          <p className="min-h-[23px] text-sm text-fg-3">{revealed && selected === null ? 'Time’s up' : ''}</p>
        </div>
      </main>
    </div>
  )
}

function DemoResult({ rounds, onReplay }: { rounds: Round[]; onReplay: () => void }) {
  const router = useRouter()
  const [open, setOpen] = useState<number | null>(null)
  const a = rounds.filter((r) => r.mineCorrect).length
  const b = rounds.filter((r) => r.botCorrect).length
  const item = open !== null ? DEMO_QUESTIONS[open] : null

  return (
    <div className="min-h-svh bg-app">
      <main className="mx-auto flex min-h-svh w-full max-w-[440px] flex-col gap-5 px-5 pt-12">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="flex items-center gap-4">
            <Avatar name="you" size={44} />
            <span className="num text-[40px] tracking-[-0.03em]">
              {a}
              <span className="mx-2.5 text-fg-4">–</span>
              {b}
            </span>
            <BotAvatar size={44} />
          </div>
          <div>
            <h1 className="text-[26px] leading-8 font-semibold tracking-[-0.02em]">
              {a > b ? 'You beat the bot' : a < b ? 'The bot wins this one' : 'A draw'}
            </h1>
            <p className="mt-1.5 text-[15px] text-fg-3">Create an account to get a rating and play real opponents.</p>
          </div>
        </div>

        <Card className="overflow-hidden p-0">
          {DEMO_QUESTIONS.map((q, i) => (
            <ListRow
              key={q.id}
              divider={i < DEMO_QUESTIONS.length - 1}
              title={`${i + 1}. ${q.subjectLabel}`}
              subtitle={q.question}
              onClick={() => setOpen(i)}
              trailing={<ResultIcon ok={rounds[i]?.mineCorrect} />}
            />
          ))}
        </Card>
        <button onClick={onReplay} className="self-center text-sm font-medium text-link">
          Play the demo again
        </button>

        <StickyFooter>
          <Button size="lg" fullWidth onClick={() => router.push('/signup')}>
            Create account
          </Button>
          <Button variant="ghost" fullWidth onClick={() => router.push('/login')}>
            I have an account
          </Button>
        </StickyFooter>
      </main>

      <Sheet open={item !== null} onClose={() => setOpen(null)} title={open !== null ? `Question ${open + 1}` : ''}>
        {item && open !== null && (
          <div className="flex flex-col gap-4 pb-2">
            <p className="text-[17px] leading-[27px] text-fg">{item.question}</p>
            <div className="flex flex-col gap-2">
              {OPTS.map((o) => (
                <MCQOption
                  key={o}
                  letter={o}
                  state={o === item.correctOption ? 'correct' : o === rounds[open]?.mine ? 'incorrect' : 'dimmed'}
                  note={o === rounds[open]?.mine ? 'You' : undefined}
                >
                  {item.options[o]}
                </MCQOption>
              ))}
            </div>
            <Explanation answerLetter={item.correctOption} answerText={item.options[item.correctOption]}>
              {item.explanation}
              <span className="mt-2 block text-fg-3">{item.clinicalPearl}</span>
            </Explanation>
          </div>
        )}
      </Sheet>
    </div>
  )
}
