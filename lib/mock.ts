/**
 * Presentational sample data for browse/guest mode. Real data (questions,
 * battle stats, decks) comes from Supabase in later phases; this keeps the
 * ported demo screens visually complete for guests.
 */

export const subjects = [
  { name: 'Medicine', code: 'medicine', total: 620, solved: 412, accuracy: 78, last: '2h ago' },
  { name: 'Surgery', code: 'surgery', total: 540, solved: 298, accuracy: 71, last: 'Yesterday' },
  { name: 'Pediatrics', code: 'pediatrics', total: 310, solved: 210, accuracy: 82, last: '3d ago' },
  { name: 'OBG', code: 'obgyn', total: 380, solved: 190, accuracy: 68, last: '1d ago' },
  { name: 'Pathology', code: 'pathology', total: 460, solved: 355, accuracy: 85, last: '5h ago' },
  { name: 'Pharmacology', code: 'pharmacology', total: 420, solved: 260, accuracy: 74, last: '2d ago' },
  { name: 'Microbiology', code: 'microbiology', total: 390, solved: 141, accuracy: 61, last: '4d ago' },
  { name: 'PSM', code: 'psm', total: 350, solved: 300, accuracy: 88, last: '6h ago' },
  { name: 'Anatomy', code: 'anatomy', total: 300, solved: 300, accuracy: 91, last: '1w ago' },
  { name: 'Physiology', code: 'physiology', total: 290, solved: 250, accuracy: 86, last: '2d ago' },
  { name: 'Biochemistry', code: 'biochemistry', total: 260, solved: 180, accuracy: 72, last: '3d ago' },
  { name: 'ENT', code: 'ent', total: 180, solved: 90, accuracy: 64, last: '5d ago' },
  { name: 'Ophthalmology', code: 'ophthalmology', total: 170, solved: 60, accuracy: 58, last: '1w ago' },
  { name: 'Dermatology', code: 'dermatology', total: 150, solved: 40, accuracy: 55, last: '2w ago' },
  { name: 'Psychiatry', code: 'psychiatry', total: 140, solved: 95, accuracy: 80, last: '4d ago' },
  { name: 'Orthopedics', code: 'orthopedics', total: 220, solved: 110, accuracy: 69, last: '3d ago' },
  { name: 'Radiology', code: 'radiology', total: 160, solved: 55, accuracy: 60, last: '1w ago' },
  { name: 'Anesthesia', code: 'anaesthesia', total: 130, solved: 40, accuracy: 57, last: '2w ago' },
] as const

export const weeklyAccuracy = [
  { day: 'Mon', value: 68 },
  { day: 'Tue', value: 72 },
  { day: 'Wed', value: 70 },
  { day: 'Thu', value: 76 },
  { day: 'Fri', value: 81 },
  { day: 'Sat', value: 79 },
  { day: 'Sun', value: 85 },
]

export const recentBattles = [
  { opponent: 'NightOwl_MD', result: 'win' as const, ratingChange: 18, time: '20m ago', score: '8-5' },
  { opponent: 'CortexRunner', result: 'win' as const, ratingChange: 22, time: '2h ago', score: '10-6' },
  { opponent: 'SuturaX', result: 'loss' as const, ratingChange: -14, time: '5h ago', score: '6-9' },
  { opponent: 'VagusNerd', result: 'win' as const, ratingChange: 16, time: '1d ago', score: '9-7' },
]

export const leaderboard = [
  { rank: 1, name: 'ApexNeuron', rating: 2340, college: 'AIIMS Delhi' },
  { rank: 2, name: 'BetaBlocker', rating: 2298, college: 'JIPMER' },
  { rank: 3, name: 'MitralMurmur', rating: 2255, college: 'CMC Vellore' },
  { rank: 8, name: 'You', rating: 1842, college: 'Your College', you: true },
]

export const decks = [
  { name: 'Medicine', cards: 340, due: 42, retention: 88, last: '3h ago' },
  { name: 'Pharmacology', cards: 210, due: 18, retention: 91, last: '1d ago' },
  { name: 'Microbiology', cards: 180, due: 0, retention: 84, last: '2d ago' },
  { name: 'Anatomy', cards: 260, due: 30, retention: 79, last: '5h ago' },
]

export const grandTests = [
  { name: 'Grand Test #12', date: 'Jul 12, 7:00 PM', questions: 200, duration: '3h 30m', participants: 4820, status: 'upcoming' as const },
  { name: 'Grand Test #11', date: 'Jul 5', questions: 200, duration: '3h 30m', participants: 5120, status: 'completed' as const, score: 168 },
  { name: 'Weekend Marathon', date: 'Live now', questions: 100, duration: '1h 45m', participants: 980, status: 'live' as const },
]

export const achievements = [
  { name: '7-Day Streak', icon: 'flame', tone: 'gold' as const },
  { name: 'Gold League', icon: 'shield', tone: 'brand' as const },
  { name: '1000 Solved', icon: 'target', tone: 'info' as const },
  { name: 'Anatomy Master', icon: 'brain', tone: 'brand' as const },
  { name: 'Perfect Week', icon: 'star', tone: 'gold' as const },
  { name: 'Top 10 College', icon: 'trophy', tone: 'gold' as const },
]

export const flashcardSample = [
  {
    front: 'A 45-year-old man presents with resting tremor, rigidity, and bradykinesia. What is the most likely neurotransmitter deficiency?',
    back: 'Dopamine — degeneration of dopaminergic neurons in the substantia nigra pars compacta causes Parkinson’s disease.',
  },
  {
    front: 'Which cranial nerve is responsible for the corneal reflex afferent limb?',
    back: 'Trigeminal nerve (CN V) — ophthalmic division carries the afferent signal; facial nerve (CN VII) carries the efferent limb.',
  },
  {
    front: 'What is the classic triad of Wernicke’s encephalopathy?',
    back: 'Confusion, ophthalmoplegia, and ataxia — caused by thiamine (B1) deficiency.',
  },
]
