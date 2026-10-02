'use client'

import { createContext, useCallback, useContext, useSyncExternalStore, type ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  mounted: boolean
  toggleTheme: () => void
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)
const STORAGE_KEY = 'mantis-theme-v2'

// The `dark` class on <html> is the source of truth: the inline init script
// sets it before hydration (no flash) and setTheme updates it.
const listeners = new Set<() => void>()
function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}
const readTheme = (): Theme => (document.documentElement.classList.contains('dark') ? 'dark' : 'light')
const serverTheme = (): Theme => 'light'

/** Light is the default; dark only when the person chose it. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, readTheme, serverTheme)
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )

  const setTheme = useCallback((t: Theme) => {
    document.documentElement.classList.toggle('dark', t === 'dark')
    try {
      localStorage.setItem(STORAGE_KEY, t)
    } catch {
      // storage unavailable — the choice lasts for this visit
    }
    listeners.forEach((l) => l())
  }, [])

  const toggleTheme = useCallback(() => setTheme(readTheme() === 'dark' ? 'light' : 'dark'), [setTheme])

  return <ThemeContext.Provider value={{ theme, mounted, toggleTheme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

/** Inline script content used in the root layout to avoid a theme flash. */
export const themeInitScript = `(function(){try{if(localStorage.getItem('${STORAGE_KEY}')==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`
