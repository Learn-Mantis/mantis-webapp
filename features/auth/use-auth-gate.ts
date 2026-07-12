'use client'

import { useCallback } from 'react'
import { useUser } from './user-provider'
import { useUIStore } from '@/stores/ui'

interface GateOptions {
  /** Short label shown in the auth sheet, e.g. "create a deck". */
  reason?: string
  /** Runs immediately if the user is already authenticated. */
  onAuthed?: () => void
}

/**
 * Returns a guard function for any action that requires authentication.
 * Guests get the onboarding/login sheet; authed users run `onAuthed`.
 */
export function useAuthGate() {
  const { user } = useUser()
  const openAuthGate = useUIStore((s) => s.openAuthGate)

  return useCallback(
    (opts?: GateOptions) => {
      if (user) {
        opts?.onAuthed?.()
        return true
      }
      openAuthGate(opts?.reason)
      return false
    },
    [user, openAuthGate],
  )
}
