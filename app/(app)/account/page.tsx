'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AtSign,
  BookOpen,
  Building2,
  CalendarDays,
  Flame,
  GraduationCap,
  KeyRound,
  Mail,
  MapPin,
  Moon,
  Phone,
  ShieldCheck,
  Sun,
  Target,
  Trophy,
  User as UserIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ChoiceCard } from '@/components/ui/ChoiceCard'
import { EmptyState, Skeleton } from '@/components/ui/Feedback'
import { PasswordField, TextField } from '@/components/ui/Field'
import { ListRow } from '@/components/ui/ListRow'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Sheet } from '@/components/ui/Sheet'
import { StatTile } from '@/components/ui/StatTile'
import { PageContainer } from '@/components/layout/PageContainer'
import { TopBar } from '@/components/layout/TopBar'
import { RankBadge } from '@/components/battle/RankBadge'
import { useTheme } from '@/lib/theme'
import { useUser } from '@/features/auth/user-provider'
import { ensurePlayer } from '@/features/auth/guest'
import { battleApi, type BattleProfile, type MyStats } from '@/features/battle/api'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { INDIAN_STATES } from '@/lib/config/geo'

const BATCHES = ['1st year', '2nd year', '3rd year', 'Final year', 'Internship', 'Post internship']
const EXAMS = ['NEET-PG', 'INI-CET', 'Both']
const USERNAME_RE = /^[a-z0-9_]{3,20}$/

type Field = 'full_name' | 'phone' | 'college' | 'state' | 'batch' | 'exam' | 'exam_year' | 'daily_goal' | 'username' | 'password'

interface Meta {
  full_name?: string
  phone?: string
  college?: string
  state?: string
  batch?: string
  exam?: string
  exam_year?: string
  daily_goal?: number
}

const TITLES: Record<Field, string> = {
  full_name: 'Name',
  phone: 'Phone',
  college: 'Medical college',
  state: 'State',
  batch: 'Year',
  exam: 'Preparing for',
  exam_year: 'Exam year',
  daily_goal: 'Daily goal',
  username: 'Username',
  password: 'Change password',
}

function likeExact(s: string) {
  return s.replace(/[\\%_]/g, (m) => `\\${m}`)
}

function AppearanceControl() {
  const { theme, setTheme, mounted } = useTheme()
  return (
    <SegmentedControl
      value={mounted ? theme : 'light'}
      onChange={(v) => setTheme(v)}
      options={[
        { value: 'light', label: 'Light', icon: <Sun size={16} strokeWidth={1.75} /> },
        { value: 'dark', label: 'Dark', icon: <Moon size={16} strokeWidth={1.75} /> },
      ]}
    />
  )
}

