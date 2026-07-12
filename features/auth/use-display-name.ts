'use client'

import { useUser } from './user-provider'

/** Human-friendly name for the current user, or "Guest" when unauthenticated. */
export function useDisplayName(): string {
  const { user } = useUser()
  if (!user) return 'Guest'
  const meta = user.user_metadata as { full_name?: string; name?: string } | undefined
  return meta?.full_name || meta?.name || user.email?.split('@')[0] || 'Student'
}
