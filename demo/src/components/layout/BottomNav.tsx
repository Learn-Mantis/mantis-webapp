import { Home, Layers, Swords, Brain, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

const tabs = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/qbank', label: 'QBank', icon: Layers },
  { to: '/battle', label: 'Battle', icon: Swords, isCenter: true },
  { to: '/flashcards', label: 'Cards', icon: Brain },
  { to: '/profile', label: 'Profile', icon: User },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-[max(env(safe-area-inset-bottom),0px)]">
      <div className="relative mx-auto max-w-[480px] px-4 pb-4">
        <div className="glass relative flex items-center justify-between rounded-[28px] border border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)] px-2 shadow-[var(--shadow-soft)] dark:shadow-[var(--shadow-soft-dark)] h-[68px]">
          {tabs.map((tab) => {
            if (tab.isCenter) {
              return (
                <NavLink key={tab.to} to={tab.to} className="relative flex-1 flex justify-center">
                  {({ isActive }) => (
                    <motion.div
                      className="absolute -top-7 flex flex-col items-center gap-1"
                      whileTap={{ scale: 0.92 }}
                    >
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        className={cn(
                          'flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-b from-brand-400 to-brand-600',
                          'shadow-[0_10px_30px_-6px_rgba(34,197,94,0.55)] ring-4 ring-[var(--color-surface-light)] dark:ring-[var(--color-surface-dark)]',
                          isActive && 'animate-[pulse-ring_2.2s_cubic-bezier(0.4,0,0.6,1)_infinite]',
                        )}
                      >
                        <Swords size={26} className="text-white" strokeWidth={2.25} />
                      </motion.div>
                      <span className={cn('text-[11px] font-semibold', isActive ? 'text-brand-600 dark:text-brand-400' : 'text-neutral-400')}>
                        Battle
                      </span>
                    </motion.div>
                  )}
                </NavLink>
              )
            }

            const Icon = tab.icon
            return (
              <NavLink key={tab.to} to={tab.to} className="flex-1" end={tab.to === '/'}>
                {({ isActive }) => (
                  <motion.div whileTap={{ scale: 0.9 }} className="flex flex-col items-center gap-1 py-1.5">
                    <div className={cn('flex h-8 w-8 items-center justify-center rounded-xl transition-colors', isActive && 'bg-brand-500/10')}>
                      <Icon
                        size={21}
                        strokeWidth={2.25}
                        className={isActive ? 'text-brand-600 dark:text-brand-400' : 'text-neutral-400 dark:text-neutral-500'}
                      />
                    </div>
                    <span className={cn('text-[11px] font-medium', isActive ? 'text-brand-600 dark:text-brand-400' : 'text-neutral-400 dark:text-neutral-500')}>
                      {tab.label}
                    </span>
                  </motion.div>
                )}
              </NavLink>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
