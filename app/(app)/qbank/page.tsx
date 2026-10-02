'use client'

import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/Feedback'
import { PageContainer } from '@/components/layout/PageContainer'
import { TopBar } from '@/components/layout/TopBar'

export default function QBankPage() {
  return (
    <PageContainer>
      <TopBar large title="QBank" />
      <Card>
        <EmptyState
          icon={<BookOpen size={24} strokeWidth={1.75} />}
          title="Question bank is on its way"
          body="Subject-wise practice with explanations and bookmarks. Until then, battles use the same questions."
          action={
            <Link href="/battle/new" className="hover:no-underline">
              <Button>Practise in a battle</Button>
            </Link>
          }
        />
      </Card>
    </PageContainer>
  )
}
