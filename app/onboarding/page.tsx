'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Swords, Brain, Layers, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { markOnboardingSeen } from '@/features/auth/onboarding'
import { cn } from '@/lib/utils'

const slides = [
  {
    icon: Swords,
    tag: 'Battle Mode',
    title: 'Compete in real time',
    body: 'Face students at your level in Rapid, Blitz, and Marathon battles. Climb from Intern to Consultant on a fair, Elo-based ladder.',
    gradient: 'from-brand-500 to-brand-700',
  },
  {
    icon: Brain,
    tag: 'Flashcards',
    title: 'Remember everything',
    body: 'Spaced-repetition decks, community sharing, and Anki import. Your retention, on autopilot — one card at a time.',
    gradient: 'from-info-500 to-info-600',
  },
  {
    icon: Layers,
    tag: 'QBank · Coming soon',
    title: 'Practice with purpose',
    body: 'Thousands of PYQs and subject-wise practice with deep analytics to turn weak topics into strong ones.',
    gradient: 'from-gold-500 to-gold-600',
  },
]

export default function OnboardingPage() {
  const [index, setIndex] = useState(0)
  const router = useRouter()
  const slide = slides[index]
  const isLast = index === slides.length - 1

  function finish() {
    markOnboardingSeen()
    router.push('/signup')
  }

  function next() {
    if (isLast) finish()
    else setIndex((i) => i + 1)
  }

  return (
    <main className="mx-auto max-w-[480px] min-h-svh px-6 pt-[calc(env(safe-area-inset-top)+20px)] pb-[max(env(safe-area-inset-bottom),24px)] flex flex-col">
      <div className="flex items-center justify-between">
        <span className="text-lg font-extrabold font-[var(--font-display)]">
          Mantis<span className="text-brand-500">.</span>
        </span>
        <button onClick={finish} className="text-sm font-semibold text-neutral-500">
          Skip
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center gap-8">
        <motion.div
          key={index}
          initial={{ x: 24 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-6"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
            className={cn(
              'flex h-28 w-28 items-center justify-center rounded-[32px] bg-gradient-to-b text-white shadow-[var(--shadow-glow-brand)]',
              slide.gradient,
            )}
          >
            <slide.icon size={52} strokeWidth={1.75} />
          </motion.div>
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-bold uppercase tracking-wide text-brand-600 dark:text-brand-400">{slide.tag}</span>
            <h1 className="text-[28px] font-extrabold font-[var(--font-display)] leading-tight">{slide.title}</h1>
            <p className="text-[15px] text-neutral-500 dark:text-neutral-400 max-w-[320px] mx-auto leading-relaxed">
              {slide.body}
            </p>
          </div>
        </motion.div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={cn(
                'h-2 rounded-full transition-all',
                i === index ? 'w-6 bg-brand-500' : 'w-2 bg-[var(--color-surface-light-muted)] dark:bg-[var(--color-surface-dark-muted)]',
              )}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
        <Button size="lg" className="w-full" onClick={next}>
          {isLast ? 'Get Started' : 'Next'} <ChevronRight size={18} />
        </Button>
      </div>
    </main>
  )
}
