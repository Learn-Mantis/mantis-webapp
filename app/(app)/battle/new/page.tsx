'use client'

import { Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { PageContainer } from '@/components/layout/PageContainer'
import { BattleSetupFlow, type SetupPreset } from '@/components/battle/BattleSetupFlow'
import { BATTLE_MODES, type BattleModeKey } from '@/lib/config/battle-modes'
import { BATTLE_CATEGORIES } from '@/lib/config/subjects'

function NewBattle() {
  const params = useSearchParams()
  const mode = params.get('mode') as BattleModeKey | null
  const cat = params.get('cat')
  const again = params.get('again')
  const rated = params.get('rated') === '1'
  const preset = useMemo<SetupPreset | undefined>(
    () =>
      again && mode && BATTLE_MODES[mode] && cat && BATTLE_CATEGORIES.some((c) => c.id === cat)
        ? { mode, categoryId: cat, rated, autoSearch: true }
        : undefined,
    [again, mode, cat, rated],
  )
  return <BattleSetupFlow preset={preset} />
}

export default function NewBattlePage() {
  return (
    <PageContainer>
      <Suspense>
        <NewBattle />
      </Suspense>
    </PageContainer>
  )
}
