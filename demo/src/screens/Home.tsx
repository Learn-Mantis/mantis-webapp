import { Flame, Trophy, Swords, BookOpen, Brain, Sun, Moon, ChevronRight, Target, TrendingUp, Calendar, Zap } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ProgressRing } from '../components/ui/ProgressRing'
import { SectionHeader } from '../components/ui/SectionHeader'
import { Avatar } from '../components/ui/Avatar'
import { PageContainer } from '../components/layout/PageContainer'
import { useTheme } from '../lib/theme'
import { recentBattles, grandTests, subjects } from '../data/mock'
import { motion } from 'framer-motion'

const weakSubjects = [...subjects].sort((a, b) => a.accuracy - b.accuracy).slice(0, 3)
const trending = ['Acute Pancreatitis', 'Nephrotic Syndrome', 'TB Pharmacotherapy', 'Wilms Tumor']

export function Home() {
  const { theme, toggleTheme } = useTheme()

  return (
    <PageContainer>
      {/* Greeting */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Good Evening,</p>
          <h1 className="text-[26px] font-extrabold tracking-tight font-[var(--font-display)]">Rudransh</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-light-muted)] dark:bg-[var(--color-surface-dark-muted)]"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Avatar initials="RN" size={42} />
        </div>
      </div>

      {/* Daily progress hero */}
      <Card className="p-5 overflow-hidden relative">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-brand-500/10 blur-2xl" />
        <div className="flex items-center justify-between relative">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Today's Progress</p>
              <p className="text-2xl font-extrabold font-[var(--font-display)] mt-0.5">42 / 60 <span className="text-sm font-medium text-neutral-400">questions</span></p>
            </div>
            <div className="flex gap-5">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-500/10 text-gold-600 dark:text-gold-400">
                  <Flame size={17} />
                </div>
                <div>
                  <p className="text-sm font-bold leading-none">12 days</p>
                  <p className="text-[11px] text-neutral-500">Streak</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <Trophy size={17} />
                </div>
                <div>
                  <p className="text-sm font-bold leading-none">1842</p>
                  <p className="text-[11px] text-neutral-500">Gold III</p>
                </div>
              </div>
            </div>
          </div>
          <ProgressRing progress={70} size={92} strokeWidth={9}>
            <div className="flex flex-col items-center">
              <span className="text-lg font-extrabold font-[var(--font-display)]">70%</span>
              <span className="text-[10px] text-neutral-500">daily</span>
            </div>
          </ProgressRing>
        </div>
      </Card>

      {/* Quick actions */}
      <div>
        <SectionHeader title="Quick Actions" />
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Continue Practice', icon: BookOpen, tone: 'brand' },
            { label: 'Start Battle', icon: Swords, tone: 'gold' },
            { label: 'Review Flashcards', icon: Brain, tone: 'info' },
          ].map((a) => (
            <Card key={a.label} interactive className="flex flex-col items-center justify-center gap-2.5 py-5 px-2 text-center">
              <div
                className={
                  a.tone === 'brand'
                    ? 'flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400'
                    : a.tone === 'gold'
                      ? 'flex h-11 w-11 items-center justify-center rounded-2xl bg-gold-500/10 text-gold-600 dark:text-gold-400'
                      : 'flex h-11 w-11 items-center justify-center rounded-2xl bg-info-500/10 text-info-600 dark:text-info-400'
                }
              >
                <a.icon size={20} />
              </div>
              <span className="text-[12.5px] font-semibold leading-tight">{a.label}</span>
            </Card>
          ))}
        </div>
      </div>

      {/* Battle of the day */}
      <Card className="relative overflow-hidden p-5 bg-gradient-to-br from-brand-600 to-brand-800 border-0 text-white">
        <motion.div
          animate={{ rotate: [0, 8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -right-4 -top-4 opacity-20"
        >
          <Swords size={110} />
        </motion.div>
        <div className="relative flex flex-col gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand-100">
            <Zap size={14} /> Battle of the Day
          </div>
          <div>
            <p className="text-lg font-extrabold font-[var(--font-display)]">Cardiology Blitz Challenge</p>
            <p className="text-sm text-brand-100/90 mt-0.5">5 questions · 20 sec each · 2,840 playing today</p>
          </div>
          <Button size="md" className="bg-white !text-brand-700 shadow-lg w-fit mt-1" variant="secondary">
            Join Now <ChevronRight size={16} />
          </Button>
        </div>
      </Card>

      {/* Daily Challenge */}
      <Card interactive className="p-4 flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold-500/10 text-gold-600 dark:text-gold-400">
          <Target size={22} />
        </div>
        <div className="flex-1">
          <p className="font-bold text-[15px]">Daily Challenge</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">10 mixed questions · +50 XP reward</p>
        </div>
        <ChevronRight size={18} className="text-neutral-400" />
      </Card>

      {/* Recent battles */}
      <div>
        <SectionHeader title="Recent Battles" action="See all" />
        <div className="flex flex-col gap-2.5">
          {recentBattles.slice(0, 3).map((b) => (
            <Card key={b.opponent + b.time} className="p-3.5 flex items-center gap-3">
              <Avatar initials={b.opponent.split(' ').map((s) => s[0]).join('')} size={40} />
              <div className="flex-1">
                <p className="text-sm font-semibold">{b.opponent}</p>
                <p className="text-xs text-neutral-500">{b.time} · {b.score}</p>
              </div>
              <div className={`flex flex-col items-end`}>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${b.result === 'win' ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400' : 'bg-danger-500/10 text-danger-600 dark:text-danger-400'}`}>
                  {b.result === 'win' ? 'Victory' : 'Defeat'}
                </span>
                <span className={`text-xs font-semibold mt-1 ${b.ratingChange > 0 ? 'text-brand-600 dark:text-brand-400' : 'text-danger-500'}`}>
                  {b.ratingChange > 0 ? '+' : ''}{b.ratingChange}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Upcoming grand test */}
      <div>
        <SectionHeader title="Upcoming Grand Test" />
        <Card className="p-4 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-info-500/10 text-info-600 dark:text-info-400">
            <Calendar size={20} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-[15px]">{grandTests[0].name}</p>
            <p className="text-xs text-neutral-500">{grandTests[0].date} · {grandTests[0].questions} Qs · {grandTests[0].duration}</p>
          </div>
          <Button size="sm" variant="secondary">Set Alert</Button>
        </Card>
      </div>

      {/* Weak subjects */}
      <div>
        <SectionHeader title="Weak Subjects" subtitle="Focus areas based on recent performance" />
        <div className="flex flex-col gap-2.5">
          {weakSubjects.map((s) => (
            <Card key={s.code} interactive className="p-3.5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger-500/10 text-danger-600 dark:text-danger-400 text-xs font-bold">
                {s.accuracy}%
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{s.name}</p>
                <p className="text-xs text-neutral-500">{s.solved}/{s.total} solved</p>
              </div>
              <ChevronRight size={16} className="text-neutral-400" />
            </Card>
          ))}
        </div>
      </div>

      {/* Trending topics */}
      <div>
        <SectionHeader title="Trending Topics" icon={<TrendingUp size={18} className="text-brand-500" />} />
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
          {trending.map((t) => (
            <Card key={t} interactive className="px-4 py-3 shrink-0">
              <span className="text-sm font-semibold whitespace-nowrap">{t}</span>
            </Card>
          ))}
        </div>
      </div>
    </PageContainer>
  )
}
