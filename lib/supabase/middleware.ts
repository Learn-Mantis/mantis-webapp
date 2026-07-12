import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Refreshes the Supabase auth session on each request. No-ops (passes through)
 * when the project is not configured, so the app works in guest-only mode.
 */
export async function updateSession(request: NextRequest) {
  if (!url || !anon) return NextResponse.next({ request })

  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  // Touch the user to trigger a token refresh when needed.
  await supabase.auth.getUser()

  return response
}
