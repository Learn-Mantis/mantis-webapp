import { useState } from 'react'
import {
  FileQuestion,
  BookMarked,
  GraduationCap,
  SlidersHorizontal,
  Bookmark,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Target,
  Flame,
  Radio,
} from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from 'recharts'
import { Card } from '../components/ui/Card'
import { SectionHeader } from '../components/ui/SectionHeader'
import { ProgressRing } from '../components/ui/ProgressRing'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Chip } from '../components/ui/Chip'
import { PageContainer } from '../components/layout/PageContainer'
import { subjects, weeklyAccuracy, grandTests } from '../data/mock'

const quickAccess = [
  { label: 'PYQs', icon: FileQuestion, tone: 'brand' },
  { label: 'Subject QBank', icon: BookMarked, tone: 'info' },
  { label: 'Grand Tests', icon: GraduationCap, tone: 'gold' },
  { label: 'Custom Tests', icon: SlidersHorizontal, tone: 'brand' },
  { label: 'Bookmarks', icon: Bookmark, tone: 'danger' },
] as const

const toneClasses: Record<string, string> = {
  brand: 'bg-brand-500/10 text-brand-600 dark:text-brand-400',
  info: 'bg-info-500/10 text-info-600 dark:text-info-400',
  gold: 'bg-gold-500/10 text-gold-600 dark:text-gold-400',
  danger: 'bg-danger-500/10 text-danger-600 dark:text-danger-400',
}

const strong = [...subjects].sort((a, b) => b.accuracy - a.accuracy).slice(0, 3)
const weak = [...subjects].sort((a, b) => a.accuracy - b.accuracy).slice(0, 3)

const pyqYears = ['2026', '2025', '2024', '2023', '2022', '2021', '2020']

const totalSolved = subjects.reduce((a, s) => a + s.solved, 0)
const totalQ = subjects.reduce((a, s) => a + s.total, 0)
const avgAccuracy = Math.round(subjects.reduce((a, s) => a + s.accuracy, 0) / subjects.length)

