'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Layers,
  Swords,
  Brain,
  User,
  Sun,
  Moon,
  Sparkles,
  LogOut,
  LogIn,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { MantisLogo } from '@/components/ui/Logo'
import { useTheme } from '@/lib/theme'
import { useUser } from '@/features/auth/user-provider'
import { useDisplayName } from '@/features/auth/use-display-name'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Home Dashboard', icon: Home },
  { href: '/battle', label: 'Battle Arena', icon: Swords, badge: 'Live' },
  { href: '/qbank', label: 'Question Bank', icon: Layers, badge: '113k' },
  { href: '/flashcards', label: 'Flashcards (SRS)', icon: Brain },
  { href: '/account', label: 'Profile & Settings', icon: User },
]

export function DesktopSidebar() {
  const pathname = usePathname()
  const { user, signOut } = useUser()
  const displayName = useDisplayName()
  const { theme, toggleTheme, mounted } = useTheme()

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  return (
    <aside className="hidden lg:flex w-64 xl:w-72 flex-col fixed inset-y-0 left-0 z-40 bg-[var(--color-surface-light)] dark:bg-[var(--color-surface-dark)] border-r border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)] p-5 justify-between select-none">
      {/* Top section: Logo & Nav items */}
      <div className="flex flex-col gap-7">
        {/* Brand */}
        <div className="flex items-center justify-between px-2 pt-1">
          <MantisLogo size={42} withText showSubtext href="/" />
        </div>

        {/* Navigation list */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center justify-between px-3.5 py-3 rounded-2xl font-semibold text-sm transition-all duration-150',
                  active
                    ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300 font-bold shadow-sm shadow-brand-500/5'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-500/5 hover:text-neutral-900 dark:hover:text-white',
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-xl transition-colors',
                      active
                        ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30'
                        : 'text-neutral-500 dark:text-neutral-400',
                    )}
                  >
                    <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                  </div>
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider',
                      item.badge === 'Live'
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        : 'bg-gold-500/10 text-gold-600 dark:text-gold-400',
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Middle Promo CTA: Play Battle */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white flex flex-col gap-3 shadow-lg shadow-brand-600/20 relative overflow-hidden">
        <div className="absolute -right-4 -top-4 opacity-15 pointer-events-none">
          <Sparkles size={80} />
        </div>
        <div className="relative flex flex-col gap-1">
          <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-brand-100">
            <Sparkles size={13} /> Real-time Duel
          </div>
          <p className="font-extrabold text-base font-[var(--font-display)] leading-tight">
            Ready to Battle?
          </p>
          <p className="text-xs text-brand-100/90 leading-relaxed">
            Test your clinical speed against other medical aspirants.
          </p>
        </div>
        <Link href="/battle" className="w-full">
          <Button size="sm" variant="secondary" className="w-full bg-white !text-brand-700 shadow-md font-bold">
            <Swords size={15} /> Enter Arena
          </Button>
        </Link>
      </div>

      {/* Bottom section: User widget & Theme toggle */}
      <div className="flex flex-col gap-3 pt-3 border-t border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)]">
        <div className="flex items-center justify-between gap-2">
          {/* User info */}
          <Link
            href="/account"
            className="flex items-center gap-2.5 flex-1 min-w-0 p-1.5 rounded-xl hover:bg-neutral-500/5 transition-colors"
          >
            <Avatar initials={displayName.slice(0, 2).toUpperCase()} size={36} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold truncate leading-tight">{displayName}</p>
              <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                {user ? user.email : 'Guest Student'}
              </p>
            </div>
          </Link>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-surface-light-muted)] dark:bg-[var(--color-surface-dark-muted)] text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors shrink-0"
            aria-label="Toggle theme"
          >
            {mounted && theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>

        {user ? (
          <button
            type="button"
            onClick={() => signOut()}
            className="flex items-center gap-2 w-full text-xs font-semibold text-neutral-400 hover:text-rose-500 px-2 py-1 transition-colors"
          >
            <LogOut size={14} /> Sign out
          </button>
        ) : (
          <div className="flex gap-2">
            <Link href="/login" className="flex-1">
              <Button size="sm" variant="ghost" className="w-full text-xs h-8">
                <LogIn size={13} /> Sign In
              </Button>
            </Link>
            <Link href="/signup" className="flex-1">
              <Button size="sm" className="w-full text-xs h-8">
                Sign Up
              </Button>
            </Link>
          </div>
        )}
      </div>
    </aside>
  )
}
