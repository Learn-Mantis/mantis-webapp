'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Swords,
  Trophy,
  Zap,
  Clock,
  Target,
  Flame,
  CheckCircle2,
  XCircle,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Shield,
  ArrowRight,
  Lock,
  BookOpen,
  GraduationCap,
  Building2,
  Phone,
  User,
  Mail,
  KeyRound,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input, Label, Select } from '@/components/ui/Field'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { GoogleIcon } from '@/components/icons/GoogleIcon'
import { MantisLogo } from '@/components/ui/Logo'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { signInWithGoogle, NOT_CONFIGURED } from '@/features/auth/actions'
import { cn } from '@/lib/utils'

export interface ClinicalVignette {
  id: string
  subject: string
  subjectLabel: string
  difficulty: 'easy' | 'medium' | 'hard'
  question: string
  options: {
    A: string
    B: string
    C: string
    D: string
  }
  correctOption: 'A' | 'B' | 'C' | 'D'
  explanation: string
  clinicalPearl: string
}

const ONBOARDING_QUESTIONS: ClinicalVignette[] = [
  {
    id: 'onb-1',
    subject: 'medicine',
    subjectLabel: 'Cardiology',
    difficulty: 'medium',
    question:
      'A 58-year-old male with long-standing hypertension presents with sudden severe tearing chest pain radiating to the interscapular region. Blood pressure in the right arm is 180/100 mmHg and left arm is 130/70 mmHg. What is the definitive initial diagnostic test of choice in a hemodynamically stable patient?',
    options: {
      A: 'Transthoracic Echocardiogram (TTE)',
      B: 'Contrast-Enhanced CT Angiography (CTA) of the chest',
      C: 'Coronary Angiography',
      D: '12-Lead Electrocardiogram',
    },
    correctOption: 'B',
    explanation:
      'Contrast-Enhanced CT Angiography (CTA) of the chest is the gold standard and most rapid diagnostic investigation for acute aortic dissection in hemodynamically stable patients (Sensitivity & Specificity > 98%).',
    clinicalPearl:
      'Asymmetric blood pressure between arms (>20 mmHg) + sudden tearing back pain = Aortic Dissection until proven otherwise.',
  },
  {
    id: 'onb-2',
    subject: 'pharmacology',
    subjectLabel: 'Emergency Pharmacology',
    difficulty: 'easy',
    question:
      'A 24-year-old female presents with acute acetaminophen overdose 3 hours after ingestion. Serum acetaminophen level falls above the Rumack-Matthew nomogram treatment line. What is the specific antidote and its mechanism of action?',
    options: {
      A: 'Deferoxamine — Iron chelation',
      B: 'N-acetylcysteine (NAC) — Restores hepatic glutathione stores',
      C: 'Flumazenil — Competitive GABA-A antagonism',
      D: 'Pralidoxime — Reactivates acetylcholinesterase',
    },
    correctOption: 'B',
    explanation:
      'N-acetylcysteine (NAC) replenishes intracellular hepatic glutathione (GSH), which conjugates and detoxifies the toxic metabolite NAPQI (N-acetyl-p-benzoquinone imine), preventing centrilobular hepatic necrosis.',
    clinicalPearl:
      'NAC is most effective when administered within 8 hours of acetaminophen ingestion.',
  },
  {
    id: 'onb-3',
    subject: 'pediatrics',
    subjectLabel: 'Pediatrics',
    difficulty: 'medium',
    question:
      'A 4-year-old boy presents with high fever for 6 days, bilateral non-purulent conjunctivitis, erythema and edema of hands and feet, cervical lymphadenopathy, and a "strawberry tongue". What is the most critical echocardiographic complication to screen for?',
    options: {
      A: 'Ventricular Septal Defect',
      B: 'Coronary Artery Aneurysms',
      C: 'Coarctation of the Aorta',
      D: 'Tetralogy of Fallot',
    },
    correctOption: 'B',
    explanation:
      'Kawasaki disease (Mucocutaneous Lymph Node Syndrome) is a medium-vessel vasculitis. The most dreaded complication is Coronary Artery Aneurysms (occurs in ~20-25% of untreated cases). Treatment with IVIG and high-dose Aspirin significantly reduces this risk.',
    clinicalPearl:
      'Mnemonic "CRASH and Burn": Conjunctivitis, Rash, Adenopathy, Strawberry tongue, Hands/feet swelling + Burn (fever ≥ 5 days).',
  },
  {
    id: 'onb-4',
    subject: 'surgery',
    subjectLabel: 'General Surgery',
    difficulty: 'medium',
    question:
      'A 42-year-old obese woman presents with severe right upper quadrant pain after a fatty meal, positive Murphy’s sign, fever, and leukocytosis. Abdominal ultrasound shows gallbladder wall thickening (4.5 mm) and pericholecystic fluid. What is the definitive management?',
    options: {
      A: 'Long-term oral ursodeoxycholic acid',
      B: 'Early Laparoscopic Cholecystectomy',
      C: 'Endoscopic Retrograde Cholangiopancreatography (ERCP) only',
      D: 'Extracorporeal Shock Wave Lithotripsy (ESWL)',
    },
    correctOption: 'B',
    explanation:
      'Acute calculous cholecystitis with sonographic signs of inflammation (wall thickness > 3mm, Murphy’s sign, pericholecystic fluid) is definitively managed by early laparoscopic cholecystectomy (within 72 hours of admission).',
    clinicalPearl:
      'Early laparoscopic cholecystectomy reduces total hospital stay and complication rates compared to interval delayed surgery.',
  },
  {
    id: 'onb-5',
    subject: 'pathology',
    subjectLabel: 'Hematopathology',
    difficulty: 'hard',
    question:
      'A 32-year-old female presents with severe fatigue, pallor, and jaundice. Peripheral blood smear reveals numerous spherocytes and polychromasia. Direct Antiglobulin Test (Coombs test) is strongly positive with IgG. What is the diagnosis?',
    options: {
      A: 'Hereditary Spherocytosis',
      B: 'Warm Autoimmune Hemolytic Anemia (AIHA)',
      C: 'Cold Agglutinin Disease (IgM)',
      D: 'Paroxysmal Nocturnal Hemoglobinuria',
    },
    correctOption: 'B',
    explanation:
      'Warm Autoimmune Hemolytic Anemia is mediated by IgG antibodies (active at 37°C) causing extravascular hemolysis in the spleen. It is distinguished from Hereditary Spherocytosis by a positive Direct Coombs Test (Hereditary Spherocytosis is Coombs negative).',
    clinicalPearl:
      'IgG antibodies = Warm AIHA (extravascular, spleen); IgM antibodies = Cold AIHA (intravascular, liver).',
  },
]

