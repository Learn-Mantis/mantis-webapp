'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Moon, Sun } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { MantisLogo } from '@/components/ui/Logo'
import { IconButton } from '@/components/ui/IconButton'
import { useTheme } from '@/lib/theme'
import { useUser } from '@/features/auth/user-provider'
import { useDisplayName } from '@/features/auth/use-display-name'
import { NAV_ITEMS, isNavActive } from './nav-items'
import { cn } from '@/lib/utils'

/** 248px desktop sidebar. */
export function DesktopSidebar() {
  const pathname = usePathname()
  const { user } = useUser()
  const displayName = useDisplayName()
  const { theme, toggleTheme, mounted } = useTheme()

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col gap-1 border-r border-line bg-surface-2 px-3.5 py-5 lg:flex">
      <div className="px-2.5 pb-5 pt-1">
        <MantisLogo size={22} href="/" />
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const on = isNavActive(pathname, item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={on ? 'page' : undefined}
              className={cn(
                'flex h-10 items-center gap-3 rounded-[10px] px-3 text-sm transition-colors duration-[120ms] hover:no-underline',
                on ? 'bg-pressed font-semibold text-fg' : 'font-medium text-fg-2 hover:bg-hover',
              )}
            >
              <Icon size={20} strokeWidth={on ? 2 : 1.75} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="flex-1" />

      <div className="flex items-center gap-2 border-t border-line pt-3">
        {user ? (
          <Link href="/account" className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl p-1.5 hover:bg-hover hover:no-underline">
            <Avatar name={displayName} size={32} />
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium text-fg">{displayName}</span>
              <span className="block truncate text-xs text-fg-3">{user.email}</span>
            </span>
          </Link>
        ) : (
          <div className="flex flex-1 gap-3 px-1.5 text-sm">
            <Link href="/login">Log in</Link>
            <Link href="/signup">Sign up</Link>
          </div>
        )}
        <IconButton label={mounted && theme === 'dark' ? 'Light mode' : 'Dark mode'} size="sm" onClick={toggleTheme}>
          {mounted && theme === 'dark' ? <Sun size={18} strokeWidth={1.75} /> : <Moon size={18} strokeWidth={1.75} />}
        </IconButton>
      </div>
    </aside>
  )
}
