import {
  Trophy,
  Flame,
  Swords,
  BookOpen,
  Clock,
  Layers,
  Star,
  Shield,
  Target,
  Brain,
  Sun,
  Moon,
  Bell,
  UserCircle,
  Lock,
  Sparkles,
  HelpCircle,
  ChevronRight,
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Avatar } from '../components/ui/Avatar'
import { SectionHeader } from '../components/ui/SectionHeader'
import { StatTile } from '../components/ui/StatTile'
import { Toggle } from '../components/ui/Toggle'
import { PageContainer } from '../components/layout/PageContainer'
import { useTheme } from '../lib/theme'
import { achievements, recentBattles } from '../data/mock'
import { cn } from '../lib/utils'

const achievementIcons: Record<string, typeof Flame> = {
  flame: Flame,
  shield: Shield,
  target: Target,
  brain: Brain,
  star: Star,
  trophy: Trophy,
}

const toneClasses: Record<string, string> = {
  brand: 'bg-brand-500/10 text-brand-600 dark:text-brand-400',
  gold: 'bg-gold-500/10 text-gold-600 dark:text-gold-400',
  info: 'bg-info-500/10 text-info-600 dark:text-info-400',
}

export function Profile() {
  const { theme, toggleTheme } = useTheme()

  return (
    <PageContainer>
      <h1 className="text-[22px] font-extrabold tracking-tight font-[var(--font-display)] pt-1">Profile</h1>

      {/* Profile header */}
      <Card className="p-5 flex flex-col items-center gap-3 text-center relative overflow-hidden">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 h-40 w-40 rounded-full bg-brand-500/10 blur-2xl" />
        <Avatar initials="RN" size={84} ring />
        <div>
          <p className="text-lg font-extrabold font-[var(--font-display)]">Rudransh Nareda</p>
          <p className="text-sm text-neutral-500">@rudransh_n · AIIMS Jodhpur</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 px-3 py-1.5 text-xs font-bold">
            <Trophy size={13} /> Gold III · 1842
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-gold-500/10 text-gold-600 dark:text-gold-400 px-3 py-1.5 text-xs font-bold">
            <Sparkles size={13} /> Pro
          </span>
        </div>
      </Card>

      {/* Statistics */}
      <div>
        <SectionHeader title="Statistics" />
        <div className="grid grid-cols-3 gap-3">
          <StatTile icon={BookOpen} label="Questions Solved" value="3,412" tone="brand" />
          <StatTile icon={Swords} label="Battles Won" value="193" tone="gold" />
          <StatTile icon={Trophy} label="Win Rate" value="68%" tone="info" />
          <StatTile icon={Clock} label="Study Time" value="86h" tone="brand" />
          <StatTile icon={Layers} label="Cards Reviewed" value="1,240" tone="info" />
          <StatTile icon={Flame} label="Streak" value="12 days" tone="gold" />
        </div>
      </div>

      {/* Achievements */}
      <div>
        <SectionHeader title="Achievements" action="See all" />
        <div className="grid grid-cols-3 gap-3">
          {achievements.map((a) => {
            const Icon = achievementIcons[a.icon]
            return (
              <Card key={a.name} interactive className="flex flex-col items-center gap-2 py-4 px-2 text-center">
                <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl', toneClasses[a.tone])}>
                  <Icon size={20} />
                </div>
                <span className="text-[11px] font-semibold leading-tight">{a.name}</span>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Battle history */}
      <div>
        <SectionHeader title="Battle History" action="See all" />
        <div className="flex flex-col gap-2.5">
          {recentBattles.map((b) => (
            <Card key={b.opponent + b.time} className="p-3.5 flex items-center gap-3">
              <Avatar initials={b.opponent.split(' ').map((s) => s[0]).join('')} size={38} />
              <div className="flex-1">
                <p className="text-sm font-semibold">{b.opponent}</p>
                <p className="text-xs text-neutral-500">{b.time}</p>
              </div>
              <span
                className={cn(
                  'text-xs font-bold px-2 py-0.5 rounded-full',
                  b.result === 'win' ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400' : 'bg-danger-500/10 text-danger-600 dark:text-danger-400',
                )}
              >
                {b.result === 'win' ? 'Victory' : 'Defeat'}
              </span>
            </Card>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div>
        <SectionHeader title="Settings" />
        <Card className="p-1.5 flex flex-col divide-y divide-[var(--color-surface-light-border)] dark:divide-[var(--color-surface-dark-border)]">
          <div className="flex items-center gap-3.5 px-3.5 py-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
            </div>
            <span className="flex-1 text-sm font-semibold">Dark Mode</span>
            <Toggle checked={theme === 'dark'} onChange={toggleTheme} />
          </div>
          {[
            { icon: Bell, label: 'Notifications' },
            { icon: UserCircle, label: 'Account' },
            { icon: Lock, label: 'Privacy' },
            { icon: Sparkles, label: 'Subscription' },
            { icon: HelpCircle, label: 'Help' },
          ].map((item) => (
            <button key={item.label} className="flex items-center gap-3.5 px-3.5 py-3.5 w-full text-left">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-surface-light-muted)] dark:bg-[var(--color-surface-dark-muted)] text-neutral-500 dark:text-neutral-300">
                <item.icon size={16} />
              </div>
              <span className="flex-1 text-sm font-semibold">{item.label}</span>
              <ChevronRight size={16} className="text-neutral-400" />
            </button>
          ))}
        </Card>
      </div>
    </PageContainer>
  )
}
