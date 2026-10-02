'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_ITEMS, isNavActive } from './nav-items'
import { cn } from '@/lib/utils'

/** Phone tab bar: 64px, hidden in focus modes (battle, study sessions). */
export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="mx-auto flex h-16 max-w-[560px]">
        {NAV_ITEMS.filter((i) => !i.sidebarOnly).map((item) => {
          const on = isNavActive(pathname, item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={on ? 'page' : undefined}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-[3px] hover:no-underline',
                on ? 'text-fg' : 'text-fg-3',
              )}
            >
              <span
                className={cn(
                  'flex h-7 w-[52px] items-center justify-center rounded-full transition-colors duration-200',
                  on && 'bg-action-soft text-on-action-soft',
                )}
              >
                <Icon size={20} strokeWidth={on ? 2 : 1.75} />
              </span>
              <span className={cn('text-[11px] leading-[14px]', on ? 'font-semibold' : 'font-medium')}>{item.short}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