export function QBank() {
  const [examTab, setExamTab] = useState<'neetpg' | 'inicet'>('neetpg')

  return (
    <PageContainer>
      <h1 className="text-[22px] font-extrabold tracking-tight font-[var(--font-display)] pt-1">QBank</h1>

      {/* Hero */}
      <Card className="p-5 relative overflow-hidden">
        <div className="absolute -left-8 -bottom-8 h-36 w-36 rounded-full bg-brand-500/10 blur-2xl" />
        <div className="flex items-center justify-between relative">
          <div className="flex flex-col gap-3.5">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Overall Progress</p>
            <div className="flex flex-col gap-2.5">
              <div>
                <p className="text-2xl font-extrabold font-[var(--font-display)] leading-none">{totalSolved.toLocaleString()}</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">Questions Solved</p>
              </div>
              <div className="flex gap-5">
                <div>
                  <p className="text-lg font-bold leading-none">{avgAccuracy}%</p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">Accuracy</p>
                </div>
                <div>
                  <p className="text-lg font-bold leading-none">86h</p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">Study Time</p>
                </div>
              </div>
            </div>
          </div>
          <ProgressRing progress={(totalSolved / totalQ) * 100} size={104} strokeWidth={10}>
            <div className="flex flex-col items-center">
              <span className="text-xl font-extrabold font-[var(--font-display)]">{Math.round((totalSolved / totalQ) * 100)}%</span>
              <span className="text-[10px] text-neutral-500">done</span>
            </div>
          </ProgressRing>
        </div>
      </Card>

      {/* Quick access */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {quickAccess.map((q) => (
          <Card key={q.label} interactive className="flex flex-col items-center justify-center gap-2 py-4 px-4 shrink-0 w-[92px] text-center">
            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${toneClasses[q.tone]}`}>
              <q.icon size={19} />
            </div>
            <span className="text-[11.5px] font-semibold leading-tight">{q.label}</span>
          </Card>
        ))}
      </div>

      {/* Daily challenge / weak topics */}
      <div className="grid grid-cols-2 gap-3">
        <Card interactive className="p-4 flex flex-col gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-500/10 text-gold-600 dark:text-gold-400">
            <Flame size={17} />
          </div>
          <p className="text-sm font-bold">Daily Challenge</p>
          <p className="text-xs text-neutral-500">10 Qs · +50 XP</p>
        </Card>
        <Card interactive className="p-4 flex flex-col gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-danger-500/10 text-danger-600 dark:text-danger-400">
            <Target size={17} />
          </div>
          <p className="text-sm font-bold">Weak Topics</p>
          <p className="text-xs text-neutral-500">6 topics flagged</p>
        </Card>
      </div>

      {/* Subject grid */}
      <div>
        <SectionHeader title="Subjects" subtitle="Tap a subject to practice" />
        <div className="grid grid-cols-2 gap-3">
          {subjects.map((s) => (
            <Card key={s.code} interactive className="p-3.5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <p className="text-[13.5px] font-bold leading-tight pr-1">{s.name}</p>
                <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400 shrink-0">{s.accuracy}%</span>
              </div>
              <ProgressBar progress={(s.solved / s.total) * 100} className="h-1.5" />
              <div className="flex items-center justify-between text-[10.5px] text-neutral-500">
                <span>{s.solved}/{s.total} solved</span>
                <span>{s.last}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Performance */}
      <div>
        <SectionHeader title="Performance Analysis" />
        <Card className="p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold">Accuracy Trend</p>
            <span className="text-xs text-brand-600 dark:text-brand-400 font-semibold">+8% this week</span>
          </div>
          <div className="h-32 -ml-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyAccuracy} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9aa1ab' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                />
                <Area type="monotone" dataKey="value" stroke="var(--color-brand-500)" strokeWidth={2.5} fill="url(#accGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <Card className="p-4">
            <div className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400 mb-2">
              <TrendingUp size={15} />
              <p className="text-xs font-bold uppercase tracking-wide">Strong</p>
            </div>
            <div className="flex flex-col gap-1.5">
              {strong.map((s) => (
                <div key={s.code} className="flex justify-between text-xs">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-neutral-500">{s.accuracy}%</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-1.5 text-danger-500 mb-2">
              <TrendingDown size={15} />
              <p className="text-xs font-bold uppercase tracking-wide">Weak</p>
            </div>
            <div className="flex flex-col gap-1.5">
              {weak.map((s) => (
                <div key={s.code} className="flex justify-between text-xs">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-neutral-500">{s.accuracy}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="p-4 mt-3 flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-info-500/10 text-info-600 dark:text-info-400 font-bold text-sm">
            #142
          </div>
          <div>
            <p className="text-sm font-bold">Predicted Rank</p>
            <p className="text-xs text-neutral-500">Based on last 30 days performance</p>
          </div>
        </Card>
      </div>

      {/* Grand tests */}
      <div>
        <SectionHeader title="Grand Tests" action="See all" />
        <div className="flex flex-col gap-2.5">
          {grandTests.map((t) => (
            <Card key={t.name} interactive className="p-4 flex items-center gap-3.5">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${t.status === 'live' ? 'bg-danger-500/10 text-danger-600 dark:text-danger-400' : 'bg-info-500/10 text-info-600 dark:text-info-400'}`}>
                {t.status === 'live' ? <Radio size={19} /> : <GraduationCap size={19} />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-bold">{t.name}</p>
                  {t.status === 'live' && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-danger-500 text-white uppercase">Live</span>
                  )}
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">{t.date} · {t.questions} Qs · {t.duration}</p>
              </div>
              <ChevronRight size={17} className="text-neutral-400" />
            </Card>
          ))}
        </div>
      </div>

      {/* PYQs */}
      <div>
        <SectionHeader title="PYQs" subtitle="Organized by year" />
        <div className="flex gap-2 mb-3">
          <Chip active={examTab === 'neetpg'} onClick={() => setExamTab('neetpg')}>NEET PG</Chip>
          <Chip active={examTab === 'inicet'} onClick={() => setExamTab('inicet')}>INI-CET</Chip>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {pyqYears.map((y) => (
            <Card key={y} interactive className="py-4 flex flex-col items-center gap-1">
              <span className="text-base font-extrabold font-[var(--font-display)]">{y}</span>
              <span className="text-[10.5px] text-neutral-500">200 Qs</span>
            </Card>
          ))}
        </div>
      </div>
    </PageContainer>
  )
}
