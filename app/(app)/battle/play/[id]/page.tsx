'use client'

import { useParams, useRouter } from 'next/navigation'
import { PageContainer } from '@/components/layout/PageContainer'
import { BattleRun } from '@/components/battle/BattleRun'
import { useStartBattle } from '@/features/battle/use-start-battle'
import type { BattleState } from '@/features/battle/api'

/** One battle run. Reloading resumes it (the server keeps the clock). */
export default function BattlePlayPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const starter = useStartBattle()

  function playAgain(s: BattleState) {
    if (s.kind === 'bot' && s.bot?.bot_id) {
      starter.startBot(s.bot.bot_id, s.mode, s.category_id)
    } else if (s.kind === 'challenge') {
      starter.startChallenge(s.mode, s.category_id, s.rated)
    } else {
      router.push(`/battle?again=live&mode=${s.mode}&cat=${encodeURIComponent(s.category_id)}&rated=${s.rated ? 1 : 0}`)
    }
  }

  return (
    <PageContainer>
      {/* key: a new battle id must start a fresh run */}
      <BattleRun key={id} battleId={id} onExit={() => router.push('/battle')} onPlayAgain={playAgain} />
    </PageContainer>
  )
}
