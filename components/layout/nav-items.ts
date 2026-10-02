import { BookOpen, House, Layers, Swords, Trophy, User, type LucideIcon } from 'lucide-react'

export interface NavItem {
  href: string
  /** Sidebar label */
  label: string
  /** Bottom-nav label */
  short: string
  icon: LucideIcon
  /** Desktop sidebar only (phones reach it from Home / Battle / Profile). */
  sidebarOnly?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Home', short: 'Home', icon: House },
  { href: '/qbank', label: 'QBank', short: 'QBank', icon: BookOpen },
  { href: '/battle', label: 'Battle', short: 'Battle', icon: Swords },
  { href: '/flashcards', label: 'Flashcards', short: 'Cards', icon: Layers },
  { href: '/leaderboard', label: 'Leaderboard', short: 'Ranks', icon: Trophy, sidebarOnly: true },
  { href: '/account', label: 'Profile', short: 'Me', icon: User },
]

export function isNavActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}