const AVATARS = ['🦉', '🧠', '⚡', '🩺', '🧬', '🔬', '💉', '🫀', '🧫', '🩻', '⚕️', '🧑‍⚕️']
const BATCH_OPTIONS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  'Internship',
  'Post Internship',
]

const OPPONENT_PROFILES = [
  { name: 'Dr. Ayesha Patel', college: 'AIIMS New Delhi', avatar: '🩺', rating: 1000 },
  { name: 'Dr. Rohan Verma', college: 'KGMU Lucknow', avatar: '🧠', rating: 1000 },
  { name: 'Dr. Sneha Nair', college: 'CMC Vellore', avatar: '⚡', rating: 1000 },
]

type OnboardingStage = 'hero' | 'matching' | 'battle' | 'result' | 'register'

interface QuestionRecord {
  questionIndex: number
  selectedOption: 'A' | 'B' | 'C' | 'D' | null
  correct: boolean
  responseMs: number
}

export function QuickBattleOnboarding() {
  const router = useRouter()
  const [stage, setStage] = useState<OnboardingStage>('hero')

  // Opponent for this session
  const [opponent] = useState(() => OPPONENT_PROFILES[Math.floor(Math.random() * OPPONENT_PROFILES.length)])

  // Battle state
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [selectedOpt, setSelectedOpt] = useState<'A' | 'B' | 'C' | 'D' | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [roundPhase, setRoundPhase] = useState<'answering' | 'revealed'>('answering')
  const [timeLeft, setTimeLeft] = useState(15)

  // Scores
  const [userScore, setUserScore] = useState(0)
  const [oppScore, setOppScore] = useState(0)
  const [userStreak, setUserStreak] = useState(0)
  const [oppAnswered, setOppAnswered] = useState(false)

  // Records
  const [records, setRecords] = useState<QuestionRecord[]>([])
  const [expandedReviewIndex, setExpandedReviewIndex] = useState<number | null>(null)

  // Registration Form
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [batch, setBatch] = useState(BATCH_OPTIONS[1])
  const [college, setCollege] = useState('')
  const [phone, setPhone] = useState('')
  const [battleUsername, setBattleUsername] = useState('')
  const [avatarKey, setAvatarKey] = useState(AVATARS[0])
  const [submitting, setSubmitting] = useState(false)

  const roundStartTimeRef = useRef<number>(Date.now())
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const oppTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const nextQTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const currentQ = ONBOARDING_QUESTIONS[currentQIndex]
  const isLastQuestion = currentQIndex >= ONBOARDING_QUESTIONS.length - 1

  // Start instant match flow
  function handleStartQuickBattle() {
    setStage('matching')
    setTimeout(() => {
      setStage('battle')
      setCurrentQIndex(0)
      setUserScore(0)
      setOppScore(0)
      setUserStreak(0)
      setRecords([])
      setTimeLeft(15)
      setIsLocked(false)
      setRoundPhase('answering')
      roundStartTimeRef.current = Date.now()
    }, 1400)
  }

  // Handle advancing to next question or ending round
  const handleAdvanceQuestion = useCallback(
    (updatedRecords: QuestionRecord[]) => {
      if (isLastQuestion) {
        setStage('result')
      } else {
        setCurrentQIndex((i) => i + 1)
        setSelectedOpt(null)
        setIsLocked(false)
        setRoundPhase('answering')
        setTimeLeft(15)
        setOppAnswered(false)
        roundStartTimeRef.current = Date.now()
      }
    },
    [isLastQuestion],
  )

  // User selects an option
  const handleSelectOption = useCallback(
    (opt: 'A' | 'B' | 'C' | 'D' | null) => {
      if (isLocked || !currentQ) return

      setIsLocked(true)
      setSelectedOpt(opt)
      setRoundPhase('revealed')

      const responseMs = Date.now() - roundStartTimeRef.current
      const isCorrect = opt === currentQ.correctOption

      if (isCorrect) {
        setUserScore((s) => s + 1)
        setUserStreak((st) => st + 1)
      } else {
        setUserStreak(0)
      }

      const newRecord: QuestionRecord = {
        questionIndex: currentQIndex,
        selectedOption: opt,
        correct: isCorrect,
        responseMs,
      }
      const updated = [...records, newRecord]
      setRecords(updated)

      // Transition to next after 1.4s reveal
      nextQTimeoutRef.current = setTimeout(() => {
        handleAdvanceQuestion(updated)
      }, 1400)
    },
    [isLocked, currentQ, currentQIndex, records, handleAdvanceQuestion],
  )

  // Opponent simulation per question
  useEffect(() => {
    if (stage !== 'battle' || !currentQ) return

    // Bot randomly answers between 4s and 9s with 60% accuracy
    const botWillBeCorrect = Math.random() < 0.6
    const botResponseMs = Math.floor(Math.random() * 4500) + 4000

    oppTimeoutRef.current = setTimeout(() => {
      setOppAnswered(true)
      if (botWillBeCorrect) {
        setOppScore((s) => s + 1)
      }
    }, botResponseMs)

    return () => {
      if (oppTimeoutRef.current) clearTimeout(oppTimeoutRef.current)
    }
  }, [stage, currentQIndex, currentQ])

  // Question countdown timer
  useEffect(() => {
    if (stage !== 'battle' || roundPhase === 'revealed') return

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          if (!isLocked) {
            handleSelectOption(null)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [stage, currentQIndex, roundPhase, isLocked, handleSelectOption])

  // Clean up timeouts
  useEffect(() => {
    return () => {
      if (nextQTimeoutRef.current) clearTimeout(nextQTimeoutRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
      if (oppTimeoutRef.current) clearTimeout(oppTimeoutRef.current)
    }
  }, [])

  // Calculate psychology hook metrics
  const totalQs = ONBOARDING_QUESTIONS.length
  const correctCount = records.filter((r) => r.correct).length
  const accuracy = Math.round((correctCount / Math.max(1, totalQs)) * 100)
  const totalTimeMs = records.reduce((acc, r) => acc + r.responseMs, 0)
  const avgSpeedSec = (totalTimeMs / Math.max(1, records.length) / 1000).toFixed(1)

  // Percentile calculation
  let percentile = 74
  if (correctCount === 5) percentile = 96
  else if (correctCount === 4) percentile = 88
  else if (correctCount === 3) percentile = 76
  else if (correctCount === 2) percentile = 54
  else percentile = 38

  // Submit profile registration
  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) {
      toast.error('Please enter your full name.')
      return
    }
    if (!email.trim() || password.length < 6) {
      toast.error('Please enter a valid email and at least 6 characters for password.')
      return
    }
    if (!college.trim()) {
      toast.error('Please enter your medical college.')
      return
    }
    if (!phone.trim()) {
      toast.error('Please enter your phone number.')
      return
    }

    const finalBattleUsername = battleUsername.trim() || fullName.trim().replace(/\s+/g, '_').slice(0, 16)

    const supabase = getSupabaseBrowserClient()
    setSubmitting(true)

    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName.trim(),
            name: fullName.trim(),
            batch,
            college: college.trim(),
            phone: phone.trim(),
            country: 'India',
            state: 'All India',
            battle_username: finalBattleUsername,
            avatar_key: avatarKey,
            initial_rating: 1000,
            xp_bonus: 250,
          },
        },
      })
      setSubmitting(false)

      if (error) {
        toast.error(error.message)
        return
      }

      if (data.session) {
        toast.success('Profile created! 1000 ELO Rank & +250 XP Claimed!')
        router.push('/')
        router.refresh()
      } else {
        toast.success('Account created! Please check your email to confirm.')
        router.push('/login')
      }
    } else {
      // Supabase not configured (demo/offline mode)
      setSubmitting(false)
      toast.info(NOT_CONFIGURED)
      toast.success('Profile saved! Starting with 1000 Elo rating.')
      router.push('/login')
    }
  }

  // ==========================================
  // STAGE 1: ZERO-FRICTION HERO ENTRY
  // ==========================================
  if (stage === 'hero') {
    return (
      <div className="min-h-screen flex flex-col justify-between py-4 sm:py-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full relative select-none">
        {/* Top Navbar */}
        <div className="flex items-center justify-between">
          <MantisLogo size={42} withText showSubtext />

          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="font-bold text-xs sm:text-sm">
                Log In
              </Button>
            </Link>
            <Link href="/signup" className="hidden sm:inline-flex">
              <Button variant="secondary" size="sm" className="font-bold text-xs sm:text-sm">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Hero Body: Responsive 2-Column Grid on Desktop */}
        <div className="my-auto py-8 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Headline, Pitch, CTA (7 of 12 on lg) */}
            <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left gap-5 sm:gap-6">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-bold uppercase tracking-wider"
              >
                <Sparkles size={13} /> High-Yield Diagnostic Duel
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-3 max-w-xl"
              >
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-black font-[var(--font-display)] leading-[1.08] tracking-tight">
                  Test Your <span className="text-brand-500">Diagnostic</span> Speed.
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-lg">
                  Compete in a 60-second 1v1 clinical duel against a medical peer. 5 high-yield vignettes from cardiology, pharmacology, surgery, and pediatrics.
                </p>
              </motion.div>

              {/* Primary Action Button & Subtext */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="w-full max-w-md flex flex-col gap-3 items-center lg:items-start"
              >
                <Button
                  size="lg"
                  className="w-full sm:w-auto sm:min-w-[280px] h-14 text-base font-extrabold shadow-xl shadow-brand-500/25 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 transition-all gap-2"
                  onClick={handleStartQuickBattle}
                >
                  <Swords size={20} /> Start Quick Battle <ChevronRight size={18} />
                </Button>

                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Zero signup required to play · Takes &lt; 60 seconds
                </p>
              </motion.div>

              {/* High-yield highlights pills */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-2">
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700/60 flex items-center gap-1.5">
                  <Flame size={12} className="text-gold-500" /> 5 Clinical Vignettes
                </span>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700/60 flex items-center gap-1.5">
                  <Clock size={12} className="text-info-500" /> 15s Per Question
                </span>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700/60 flex items-center gap-1.5">
                  <Shield size={12} className="text-brand-500" /> 1000 Starting Elo
                </span>
              </div>
            </div>

            {/* Right Column: Live Match Simulation Preview Card (5 of 12 on lg) */}
            <div className="lg:col-span-5 w-full max-w-md mx-auto lg:max-w-none">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex flex-col gap-4"
              >
                <Card className="p-5 sm:p-6 bg-gradient-to-br from-brand-900/20 via-[var(--color-surface-light)] dark:via-[var(--color-surface-dark)] to-amber-900/15 border-brand-500/30 shadow-2xl relative overflow-hidden">
                  <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-brand-500/10 blur-2xl" />

                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                      Live 1v1 Diagnostic Match
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-500">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Simulated Peer Ready
                    </span>
                  </div>

                  {/* VS Matchup */}
                  <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/40 dark:bg-black/30 border border-brand-500/20">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/20 text-xl border border-brand-500/30">
                        🧑‍⚕️
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-xs">You</p>
                        <p className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold">1000 Elo</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-white font-black text-xs shadow-md">
                        VS
                      </div>
                      <span className="text-[10px] uppercase font-bold text-neutral-400 mt-1">15s / Q</span>
                    </div>

                    <div className="flex items-center gap-2.5 justify-end text-right">
                      <div className="text-right">
                        <p className="font-bold text-xs truncate max-w-[110px]">{opponent.name}</p>
                        <p className="text-[11px] text-neutral-500 truncate max-w-[110px]">{opponent.college}</p>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-200 dark:bg-neutral-800 text-xl border border-neutral-300 dark:border-neutral-700">
                        {opponent.avatar}
                      </div>
                    </div>
                  </div>

                  {/* Sample Question Preview Pill */}
                  <div className="mt-4 p-3 rounded-xl bg-white/60 dark:bg-black/40 border border-neutral-200/80 dark:border-white/10 backdrop-blur-sm shadow-inner">
                    <div className="flex items-center justify-between text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-1">
                      <span>Round 1 Preview · Cardiology</span>
                      <span className="text-brand-600 dark:text-brand-400 font-extrabold">Medium</span>
                    </div>
                    <p className="text-xs text-neutral-800 dark:text-neutral-200 line-clamp-2 leading-relaxed font-medium">
                      &ldquo;A 58-year-old male presents with sudden severe tearing chest pain radiating to the back. What is the definitive initial diagnostic test?&rdquo;
                    </p>
                  </div>

                  {/* Bottom Perks */}
                  <div className="mt-4 pt-3 border-t border-neutral-200/70 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Sparkles size={13} className="text-gold-500" /> Instant Percentile
                    </span>
                    <span className="flex items-center gap-1">
                      <Shield size={13} className="text-brand-500" /> +250 XP Reward
                    </span>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Bottom Trust & Feature Footer */}
        <div className="border-t border-neutral-200 dark:border-neutral-800/80 pt-4 pb-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-xs text-neutral-500">
          <div>
            <p className="font-extrabold text-sm sm:text-base text-neutral-800 dark:text-neutral-200">113,000+</p>
            <p className="text-[11px] text-neutral-400">MedMCQA Clinical Questions</p>
          </div>
          <div>
            <p className="font-extrabold text-sm sm:text-base text-neutral-800 dark:text-neutral-200">Elo Matchmaking</p>
            <p className="text-[11px] text-neutral-400">Skill-Calibrated Arena</p>
          </div>
          <div>
            <p className="font-extrabold text-sm sm:text-base text-neutral-800 dark:text-neutral-200">Instant Recall</p>
            <p className="text-[11px] text-neutral-400">Spaced Repetition Engine</p>
          </div>
          <div>
            <p className="font-extrabold text-sm sm:text-base text-neutral-800 dark:text-neutral-200">Pan-India Doctors</p>
            <p className="text-[11px] text-neutral-400">AIIMS, KGMU, CMC Peers</p>
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // STAGE 2: MATCHMAKING ANIMATION (< 1.5s)
  // ==========================================
  if (stage === 'matching') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 max-w-md mx-auto text-center gap-6 select-none">
        <motion.div
          animate={{ scale: [1, 1.15, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 1.2, ease: 'easeInOut', repeat: Infinity }}
          className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white shadow-2xl shadow-brand-500/30"
        >
          <Swords size={44} />
        </motion.div>

        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl font-black font-[var(--font-display)]">Matching Diagnostic Peer…</h2>
          <p className="text-sm text-neutral-500">Finding a matched medical aspirant at 1000 Elo</p>
        </div>

        {/* Found Opponent Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="w-full"
        >
          <Card className="p-4 bg-brand-500/10 border-brand-500/30 flex items-center gap-3.5 text-left">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/20 text-2xl">
              {opponent.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                ✓ Opponent Found
              </span>
              <p className="font-bold text-sm truncate">{opponent.name}</p>
              <p className="text-xs text-neutral-500 truncate">{opponent.college}</p>
            </div>
          </Card>
        </motion.div>
      </div>
    )
  }

  // ==========================================
  // STAGE 3: THE 5-QUESTION BATTLE ARENA
  // ==========================================
  if (stage === 'battle') {
    const timerFraction = timeLeft / 15
    const timerColor =
      timeLeft <= 4 ? 'stroke-rose-500' : timeLeft <= 8 ? 'stroke-amber-500' : 'stroke-brand-500'

    return (
      <div className="min-h-screen flex flex-col justify-between py-4 px-4 sm:px-6 lg:px-8 max-w-xl lg:max-w-3xl xl:max-w-4xl mx-auto w-full select-none">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-extrabold uppercase tracking-wide">
            <Swords size={13} /> Quick Diagnostic Battle · 5 Qs
          </span>
          <span className="text-xs font-bold text-neutral-400">
            Q {currentQIndex + 1} / {ONBOARDING_QUESTIONS.length}
          </span>
        </div>

        {/* Duel Score HUD */}
        <Card className="p-3.5 sm:p-4 bg-gradient-to-r from-brand-900/10 via-transparent to-amber-900/10 border-brand-500/20">
          <div className="flex items-center justify-between gap-2">
            {/* User */}
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="relative">
                <Avatar initials="You" size={42} />
                {userStreak >= 2 && (
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold-500 text-white text-[10px] font-black shadow">
                    🔥
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs truncate">You</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xl font-black font-[var(--font-display)] text-brand-600 dark:text-brand-400">
                    {userScore}
                  </span>
                  {userStreak >= 2 && (
                    <span className="text-[10px] font-extrabold text-gold-500">{userStreak}x streak</span>
                  )}
                </div>
              </div>
            </div>

            {/* Center Timer Ring */}
            <div className="relative flex items-center justify-center shrink-0">
              <svg className="w-14 h-14 transform -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r="22"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-neutral-200 dark:text-neutral-800"
                  fill="none"
                />
                <circle
                  cx="28"
                  cy="28"
                  r="22"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeDasharray={2 * Math.PI * 22}
                  strokeDashoffset={2 * Math.PI * 22 * (1 - timerFraction)}
                  strokeLinecap="round"
                  className={cn('transition-all duration-1000 ease-linear', timerColor)}
                  fill="none"
                />
              </svg>
              <span
                className={cn(
                  'absolute text-base font-black font-[var(--font-display)]',
                  timeLeft <= 4 ? 'text-rose-500 animate-pulse' : 'text-neutral-900 dark:text-white',
                )}
              >
                {timeLeft}
              </span>
            </div>

            {/* Opponent */}
            <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end text-right">
              <div className="min-w-0">
                <p className="font-bold text-xs truncate">{opponent.name}</p>
                <div className="flex items-center gap-1.5 justify-end mt-0.5">
                  {oppAnswered ? (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                      ✓ Locked
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-neutral-400 animate-pulse">Thinking…</span>
                  )}
                  <span className="text-xl font-black font-[var(--font-display)] text-neutral-700 dark:text-neutral-300">
                    {oppScore}
                  </span>
                </div>
              </div>
              <div className="relative">
                <Avatar initials={opponent.avatar} size={42} />
              </div>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-between gap-1 pt-3 mt-2 border-t border-neutral-200/60 dark:border-neutral-800">
            <span className="text-[11px] font-bold text-neutral-400">Question Progress</span>
            <div className="flex items-center gap-1.5">
              {ONBOARDING_QUESTIONS.map((_, i) => {
                const rec = records[i]
                let dotColor = 'bg-neutral-300 dark:bg-neutral-700'
                if (i === currentQIndex) dotColor = 'bg-brand-500 ring-2 ring-brand-400/40'
                else if (rec?.correct) dotColor = 'bg-emerald-500'
                else if (rec && !rec.correct) dotColor = 'bg-rose-500'

                return <div key={i} className={cn('h-2 w-2 rounded-full transition-all', dotColor)} />
              })}
            </div>
          </div>
        </Card>

        {/* Question Vignette & Options */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-3 my-auto py-2"
          >
            <Card className="p-5 sm:p-6 flex flex-col gap-3 shadow-lg border-neutral-200/80 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  {currentQ.subjectLabel}
                </span>
                <span className="text-[11px] font-semibold text-neutral-400 capitalize">
                  {currentQ.difficulty}
                </span>
              </div>
              <p className="text-base sm:text-lg lg:text-xl font-semibold leading-relaxed text-neutral-900 dark:text-neutral-100">
                {currentQ.question}
              </p>
            </Card>

            {/* Options: Single column on mobile, 2-column or wide cards on desktop */}
            <div className="grid grid-cols-1 gap-2.5">
              {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                const optText = currentQ.options[opt]
                const isSelected = selectedOpt === opt
                const isCorrect = currentQ.correctOption === opt

                let btnStyle =
                  'border-neutral-200 dark:border-neutral-800 bg-[var(--color-surface-light)] dark:bg-[var(--color-surface-dark)] hover:border-brand-400 hover:bg-brand-500/5 text-neutral-800 dark:text-neutral-200'

                if (roundPhase === 'revealed') {
                  if (isCorrect) {
                    btnStyle =
                      'border-emerald-500 bg-emerald-500/15 text-emerald-950 dark:text-emerald-300 font-bold shadow-md shadow-emerald-500/10'
                  } else if (isSelected && !isCorrect) {
                    btnStyle =
                      'border-rose-500 bg-rose-500/15 text-rose-950 dark:text-rose-300 font-bold'
                  } else {
                    btnStyle = 'opacity-40 border-neutral-200 dark:border-neutral-800'
                  }
                } else if (isSelected) {
                  btnStyle = 'border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-300 font-bold'
                }

                return (
                  <motion.button
                    key={opt}
                    whileTap={!isLocked ? { scale: 0.985 } : {}}
                    disabled={isLocked}
                    onClick={() => handleSelectOption(opt)}
                    className={cn(
                      'flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-150 relative overflow-hidden',
                      btnStyle,
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-xl font-bold text-xs shrink-0 transition-colors',
                        roundPhase === 'revealed' && isCorrect
                          ? 'bg-emerald-500 text-white'
                          : roundPhase === 'revealed' && isSelected && !isCorrect
                            ? 'bg-rose-500 text-white'
                            : isSelected
                              ? 'bg-brand-500 text-white'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
                      )}
                    >
                      {opt}
                    </div>
                    <span className="text-sm sm:text-base leading-snug flex-1">{optText}</span>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Bottom feedback indicator */}
        <div className="text-center min-h-[28px] flex items-center justify-center">
          {roundPhase === 'revealed' && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'text-xs font-bold uppercase tracking-wider',
                selectedOpt === currentQ.correctOption
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400',
              )}
            >
              {selectedOpt === currentQ.correctOption ? '✓ Correct Answer!' : '✗ Incorrect'}
            </motion.p>
          )}
        </div>
      </div>
    )
  }

  // ==========================================
  // STAGE 4: THE PSYCHOLOGY HOOK (POST-MATCH RESULT)
  // ==========================================
  if (stage === 'result') {
    const isWin = userScore >= oppScore

    return (
      <div className="min-h-screen flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full select-none gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start my-auto">
          {/* Left Column: Trophy, Score, Percentile, Unclaimed Rank & CTA (5 of 12 on lg) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Victory & Ego Hook Header */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center lg:items-start text-center lg:text-left gap-3"
            >
              <div
                className={cn(
                  'flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-3xl shadow-2xl border border-white/20',
                  isWin
                    ? 'bg-gradient-to-tr from-gold-500 to-amber-400 text-white shadow-gold-500/30'
                    : 'bg-gradient-to-tr from-brand-600 to-brand-400 text-white shadow-brand-500/30',
                )}
              >
                {isWin ? <Trophy size={36} /> : <Zap size={36} />}
              </div>

              <div>
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                  <Sparkles size={13} /> {isWin ? 'Duel Victory' : 'Diagnostic Match Complete'}
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-[var(--font-display)] tracking-tight">
                  You scored {correctCount}/{totalQs} — Faster than {percentile}% of test takers!
                </h1>
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Exceptional clinical reasoning under pressure. Claim your diagnostic rank and points below.
                </p>
              </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              <Card className="p-3.5 flex flex-col items-center justify-center text-center">
                <Target size={18} className="text-brand-500 mb-1" />
                <span className="text-lg font-extrabold font-[var(--font-display)]">{accuracy}%</span>
                <span className="text-[11px] text-neutral-500">Accuracy</span>
              </Card>
              <Card className="p-3.5 flex flex-col items-center justify-center text-center">
                <Clock size={18} className="text-info-500 mb-1" />
                <span className="text-lg font-extrabold font-[var(--font-display)]">{avgSpeedSec}s</span>
                <span className="text-[11px] text-neutral-500">Avg Speed</span>
              </Card>
              <Card className="p-3.5 flex flex-col items-center justify-center text-center">
                <Flame size={18} className="text-gold-500 mb-1" />
                <span className="text-lg font-extrabold font-[var(--font-display)]">Top {100 - percentile}%</span>
                <span className="text-[11px] text-neutral-500">Speed Tier</span>
              </Card>
            </div>

            {/* The Cliffhanger / Unclaimed Rank Card */}
            <Card className="p-5 border-gold-500/30 bg-gradient-to-br from-gold-500/10 via-amber-500/5 to-transparent relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-500/20 text-gold-600 dark:text-gold-400 font-black">
                    <Shield size={26} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-700 dark:text-gold-300">
                      Unclaimed Rewards
                    </span>
                    <p className="text-base sm:text-lg font-black font-[var(--font-display)] mt-0.5">+250 Diagnostic XP</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Initial Rank: <strong className="text-neutral-800 dark:text-neutral-200">1000 ELO</strong>
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 animate-pulse">
                  <Lock size={13} /> Unlocked
                </span>
              </div>
            </Card>

            {/* Primary Action to Enter Hard Gate */}
            <Button
              size="lg"
              className="w-full h-14 text-base font-extrabold shadow-xl shadow-brand-500/25 bg-brand-500 hover:bg-brand-600 transition-all gap-2"
              onClick={() => setStage('register')}
            >
              Claim +250 XP & Save Profile <ArrowRight size={18} />
            </Button>
          </div>

          {/* Right Column: Question Breakdown & Explanations (7 of 12 on lg) */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen size={17} className="text-brand-500" />
                <h3 className="font-bold text-sm sm:text-base">High-Yield Clinical Breakdown</h3>
              </div>
              <span className="text-xs text-neutral-400">Tap to inspect pearls</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {ONBOARDING_QUESTIONS.map((q, idx) => {
                const rec = records[idx]
                const isCorrect = rec?.correct
                const isExpanded = expandedReviewIndex === idx

                return (
                  <div
                    key={q.id}
                    className="rounded-2xl border border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)] bg-[var(--color-surface-light)] dark:bg-[var(--color-surface-dark)] overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => setExpandedReviewIndex(isExpanded ? null : idx)}
                      className="flex items-center justify-between w-full p-3.5 text-left gap-3 hover:bg-neutral-500/5 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="shrink-0">
                          {isCorrect ? (
                            <CheckCircle2 size={18} className="text-emerald-500" />
                          ) : (
                            <XCircle size={18} className="text-rose-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-neutral-400">Q{idx + 1}</span>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400">
                              {q.subjectLabel}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 line-clamp-1 mt-0.5">
                            {q.question}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-neutral-400">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-4 pt-0 border-t border-neutral-200/60 dark:border-neutral-800 flex flex-col gap-3 text-xs">
                        <p className="font-semibold text-neutral-900 dark:text-neutral-100 mt-2 leading-relaxed">
                          {q.question}
                        </p>

                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-200">
                          <span className="font-bold block mb-1">✓ Correct Answer: Option {q.correctOption}</span>
                          <p className="text-[11px] leading-relaxed">{q.options[q.correctOption]}</p>
                        </div>

                        <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-950 dark:text-brand-200">
                          <span className="font-bold block mb-1">💡 Clinical Pearl:</span>
                          <p className="text-[11px] leading-relaxed">{q.clinicalPearl}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // STAGE 5: THE NATURAL HARD GATE (REGISTRATION)
  // ==========================================
  return (
    <div className="min-h-screen flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 max-w-xl lg:max-w-2xl mx-auto w-full select-none">
      {/* Top Banner / Stakes */}
      <div className="mb-6 text-center flex flex-col items-center gap-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-600 dark:text-gold-400 text-xs font-bold uppercase tracking-wider">
          <Lock size={12} /> Claim +250 XP & 1000 Elo Rating
        </div>
        <h1 className="text-2xl sm:text-3xl font-black font-[var(--font-display)]">
          Create Your Doctor Profile
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-md">
          Lock in your initial 1000 Elo rank, save your battle stats, and challenge real doctors on national leaderboards.
        </p>
      </div>

      {/* Google One-Tap Login */}
      <Button
        variant="secondary"
        size="lg"
        className="w-full h-12 text-sm font-bold border-neutral-300 dark:border-neutral-700 shadow-sm gap-2"
        onClick={signInWithGoogle}
        type="button"
      >
        <GoogleIcon size={18} /> Continue with Google
      </Button>

      <div className="flex items-center gap-3 my-5">
        <div className="h-px flex-1 bg-[var(--color-surface-light-border)] dark:bg-[var(--color-surface-dark-border)]" />
        <span className="text-xs text-neutral-400">or complete profile</span>
        <div className="h-px flex-1 bg-[var(--color-surface-light-border)] dark:bg-[var(--color-surface-dark-border)]" />
      </div>

      {/* Profile Registration Form */}
      <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-3.5">
        {/* Full Name */}
        <div className="flex flex-col gap-1">
          <Label className="text-xs font-bold flex items-center gap-1">
            <User size={13} className="text-brand-500" /> Full Name
          </Label>
          <Input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Dr. Aryan Sharma"
            autoComplete="name"
          />
        </div>

        {/* Email & Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-bold flex items-center gap-1">
              <Mail size={13} className="text-brand-500" /> Email
            </Label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="aryan@college.edu"
              autoComplete="email"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs font-bold flex items-center gap-1">
              <KeyRound size={13} className="text-brand-500" /> Password
            </Label>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 chars"
              autoComplete="new-password"
            />
          </div>
        </div>

        {/* Batch & Medical College */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-bold flex items-center gap-1">
              <GraduationCap size={13} className="text-brand-500" /> Year / Stage
            </Label>
            <Select value={batch} onChange={(e) => setBatch(e.target.value)}>
              {BATCH_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs font-bold flex items-center gap-1">
              <Phone size={13} className="text-brand-500" /> Phone Number
            </Label>
            <Input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              autoComplete="tel"
            />
          </div>
        </div>

        {/* Medical College */}
        <div className="flex flex-col gap-1">
          <Label className="text-xs font-bold flex items-center gap-1">
            <Building2 size={13} className="text-brand-500" /> Medical College
          </Label>
          <Input
            required
            value={college}
            onChange={(e) => setCollege(e.target.value)}
            placeholder="e.g. AIIMS New Delhi / KGMU / CMC Vellore"
          />
        </div>

        {/* Battle Username & Avatar */}
        <div className="flex flex-col gap-2 pt-1">
          <Label className="text-xs font-bold flex items-center gap-1">
            <Swords size={13} className="text-brand-500" /> Battle Username & Avatar
          </Label>
          <Input
            value={battleUsername}
            onChange={(e) => setBattleUsername(e.target.value)}
            placeholder="e.g. NightOwl_MD (defaults to your name)"
            maxLength={20}
          />
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 mt-1">
            {AVATARS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAvatarKey(a)}
                className={cn(
                  'aspect-square rounded-xl text-xl flex items-center justify-center border transition-colors',
                  avatarKey === a
                    ? 'border-brand-500 bg-brand-500/10 shadow-sm ring-2 ring-brand-500/30'
                    : 'border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)] bg-[var(--color-surface-light-muted)]/40 dark:bg-[var(--color-surface-dark-muted)]/40',
                )}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          className="w-full h-12 text-base font-extrabold shadow-xl shadow-brand-500/25 mt-3"
          disabled={submitting}
        >
          {submitting ? 'Creating Profile…' : 'Claim Rank & Enter Dashboard'}
        </Button>
      </form>

      {/* Footer link to Login */}
      <p className="text-center text-xs text-neutral-500 mt-6">
        Already have an account?{' '}
        <Link href="/login" className="font-bold text-brand-600 dark:text-brand-400">
          Log in
        </Link>
      </p>
    </div>
  )
}