function SignedInAccount() {
  const router = useRouter()
  const { user, signOut } = useUser()
  const [profile, setProfile] = useState<BattleProfile | null>(null)
  const [stats, setStats] = useState<MyStats | null>(null)
  const [meta, setMeta] = useState<Meta>(() => (user?.user_metadata ?? {}) as Meta)
  const [editing, setEditing] = useState<Field | null>(null)
  const [draft, setDraft] = useState('')
  const [draft2, setDraft2] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    ensurePlayer().then((p) => !cancelled && setProfile(p)).catch(() => {})
    battleApi.myStats().then((s) => !cancelled && setStats(s)).catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  function open(field: Field) {
    setError(null)
    setDraft2('')
    setDraft(
      field === 'username'
        ? profile?.username ?? ''
        : field === 'password'
          ? ''
          : String(meta[field as keyof Meta] ?? (field === 'daily_goal' ? 50 : '')),
    )
    setEditing(field)
  }

  async function save(value = draft) {
    if (!editing) return
    const supabase = getSupabaseBrowserClient()
    if (!supabase || !user) return
    setSaving(true)
    setError(null)
    try {
      if (editing === 'password') {
        if (value.length < 8) throw new Error('Password needs at least 8 characters')
        if (value !== draft2) throw new Error('Passwords don’t match')
        const { error: e } = await supabase.auth.updateUser({ password: value })
        if (e) throw e
        toast.success('Password changed')
      } else if (editing === 'username') {
        const name = value.trim().toLowerCase()
        if (!USERNAME_RE.test(name)) throw new Error('3–20 characters: letters, numbers and underscores')
        if (name !== profile?.username) {
          const { data: taken } = await supabase
            .from('battle_profiles')
            .select('user_id')
            .ilike('battle_username', likeExact(name))
            .neq('user_id', user.id)
            .limit(1)
          if (taken?.length) throw new Error('That username is taken')
          const { error: e } = await supabase.from('battle_profiles').update({ battle_username: name }).eq('user_id', user.id)
          if (e) throw e
          setProfile((p) => (p ? { ...p, username: name } : p))
        }
      } else {
        const v = editing === 'daily_goal' ? Number(value) : value.trim()
        if (editing === 'phone' && String(v).replace(/\D/g, '').length < 10) throw new Error('Enter a valid phone number')
        if (editing === 'full_name' && String(v).length < 2) throw new Error('Enter your name')
        const { error: e } = await supabase.auth.updateUser({ data: { [editing]: v, ...(editing === 'full_name' ? { name: v } : {}) } })
        if (e) throw e
        // Keep the private profile row in step for the fields it stores.
        if (editing === 'full_name' || editing === 'college' || editing === 'state') {
          const row: { full_name?: string; college?: string; state?: string } = { [editing]: String(v) }
          await supabase.from('profiles').update(row).eq('id', user.id)
        }
        setMeta((m) => ({ ...m, [editing]: v }))
      }
      setEditing(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  async function logOut() {
    await signOut()
    router.push('/')
  }

  const accuracy = stats?.answered_total ? Math.round((stats.correct_total / stats.answered_total) * 100) : null
  const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n))
  const choiceField = editing === 'batch' || editing === 'exam' || editing === 'state'
  const choices = editing === 'batch' ? BATCHES : editing === 'exam' ? EXAMS : editing === 'state' ? [...INDIAN_STATES] : []

  return (
    <PageContainer>
      <TopBar large title="Profile" />

      <div className="flex items-center gap-3.5">
        <Avatar name={profile?.username ?? meta.full_name ?? 'You'} size={56} />
        <div className="min-w-0">
          <p className="truncate text-[17px] font-semibold">{profile?.username ?? <Skeleton width={140} height={20} />}</p>
          {profile && <RankBadge rating={profile.rating} showRating />}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <StatTile icon={Flame} label="Streak" value={stats?.day_streak ?? '–'} unit={stats?.day_streak === 1 ? 'day' : 'days'} />
        <StatTile label="Answered" value={stats ? fmt(stats.answered_total) : '–'} />
        <StatTile label="Accuracy" value={accuracy ?? '–'} unit={accuracy != null ? '%' : undefined} />
      </div>

      <h2 className="mt-2 text-[15px] font-semibold">Appearance</h2>
      <AppearanceControl />

      <h2 className="mt-2 text-[15px] font-semibold">Study</h2>
      <Card className="overflow-hidden p-0">
        <ListRow icon={<Target size={18} strokeWidth={1.75} />} title="Daily goal" trailing={<span className="num">{meta.daily_goal ?? 50} Qs</span>} chevron divider onClick={() => open('daily_goal')} />
        <ListRow icon={<BookOpen size={18} strokeWidth={1.75} />} title="Preparing for" trailing={meta.exam ?? 'Add'} chevron divider onClick={() => open('exam')} />
        <ListRow icon={<CalendarDays size={18} strokeWidth={1.75} />} title="Exam year" trailing={meta.exam_year ?? 'Add'} chevron divider onClick={() => open('exam_year')} />
        <ListRow icon={<Trophy size={18} strokeWidth={1.75} />} title="Leaderboard" chevron onClick={() => router.push('/leaderboard')} />
      </Card>

      <h2 className="mt-2 text-[15px] font-semibold">About you</h2>
      <Card className="overflow-hidden p-0">
        <ListRow icon={<UserIcon size={18} strokeWidth={1.75} />} title="Name" subtitle={meta.full_name || 'Add your name'} chevron divider onClick={() => open('full_name')} />
        <ListRow icon={<Phone size={18} strokeWidth={1.75} />} title="Phone" subtitle={meta.phone || 'Add your phone'} chevron divider onClick={() => open('phone')} />
        <ListRow icon={<Building2 size={18} strokeWidth={1.75} />} title="Medical college" subtitle={meta.college || 'Add your college'} chevron divider onClick={() => open('college')} />
        <ListRow icon={<MapPin size={18} strokeWidth={1.75} />} title="State" subtitle={meta.state || 'Add your state'} chevron divider onClick={() => open('state')} />
        <ListRow icon={<GraduationCap size={18} strokeWidth={1.75} />} title="Year" subtitle={meta.batch || 'Add your year'} chevron onClick={() => open('batch')} />
      </Card>
      <p className="-mt-1 text-[13px] text-fg-3">Private. Only you can see these.</p>

      <h2 className="mt-2 text-[15px] font-semibold">Account</h2>
      <Card className="overflow-hidden p-0">
        <ListRow icon={<AtSign size={18} strokeWidth={1.75} />} title="Username" subtitle={profile?.username} chevron divider onClick={() => open('username')} />
        <ListRow icon={<Mail size={18} strokeWidth={1.75} />} title="Email" subtitle={user?.email} divider />
        <ListRow icon={<KeyRound size={18} strokeWidth={1.75} />} title="Change password" chevron divider onClick={() => open('password')} />
        <ListRow icon={<ShieldCheck size={18} strokeWidth={1.75} />} title="Privacy" subtitle="Others only see your username" />
      </Card>

      <Button variant="ghost" fullWidth onClick={logOut}>
        Log out
      </Button>

      <Sheet
        open={editing !== null}
        onClose={() => !saving && setEditing(null)}
        title={editing ? TITLES[editing] : ''}
        footer={
          !choiceField && (
            <Button size="lg" fullWidth loading={saving} onClick={() => save()}>
              Save
            </Button>
          )
        }
      >
        {editing === 'password' ? (
          <div className="flex flex-col gap-4 pt-1">
            <PasswordField label="New password" autoComplete="new-password" hint="At least 8 characters" value={draft} onChange={(e) => setDraft(e.target.value)} />
            <PasswordField label="Confirm password" autoComplete="new-password" value={draft2} onChange={(e) => setDraft2(e.target.value)} error={error} />
          </div>
        ) : editing === 'daily_goal' || editing === 'exam_year' ? (
          <div className="flex flex-col gap-3 pt-1">
            <SegmentedControl
              value={draft}
              onChange={setDraft}
              options={
                editing === 'daily_goal'
                  ? ['25', '50', '100'].map((v) => ({ value: v, label: `${v} Qs` }))
                  : ['2026', '2027', '2028'].map((v) => ({ value: v, label: v }))
              }
            />
            {error && <p className="text-[13px] text-on-incorrect">{error}</p>}
          </div>
        ) : choiceField ? (
          <div className="flex flex-col gap-2 pt-1">
            {choices.map((c) => (
              <ChoiceCard key={c} title={c} selected={draft === c} onClick={() => save(c)} disabled={saving} />
            ))}
            {error && <p className="text-[13px] text-on-incorrect">{error}</p>}
          </div>
        ) : editing ? (
          <div className="pt-1">
            <TextField
              label={TITLES[editing]}
              autoFocus
              type={editing === 'phone' ? 'tel' : 'text'}
              autoCapitalize={editing === 'username' ? 'none' : undefined}
              leading={editing === 'username' ? <AtSign size={18} strokeWidth={1.75} /> : undefined}
              value={draft}
              onChange={(e) => setDraft(editing === 'username' ? e.target.value.toLowerCase().replace(/\s+/g, '_') : e.target.value)}
              hint={editing === 'username' ? 'Shown in battles and leaderboards instead of your name.' : undefined}
              error={error}
            />
          </div>
        ) : null}
      </Sheet>
    </PageContainer>
  )
}

function VisitorAccount() {
  const { isGuest } = useUser()
  return (
    <PageContainer>
      <TopBar large title="Profile" />
      <Card>
        <EmptyState
          icon={<UserIcon size={24} strokeWidth={1.75} />}
          title={isGuest ? 'You’re playing as a guest' : 'Your profile lives here'}
          body={
            isGuest
              ? 'Sign up to keep your rating and battles. Your guest games come with you.'
              : 'Log in to see your rating, streak and settings.'
          }
          action={
            <div className="flex gap-2">
              <Link href="/signup" className="hover:no-underline">
                <Button>Sign up</Button>
              </Link>
              <Link href="/login" className="hover:no-underline">
                <Button variant="secondary">Log in</Button>
              </Link>
            </div>
          }
        />
      </Card>
      <h2 className="mt-2 text-[15px] font-semibold">Appearance</h2>
      <AppearanceControl />
    </PageContainer>
  )
}

export default function AccountPage() {
  const { user, loading } = useUser()
  if (loading) {
    return (
      <PageContainer>
        <Skeleton height={56} radius={16} />
      </PageContainer>
    )
  }
  return user ? <SignedInAccount /> : <VisitorAccount />
}
