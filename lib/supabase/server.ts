import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anon)
}

/**
 * Server Supabase client for RSC, Route Handlers, and Server Actions.
 * Returns `null` when unconfigured. Cookie writes are wrapped in try/catch so
 * it is safe to call from Server Components (where setting cookies throws).
 */
export async function getSupabaseServerClient() {
  if (!url || !anon) return null
  const cookieStore = await cookies()

  return createServerClient<Database>(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Called from a Server Component — safe to ignore; middleware refreshes the session.
        }
      },
    },
  })
}
