'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { mergeStoredGuest } from './guest'

interface UserContextValue {
  /** The signed-in account. Null for visitors and guests (anonymous sessions). */
  user: User | null
  /** Any session, including a guest's anonymous one (used for battles). */
  sessionUser: User | null
  isGuest: boolean
  loading: boolean
  /** True when Supabase env vars are present. When false, everyone is a guest. */
  configured: boolean
  signOut: () => Promise<void>
}

const UserContext = createContext<UserContextValue | null>(null)

export function UserProvider({ children }: { children: ReactNode }) {
  const [sessionUser, setSessionUser] = useState<User | null>(null)
  // Nothing to load when there is no backend configured.
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    supabase.auth.getUser().then(({ data }) => {
      setSessionUser(data.user ?? null)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const next = session?.user ?? null
      setSessionUser(next)

      // A guest just signed up / logged in: bring their battles across.
      if (next && !next.is_anonymous && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        // Defer: Supabase recommends not awaiting other calls inside this callback.
        setTimeout(() => {
          mergeStoredGuest().then(({ merged, ratingAdopted }) => {
            if (merged) {
              toast.success(
                ratingAdopted ? 'Your guest battles and rating are now on your account.' : 'Your guest battles are now on your account.',
              )
            }
          })
        }, 0)
      }
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    const supabase = getSupabaseBrowserClient()
    await supabase?.auth.signOut()
    setSessionUser(null)
  }

  const isGuest = Boolean(sessionUser?.is_anonymous)
  const user = sessionUser && !isGuest ? sessionUser : null

  return (
    <UserContext.Provider value={{ user, sessionUser, isGuest, loading, configured: isSupabaseConfigured(), signOut }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
