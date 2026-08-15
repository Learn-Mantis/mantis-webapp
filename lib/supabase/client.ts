import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/** Whether Supabase env vars are present. When false the app runs in guest-only mode. */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && anon)
}

let cached: ReturnType<typeof createBrowserClient<Database>> | null = null

/**
 * Returns a singleton browser Supabase client, or `null` when the project is
 * not yet configured (so guest mode works without a backend).
 */
export function getSupabaseBrowserClient() {
  if (!url || !anon) return null
  if (!cached) cached = createBrowserClient<Database>(url, anon)
  return cached
}

/** Convenience helper matching standard Supabase SSR naming */
export function createClient() {
  if (!url || !anon) {
    // Return a dummy client or initialize with empty strings so it won't crash callers
    return createBrowserClient<Database>('https://placeholder.supabase.co', 'placeholder')
  }
  return getSupabaseBrowserClient()!
}
