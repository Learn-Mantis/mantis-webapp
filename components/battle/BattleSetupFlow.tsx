'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bot, Handshake, Hourglass, Link2, Search, Timer, Trophy, UserSearch, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { ChoiceCard } from '@/components/ui/ChoiceCard'
import { Chip } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/Feedback'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { StickyFooter, TopBar } from '@/components/layout/TopBar'
import { ensurePlayer } from '@/features/auth/guest'
import { useUser } from '@/features/auth/user-provider'
import { battleApi, BattleApiError, type BattleProfile, type Bot as BotRow } from '@/features/battle/api'
import { useMatchmaking } from '@/features/battle/use-matchmaking'
import { playPath, useStartBattle } from '@/features/battle/use-start-battle'
import { BATTLE_MODES, BATTLE_MODE_LIST, type BattleModeKey } from '@/lib/config/battle-modes'
import { categoryLabel, SUBJECTS, subjectsByGroup, type SubjectGroup } from '@/lib/config/subjects'
import { RANK_TIERS, STARTING_RATING } from '@/lib/config/ranks'

type Step = 'pool' | 'mode' | 'type' | 'how' | 'bot' | 'search'
const MAIN_STEPS: Step[] = ['pool', 'mode', 'type', 'how']

const TITLES: Record<Step, string> = {
  pool: 'What do you want to play?',
  mode: 'Pick a mode',
  type: 'Ranked or friendly?',
  how: 'Who do you want to play?',
  bot: 'Choose a bot',
  search: '',
}

const MODE_ICON: Record<BattleModeKey, typeof Zap> = { blitz: Zap, rapid: Timer, marathon: Hourglass }

const GROUPS: { key: SubjectGroup; label: string }[] = [
  { key: 'pre-clinical', label: 'Pre-clinical' },
  { key: 'para-clinical', label: 'Para-clinical' },
  { key: 'clinical', label: 'Clinical' },
]

function groupDescription(group: SubjectGroup) {
  const names = subjectsByGroup(group).map((s) => s.name)
  return names.slice(0, 3).join(', ') + (names.length > 3 ? ` +${names.length - 3}` : '')
}

