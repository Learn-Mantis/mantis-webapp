'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { battleApi, BattleApiError } from './api'
import type { BattleModeKey } from '@/lib/config/battle-modes'

/** Seconds of searching before offering the bot / challenge fallback. */
export const FALLBACK_AFTER_SEC = 30
const POLL_MS = 2000

export interface MatchSettings {
  mode: BattleModeKey
  categoryId: string
  rated: boolean
}

/**
 * Live matchmaking: polls the server queue until paired. Keeps searching after
 * the fallback is offered, so the player can still be matched while deciding.
 */
export function useMatchmaking(onMatched: (battleId: string) => void) {
  const [settings, setSettings] = useState<MatchSettings | null>(null)
  const [waited, setWaited] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const onMatchedRef = useRef(onMatched)

  useEffect(() => {
    onMatchedRef.current = onMatched
  }, [onMatched])

  useEffect(() => {
    if (!settings) return
    let stopped = false
    let timer: ReturnType<typeof setTimeout>

    const tick = async () => {
      try {
        const res = await battleApi.matchSearch(settings.mode, settings.categoryId, settings.rated)
        if (stopped) return
        if ('battle_id' in res) {
          setSettings(null)
          onMatchedRef.current(res.battle_id)
          return
        }
        setWaited(res.waited_sec)
        setError(null)
      } catch (e) {
        if (stopped) return
        setError(e instanceof BattleApiError ? e.message : 'Connection problem — still trying…')
      }
      timer = setTimeout(tick, POLL_MS)
    }
    tick()

    return () => {
      stopped = true
      clearTimeout(timer)
    }
  }, [settings])

  const start = useCallback((s: MatchSettings) => {
    setWaited(0)
    setError(null)
    setSettings(s)
  }, [])

  /** Leaves the queue. Resolves to a battle id if a match landed meanwhile. */
  const cancel = useCallback(async (): Promise<string | null> => {
    setSettings(null)
    try {
      const res = await battleApi.matchCancel()
      return res.battle_id
    } catch {
      return null
    }
  }, [])

  return {
    searching: settings !== null,
    settings,
    waited,
    showFallback: settings !== null && waited >= FALLBACK_AFTER_SEC,
    error,
    start,
    cancel,
  }
}
