import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Zap, Target, Trophy, Loader2, Swords } from 'lucide-react'
import { Button } from '../ui/Button'
import { Chip } from '../ui/Chip'
import { cn } from '../../lib/utils'

const categories = ['All Subjects', '1st Year', '2nd Year', 'Final Year', 'Medicine', 'Surgery', 'OBG', 'Pediatrics']

const modes = [
  { key: 'blitz', label: 'Blitz', icon: Zap, questions: 5, time: '20 sec', tone: 'gold' },
  { key: 'standard', label: 'Standard', icon: Target, questions: 10, time: '30 sec', tone: 'brand' },
  { key: 'marathon', label: 'Marathon', icon: Trophy, questions: 20, time: '45 sec', tone: 'info' },
] as const

interface PlayBattleSheetProps {
  open: boolean
  onClose: () => void
}

export function PlayBattleSheet({ open, onClose }: PlayBattleSheetProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [category, setCategory] = useState('All Subjects')
  const [mode, setMode] = useState<(typeof modes)[number]['key'] | null>(null)

  function reset() {
    setStep(1)
    setCategory('All Subjects')
    setMode(null)
  }

  function handleClose() {
    onClose()
    setTimeout(reset, 300)
  }

  function findMatch() {
    setStep(3)
    setTimeout(() => {
      handleClose()
    }, 2600)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={step !== 3 ? handleClose : undefined}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            className="fixed bottom-0 inset-x-0 z-[61] mx-auto max-w-[480px] rounded-t-[28px] bg-white dark:bg-[var(--color-surface-dark-card)] p-5 pb-[max(env(safe-area-inset-bottom),20px)] shadow-2xl"
          >
            {step !== 3 && (
              <div className="flex items-center justify-between mb-4">
                <p className="text-lg font-extrabold font-[var(--font-display)]">
                  {step === 1 ? 'Choose Category' : 'Choose Mode'}
                </p>
                <button onClick={handleClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-surface-light-muted)] dark:bg-[var(--color-surface-dark-muted)]">
                  <X size={17} />
                </button>
              </div>
            )}

            {step === 1 && (
              <div className="flex flex-col gap-5">
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
                      {c}
                    </Chip>
                  ))}
                </div>
                <Button size="lg" className="w-full" onClick={() => setStep(2)}>
                  Continue
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-3">
                  {modes.map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setMode(m.key)}
                      className={cn(
                        'flex items-center gap-3.5 rounded-2xl border p-4 text-left transition-colors',
                        mode === m.key
                          ? 'border-brand-500 bg-brand-500/5'
                          : 'border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)]',
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-11 w-11 items-center justify-center rounded-2xl shrink-0',
                          m.tone === 'gold' && 'bg-gold-500/10 text-gold-600 dark:text-gold-400',
                          m.tone === 'brand' && 'bg-brand-500/10 text-brand-600 dark:text-brand-400',
                          m.tone === 'info' && 'bg-info-500/10 text-info-600 dark:text-info-400',
                        )}
                      >
                        <m.icon size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-[15px]">{m.label}</p>
                        <p className="text-xs text-neutral-500">{m.questions} Questions · {m.time}</p>
                      </div>
                      <div
                        className={cn(
                          'h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0',
                          mode === m.key ? 'border-brand-500' : 'border-neutral-300 dark:border-neutral-600',
                        )}
                      >
                        {mode === m.key && <div className="h-2.5 w-2.5 rounded-full bg-brand-500" />}
                      </div>
                    </button>
                  ))}
                </div>
                <Button size="lg" className="w-full" disabled={!mode} onClick={findMatch}>
                  Find Match
                </Button>
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col items-center gap-5 py-10">
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-b from-brand-400 to-brand-600 shadow-[var(--shadow-glow-brand)]"
                >
                  <Swords size={32} className="text-white" />
                </motion.div>
                <div className="text-center">
                  <p className="font-bold text-lg font-[var(--font-display)]">Finding an opponent…</p>
                  <p className="text-sm text-neutral-500 mt-1">Matching similar rating in {category}</p>
                </div>
                <Loader2 size={22} className="animate-spin text-brand-500" />
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
