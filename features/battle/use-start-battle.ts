'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ensurePlayer } from '@/features/auth/guest'
import { battleApi, BattleApiError } from './api'
import type { BattleModeKey } from '@/lib/config/battle-modes'

export function playPath(battleId: string) {
  return `/battle/play/${battleId}`
}

/**
 * Creates bot / challenge battles (starting a guest session first if needed)
 * and opens them. Live battles come from matchmaking instead.
 */
export function useStartBattle() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const run = useCallback(
    async (create: () => Promise<string>) => {
      setBusy(true)
      try {
        await ensurePlayer()
        const id = await create()
        router.push(playPath(id))
        return id
      } catch (e) {
        toast.error(e instanceof BattleApiError ? e.message : 'Could not start the battle. Please try again.')
        return null
      } finally {
        setBusy(false)
      }
    },
    [router],
  )

  return {
    busy,
    startBot: (botId: string, mode: BattleModeKey, categoryId: string) =>
      run(() => battleApi.createBot(botId, mode, categoryId)),
    startChallenge: (mode: BattleModeKey, categoryId: string, rated: boolean) =>
      run(() => battleApi.createChallenge(mode, categoryId, rated)),
  }
}
