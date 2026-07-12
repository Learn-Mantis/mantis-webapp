'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client'

interface UserContextValue {
  user: User | null
  loading: boolean
  /** True when Supabase env vars are present. When false, everyone is a guest. */
  configured: boolean
  signOut: () => Promise<void>
}

const UserContext = createContext<UserContextValue | null>(null)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setLoading(false)
      return
    }

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    const supabase = getSupabaseBrowserClient()
    await supabase?.auth.signOut()
    setUser(null)
  }

  return (
    <UserContext.Provider value={{ user, loading, configured: isSupabaseConfigured(), signOut }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