function mmss(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export interface SetupPreset {
  mode?: BattleModeKey
  categoryId?: string
  rated?: boolean
  /** Jump straight into matchmaking (Play again). */
  autoSearch?: boolean
}

/** New battle: pool → mode → ranked/friendly → how (opponent / bot / challenge). */
export function BattleSetupFlow({ preset }: { preset?: SetupPreset }) {
  const router = useRouter()
  const starter = useStartBattle()
  const [step, setStep] = useState<Step>('pool')
  const [categoryId, setCategoryId] = useState<string | null>(preset?.categoryId ?? null)
  const [mode, setMode] = useState<BattleModeKey | null>(preset?.mode ?? null)
  const [rated, setRated] = useState<boolean | null>(preset?.rated ?? null)
  const [profile, setProfile] = useState<BattleProfile | null>(null)
  const [bots, setBots] = useState<BotRow[]>([])
  const [botId, setBotId] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)

  const rating = profile?.rating ?? STARTING_RATING

  const matchmaking = useMatchmaking(useCallback((id: string) => router.push(playPath(id)), [router]))
  const startSearch = matchmaking.start

  useEffect(() => {
    battleApi.bots().then(setBots).catch(() => {})
  }, [])

  // Existing players (account or guest): load their rating for fair bot picks.
  const { sessionUser, loading: authLoading } = useUser()
  useEffect(() => {
    if (authLoading || !sessionUser) return
    ensurePlayer().then(setProfile).catch(() => {})
  }, [authLoading, sessionUser])

  const nearestBot = bots.length
    ? [...bots].sort((a, b) => Math.abs(a.rating - rating) - Math.abs(b.rating - rating))[0]
    : null

  // Local clock for the searching screen.
  useEffect(() => {
    if (step !== 'search') return
    const started = Date.now()
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000)
    return () => clearInterval(id)
  }, [step])

  const findOpponent = useCallback(
    async (m: BattleModeKey, cat: string, r: boolean) => {
      try {
        const p = await ensurePlayer()
        setProfile(p)
        setElapsed(0)
        setStep('search')
        startSearch({ mode: m, categoryId: cat, rated: r })
      } catch (e) {
        toast.error(e instanceof BattleApiError ? e.message : 'Could not start matchmaking.')
      }
    },
    [startSearch],
  )

  // "Play again" after a live battle: same settings, straight to searching.
  const [autoStarted, setAutoStarted] = useState(false)
  useEffect(() => {
    if (autoStarted || !preset?.autoSearch || !preset.mode || !preset.categoryId) return
    const t = setTimeout(() => {
      setAutoStarted(true)
      findOpponent(preset.mode!, preset.categoryId!, Boolean(preset.rated))
    }, 0)
    return () => clearTimeout(t)
  }, [autoStarted, preset, findOpponent])

  function back() {
    if (step === 'search') {
      matchmaking.cancel().then((matched) => (matched ? router.push(playPath(matched)) : setStep('how')))
      return
    }
    if (step === 'bot') return setStep('how')
    const i = MAIN_STEPS.indexOf(step)
    if (i <= 0) router.push('/battle')
    else setStep(MAIN_STEPS[i - 1])
  }

  async function fallbackToBot() {
    const s = matchmaking.settings
    const matched = await matchmaking.cancel()
    if (matched) return router.push(playPath(matched))
    if (s && nearestBot) starter.startBot(nearestBot.id, s.mode, s.categoryId)
  }

  async function fallbackToChallenge() {
    const s = matchmaking.settings
    const matched = await matchmaking.cancel()
    if (matched) return router.push(playPath(matched))
    if (s) starter.startChallenge(s.mode, s.categoryId, s.rated)
  }

  const stepIndex = MAIN_STEPS.indexOf(step === 'bot' ? 'how' : step)
  const summary = [
    categoryId && categoryLabel(categoryId),
    mode && BATTLE_MODES[mode].label,
    rated != null && (rated ? 'Ranked' : 'Friendly'),
  ]
    .filter(Boolean)
    .slice(0, step === 'bot' ? 3 : stepIndex)
    .join(' · ')

  /* ---------- Searching ---------- */
  if (step === 'search') {
    return (
      <div className="flex min-h-[calc(100vh-120px)] flex-col">
        <TopBar backIcon="x" onBack={back} />
        {!matchmaking.showFallback ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
            <div className="relative flex h-[120px] w-[120px] items-center justify-center">
              <svg width="120" height="120" className="absolute inset-0 animate-[mantis-spin_1.6s_linear_infinite]">
                <circle cx="60" cy="60" r="56" fill="none" stroke="var(--accent-track)" strokeWidth="3" />
                <circle cx="60" cy="60" r="56" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeDasharray="80 272" />
              </svg>
              <Avatar name={profile?.username ?? 'You'} size={84} />
            </div>
            <div>
              <h1 className="text-[21px] leading-7 font-semibold tracking-[-0.02em]">Finding an opponent</h1>
              <p className="num mt-1 text-sm text-fg-3">
                {mmss(elapsed)} · {Math.max(750, rating - matchmaking.range).toLocaleString('en-IN')}–
                {(rating + matchmaking.range).toLocaleString('en-IN')}
              </p>
              {matchmaking.error && <p className="mt-2 text-[13px] text-on-incorrect">{matchmaking.error}</p>}
            </div>
            <Button variant="ghost" onClick={back}>
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex flex-1 flex-col justify-center gap-2.5">
            <EmptyState
              icon={<UserSearch size={24} strokeWidth={1.75} />}
              title="No one at your level right now"
              body="Play a bot instead, or send a link and battle later."
              className="px-0 pb-4 pt-2"
            />
            {nearestBot && (
              <ChoiceCard
                icon={<Bot size={20} strokeWidth={1.75} />}
                indicator="chevron"
                title={`Play ${nearestBot.name} bot`}
                description="Practice · never rated"
                meta={nearestBot.rating.toLocaleString('en-IN')}
                onClick={fallbackToBot}
                disabled={starter.busy}
              />
            )}
            <ChoiceCard
              icon={<Link2 size={20} strokeWidth={1.75} />}
              indicator="chevron"
              title="Send a challenge link"
              description="Play now, your friend plays later"
              onClick={fallbackToChallenge}
              disabled={starter.busy}
            />
            <p className="pt-2 text-center text-[13px] text-fg-3">
              Still searching · <span className="num">{mmss(elapsed)}</span>
            </p>
          </div>
        )}
      </div>
    )
  }

  /* ---------- Steps ---------- */
  return (
    <div className="flex min-h-[calc(100vh-120px)] flex-col gap-3">
      <TopBar title="New battle" onBack={back} />
      <ProgressBar
        segments={MAIN_STEPS.map((_, i) => (i < stepIndex ? 'correct' : i === stepIndex ? 'current' : 'pending'))}
      />
      <div className="my-2 flex flex-col gap-1">
        <h1 className="text-[26px] leading-8 font-semibold tracking-[-0.02em] [text-wrap:balance]">{TITLES[step]}</h1>
        {summary && <p className="text-[15px] text-fg-3">{summary}</p>}
      </div>

      {step === 'pool' && (
        <>
          {GROUPS.map((g) => (
            <ChoiceCard
              key={g.key}
              indicator="chevron"
              title={g.label}
              description={groupDescription(g.key)}
              onClick={() => {
                setCategoryId(g.key)
                setStep('mode')
              }}
            />
          ))}
          <ChoiceCard
            indicator="chevron"
            title="All subjects"
            description="Mixed from the full syllabus"
            onClick={() => {
              setCategoryId('all')
              setStep('mode')
            }}
          />
          <h2 className="mt-2 text-[15px] font-semibold">Or one subject</h2>
          <div className="flex flex-wrap gap-2">
            {SUBJECTS.map((s) => (
              <Chip
                key={s.code}
                size="sm"
                onClick={() => {
                  setCategoryId(s.code)
                  setStep('mode')
                }}
              >
                {s.name}
              </Chip>
            ))}
          </div>
        </>
      )}

      {step === 'mode' &&
        BATTLE_MODE_LIST.map((m) => {
          const Icon = MODE_ICON[m.key]
          return (
            <ChoiceCard
              key={m.key}
              icon={<Icon size={20} strokeWidth={1.75} />}
              indicator="chevron"
              title={m.label}
              description={m.tagline}
              onClick={() => {
                setMode(m.key)
                setStep('type')
              }}
            />
          )
        })}

      {step === 'type' && (
        <>
          <ChoiceCard
            icon={<Trophy size={20} strokeWidth={1.75} />}
            indicator="chevron"
            title="Ranked"
            description="Win or lose rating"
            onClick={() => {
              setRated(true)
              setStep('how')
            }}
          />
          <ChoiceCard
            icon={<Handshake size={20} strokeWidth={1.75} />}
            indicator="chevron"
            title="Friendly"
            description="No rating change"
            onClick={() => {
              setRated(false)
              setStep('how')
            }}
          />
        </>
      )}

      {step === 'how' && mode && categoryId && rated !== null && (
        <>
          <ChoiceCard
            icon={<Search size={20} strokeWidth={1.75} />}
            indicator="chevron"
            title="Find an opponent"
            description="Live, against a player near your rating"
            onClick={() => findOpponent(mode, categoryId, rated)}
          />
          <ChoiceCard
            icon={<Bot size={20} strokeWidth={1.75} />}
            indicator="chevron"
            title="Practice vs bot"
            description="Choose a level · bots never change rating"
            onClick={() => {
              setBotId((cur) => cur ?? nearestBot?.id ?? null)
              setStep('bot')
            }}
          />
          <ChoiceCard
            icon={<Link2 size={20} strokeWidth={1.75} />}
            indicator="chevron"
            title="Challenge link"
            description="You play first, then a friend plays the same questions"
            onClick={() => starter.startChallenge(mode, categoryId, rated)}
            disabled={starter.busy}
          />
        </>
      )}

      {step === 'bot' && (
        <>
          {bots.map((b) => (
            <ChoiceCard
              key={b.id}
              icon={<Bot size={20} strokeWidth={1.75} />}
              title={`${b.name} · ${RANK_TIERS.find((r) => r.key === b.rank_key)?.name ?? ''}`}
              description={b.id === nearestBot?.id ? 'Closest to your rating' : b.blurb}
              meta={b.rating.toLocaleString('en-IN')}
              selected={botId === b.id}
              onClick={() => setBotId(b.id)}
            />
          ))}
          <StickyFooter aboveNav>
            <Button
              size="lg"
              fullWidth
              loading={starter.busy}
              disabled={!botId || !mode || !categoryId}
              onClick={() => botId && mode && categoryId && starter.startBot(botId, mode, categoryId)}
            >
              Play {bots.find((b) => b.id === botId)?.name ?? 'bot'}
            </Button>
          </StickyFooter>
        </>
      )}
    </div>
  )
}
