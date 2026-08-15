import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { BattleQuestion, QuestionProvider, QuestionQuery } from './types'

type QuestionRow = Database['public']['Tables']['questions']['Row']

function toBattleQuestion(row: QuestionRow): BattleQuestion {
  return {
    id: row.id,
    question: row.question,
    options: {
      A: row.option_a,
      B: row.option_b,
      C: row.option_c,
      D: row.option_d,
    },
    correctOption: row.correct_option,
    explanation: row.explanation,
    subject: row.subject,
    difficulty: row.difficulty,
  }
}

/** Fallback questions across medical subjects with tagged difficulties */
const FALLBACK_QUESTIONS: BattleQuestion[] = [
  // Easy (Foundations / Direct Recall)
  {
    id: 'fb-e1',
    question: 'Which of the following cranial nerves exits the skull base through the Foramen Rotundum?',
    options: {
      A: 'Ophthalmic nerve (V1)',
      B: 'Maxillary nerve (V2)',
      C: 'Mandibular nerve (V3)',
      D: 'Abducens nerve (VI)',
    },
    correctOption: 'B',
    explanation: 'Mnemonic "Standing Room Only": Superior Orbital Fissure (V1), Foramen Rotundum (V2), Foramen Ovale (V3). Maxillary nerve passes through foramen rotundum.',
    subject: 'anatomy',
    difficulty: 'easy',
  },
  {
    id: 'fb-e2',
    question: 'Which of the following anti-tuberculosis drugs is known to cause optic neuritis manifesting as red-green color blindness?',
    options: {
      A: 'Isoniazid',
      B: 'Rifampicin',
      C: 'Ethambutol',
      D: 'Pyrazinamide',
    },
    correctOption: 'C',
    explanation: 'Ethambutol causes dose-dependent retrobulbar optic neuritis. Early visual impairment manifests as decreased visual acuity and lost red-green color discrimination.',
    subject: 'pharmacology',
    difficulty: 'easy',
  },
  {
    id: 'fb-e3',
    question: 'What is the drug of choice for the treatment of scrub typhus in pregnant women and children?',
    options: {
      A: 'Doxycycline',
      B: 'Azithromycin',
      C: 'Chloramphenicol',
      D: 'Ciprofloxacin',
    },
    correctOption: 'B',
    explanation: 'Azithromycin is preferred for Orientia tsutsugamushi (scrub typhus) in pregnant women and young children where doxycycline is avoided.',
    subject: 'microbiology',
    difficulty: 'easy',
  },
  {
    id: 'fb-e4',
    question: 'Which vitamin deficiency leads to Wernicke encephalopathy characterized by ataxia, ophthalmoplegia, and confusion?',
    options: {
      A: 'Vitamin B1 (Thiamine)',
      B: 'Vitamin B3 (Niacin)',
      C: 'Vitamin B6 (Pyridoxine)',
      D: 'Vitamin B12 (Cobalamin)',
    },
    correctOption: 'A',
    explanation: 'Thiamine (B1) deficiency impairs carbohydrate metabolism in the brain, leading to Wernicke-Korsakoff syndrome, especially common in chronic alcoholism.',
    subject: 'biochemistry',
    difficulty: 'easy',
  },
  {
    id: 'fb-e5',
    question: 'The submandibular salivary gland is crossed laterally on its superficial surface by which nerve branch?',
    options: {
      A: 'Marginal mandibular branch of facial nerve',
      B: 'Hypoglossal nerve',
      C: 'Lingual nerve',
      D: 'Glossopharyngeal nerve',
    },
    correctOption: 'A',
    explanation: 'The marginal mandibular branch of the facial nerve (CN VII) courses over the superficial capsule of the submandibular gland, requiring careful preservation during submandibular excision.',
    subject: 'anatomy',
    difficulty: 'easy',
  },

  // Medium (Standard Clinical Vignettes / 2-Step Diagnostics)
  {
    id: 'fb-m1',
    question: 'A 45-year-old male presents with severe epigastric pain radiating to the back. Serum amylase and lipase are significantly elevated. What is the most sensitive early imaging modality for assessing pancreatic necrosis?',
    options: {
      A: 'Abdominal Ultrasound',
      B: 'Contrast-Enhanced CT (CECT)',
      C: 'MRCP',
      D: 'Plain Abdominal X-Ray',
    },
    correctOption: 'B',
    explanation: 'Contrast-Enhanced CT (CECT) done 48-72 hours after onset is the gold standard for diagnosing pancreatic necrosis and staging acute pancreatitis severity (Balthazar score).',
    subject: 'surgery',
    difficulty: 'medium',
  },
  {
    id: 'fb-m2',
    question: 'A newborn baby is found to have absent femoral pulses, higher blood pressure in upper extremities compared to lower extremities, and a systolic murmur. What is the most likely diagnosis?',
    options: {
      A: 'Patent Ductus Arteriosus (PDA)',
      B: 'Coarctation of the Aorta',
      C: 'Tetralogy of Fallot',
      D: 'Ventricular Septal Defect (VSD)',
    },
    correctOption: 'B',
    explanation: 'Coarctation of the aorta characteristically causes radio-femoral delay, upper extremity hypertension, and lower extremity hypotension with diminished/absent femoral pulses.',
    subject: 'pediatrics',
    difficulty: 'medium',
  },
  {
    id: 'fb-m3',
    question: 'In a patient with suspected primary hyperaldosteronism (Conn syndrome), which electrolyte and acid-base abnormality profile is typically observed?',
    options: {
      A: 'Hyperkalemia and Metabolic Acidosis',
      B: 'Hypokalemia and Metabolic Alkalosis',
      C: 'Hyperkalemia and Respiratory Acidosis',
      D: 'Hypocalcemia and Metabolic Acidosis',
    },
    correctOption: 'B',
    explanation: 'Excess aldosterone enhances renal Na+ reabsorption and urinary K+ and H+ excretion in cortical collecting ducts, leading to hypokalemia, hypertension, and metabolic alkalosis.',
    subject: 'medicine',
    difficulty: 'medium',
  },
  {
    id: 'fb-m4',
    question: 'A 28-year-old primigravida at 38 weeks presents with severe headache and BP 164/110 mmHg. Platelets are 75,000/uL and ALT is 140 IU/L. What is the definitive management?',
    options: {
      A: 'Immediate Magnesium Sulfate prophylaxis and prompt delivery',
      B: 'Expectant management until 40 weeks with oral labetalol',
      C: 'Bed rest and low dose aspirin',
      D: 'Platelet transfusion followed by discharge',
    },
    correctOption: 'A',
    explanation: 'Severe preeclampsia with HELLP features at term (>=37 weeks) requires maternal stabilization with IV MgSO4 for seizure prophylaxis, antihypertensives, and prompt delivery.',
    subject: 'obgyn',
    difficulty: 'medium',
  },
  {
    id: 'fb-m5',
    question: 'A 35-year-old female presents with fluctuating ptosis and diplopia worsening towards evening. Repetitive nerve stimulation shows a decremental response. Which autoantibody is most specific?',
    options: {
      A: 'Anti-AChR (Acetylcholine Receptor) antibodies',
      B: 'Anti-VGCC (Voltage-gated Calcium Channel) antibodies',
      C: 'Anti-Jo1 antibodies',
      D: 'Anti-SRP antibodies',
    },
    correctOption: 'A',
    explanation: 'Myasthenia gravis is characterized by autoantibodies against post-synaptic nicotinic acetylcholine receptors (anti-AChR) in ~85% of generalized cases.',
    subject: 'medicine',
    difficulty: 'medium',
  },

  // Hard (Multi-step Complex / Rare Pathologies / Subspecialty)
  {
    id: 'fb-h1',
    question: 'Which histological and immunohistochemical finding is pathognomonic for Askin tumor (Primitive Neuroectodermal Tumor of chest wall)?',
    options: {
      A: 'Homer-Wright rosettes and CD99 (MIC2) positivity with t(11;22)',
      B: 'Call-Exner bodies with Inhibin positivity',
      C: 'Psammoma bodies with TTF-1 positivity',
      D: 'Orphan Annie eye nuclei with BRAF V600E',
    },
    correctOption: 'A',
    explanation: 'Askin tumor is a member of the Ewing sarcoma/PNET family in thoracopulmonary region with strong CD99 membrane positivity, Homer-Wright rosettes, and EWSR1-FLI1 t(11;22) translocation.',
    subject: 'pathology',
    difficulty: 'hard',
  },
  {
    id: 'fb-h2',
    question: 'A 50-year-old male on amiodarone presents with palpitations and weight loss. Thyroid scintigraphy shows completely suppressed radioiodine uptake (near 0%) with elevated IL-6. What is the treatment of choice?',
    options: {
      A: 'High-dose Oral Prednisolone (Type II AIT)',
      B: 'Propylthiouracil (PTU) monotherapy (Type I AIT)',
      C: 'Radioactive Iodine (I-131) ablation',
      D: 'Immediate total thyroidectomy',
    },
    correctOption: 'A',
    explanation: 'Type II Amiodarone-Induced Thyrotoxicosis (destructive thyroiditis) has near-zero RAIU and elevated IL-6. Glucocorticoids (prednisolone 40mg/day) are the treatment of choice, whereas Type I requires high-dose antithyroid drugs.',
    subject: 'medicine',
    difficulty: 'hard',
  },
  {
    id: 'fb-h3',
    question: 'During a Whipple procedure (pancreaticoduodenectomy), an anomalous replaced right hepatic artery is encountered originating from which vessel?',
    options: {
      A: 'Superior Mesenteric Artery (SMA)',
      B: 'Left Gastric Artery',
      C: 'Splenic Artery',
      D: 'Inferior Mesenteric Artery (IMA)',
    },
    correctOption: 'A',
    explanation: 'A replaced right hepatic artery (Michels Type III) arises from the SMA and courses posterolateral to the portal vein. Identifying and preserving it is crucial during pancreatic head resection.',
    subject: 'surgery',
    difficulty: 'hard',
  },
  {
    id: 'fb-h4',
    question: 'A 4-year-old boy presents with refractory epilepsy, developmental regression, and multiple subependymal giant cell astrocytomas (SEGA). Genetic testing identifies TSC2 mutation on chromosome 16p13.3. Which signaling cascade is constitutively hyperactivated?',
    options: {
      A: 'mTORC1 pathway',
      B: 'Wnt / Beta-catenin pathway',
      C: 'Sonic Hedgehog pathway',
      D: 'JAK / STAT3 pathway',
    },
    correctOption: 'A',
    explanation: 'Tuberin (TSC2) and Hamartin (TSC1) form a GTPase-activating complex that inhibits Rheb. Loss of function causes constitutive hyperactivation of mTORC1, treatable with mTOR inhibitors (everolimus).',
    subject: 'pediatrics',
    difficulty: 'hard',
  },
  {
    id: 'fb-h5',
    question: 'In forensic toxicology, which specific post-mortem ocular finding with cherry-red livor mortis and bitter almond odor is characteristic of acute cyanide poisoning?',
    options: {
      A: 'Bright red retinal veins equal in color to retinal arteries',
      B: 'Kayser-Fleischer ring',
      C: 'Tachot noire de la cornee',
      D: 'Optic disc cupping with glaucomatous atrophy',
    },
    correctOption: 'A',
    explanation: 'Cyanide inhibits cytochrome c oxidase (complex IV), preventing oxygen utilization. High venous oxygen saturation leads to bright red/arterialized retinal veins on fundoscopy, bright pink blood, and cherry-red hypostasis.',
    subject: 'forensic',
    difficulty: 'hard',
  },
]

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** Desired difficulty mix based on player Elo rating */
export function getDifficultyDistribution(rating: number): { easy: number; medium: number; hard: number } {
  if (rating < 1000) {
    // Intern Rank: mostly foundational recall & core concepts
    return { easy: 0.6, medium: 0.3, hard: 0.1 }
  }
  if (rating < 1400) {
    // Resident Rank: balanced clinical mix
    return { easy: 0.2, medium: 0.6, hard: 0.2 }
  }
  if (rating < 1700) {
    // Registrar Rank: advanced clinical cases & multi-step problems
    return { easy: 0.1, medium: 0.4, hard: 0.5 }
  }
  // Specialist & Consultant / Grandmaster (1700+): tough subspecialty differentials
  return { easy: 0.05, medium: 0.25, hard: 0.7 }
}

export class MedMcqaProvider implements QuestionProvider {
  readonly source = 'medmcqa'

  constructor(private readonly client: SupabaseClient<Database>) {}

  async getQuestions(query: QuestionQuery): Promise<BattleQuestion[]> {
    const targetCount = query.count || 10
    const rating = query.rating || 1000
    const distribution = getDifficultyDistribution(rating)

    try {
      let baseQuery = this.client
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      const { category } = query
      if (category.kind === 'subject') {
        baseQuery = baseQuery.eq('subject', category.code)
      } else if (category.kind === 'group') {
        baseQuery = baseQuery.eq('subject_group', category.group)
      }

      const { count, error: countError } = await baseQuery
      if (countError) throw countError

      const totalMatching = count ?? 0

      if (totalMatching === 0) {
        return this.getFallbackBatch(targetCount, query.category, rating)
      }

      // Compute randomized offset window
      const maxOffset = Math.max(0, totalMatching - targetCount - 5)
      const randomOffset = Math.floor(Math.random() * (maxOffset + 1))
      const fetchLimit = Math.min(80, Math.max(targetCount * 3, 30))

      let dataQuery = this.client
        .from('questions')
        .select('*')
        .eq('is_active', true)
        .range(randomOffset, randomOffset + fetchLimit - 1)

      if (category.kind === 'subject') {
        dataQuery = dataQuery.eq('subject', category.code)
      } else if (category.kind === 'group') {
        dataQuery = dataQuery.eq('subject_group', category.group)
      }

      const { data, error } = await dataQuery
      if (error || !data || data.length === 0) {
        if (error) console.warn('Questions query returned error:', error.message)
        return this.getFallbackBatch(targetCount, query.category, rating)
      }

      const mapped = data.map(toBattleQuestion)

      // Sample questions according to Elo difficulty distribution
      const easyPool = mapped.filter((q) => q.difficulty === 'easy')
      const medPool = mapped.filter((q) => q.difficulty === 'medium')
      const hardPool = mapped.filter((q) => q.difficulty === 'hard')

      const easyCount = Math.round(targetCount * distribution.easy)
      const hardCount = Math.round(targetCount * distribution.hard)
      const medCount = targetCount - easyCount - hardCount

      const selected: BattleQuestion[] = [
        ...shuffle(easyPool).slice(0, easyCount),
        ...shuffle(medPool).slice(0, medCount),
        ...shuffle(hardPool).slice(0, hardCount),
      ]

      // If distribution pools didn't have enough, fill remaining from shuffled pool
      if (selected.length < targetCount) {
        const remaining = shuffle(mapped.filter((q) => !selected.some((s) => s.id === q.id)))
        selected.push(...remaining.slice(0, targetCount - selected.length))
      }

      return shuffle(selected).slice(0, targetCount)
    } catch (err) {
      console.warn('Failed to fetch questions from Supabase, using fallback sample:', err)
      return this.getFallbackBatch(targetCount, query.category, rating)
    }
  }

  private getFallbackBatch(
    count: number,
    category: QuestionQuery['category'],
    rating: number = 1000,
  ): BattleQuestion[] {
    const distribution = getDifficultyDistribution(rating)

    let pool = FALLBACK_QUESTIONS
    if (category.kind === 'subject') {
      const match = FALLBACK_QUESTIONS.filter((q) => q.subject === category.code)
      if (match.length > 0) pool = match
    }

    const easyPool = pool.filter((q) => q.difficulty === 'easy')
    const medPool = pool.filter((q) => q.difficulty === 'medium')
    const hardPool = pool.filter((q) => q.difficulty === 'hard')

    const easyTarget = Math.max(1, Math.round(count * distribution.easy))
    const hardTarget = Math.max(1, Math.round(count * distribution.hard))
    const medTarget = Math.max(1, count - easyTarget - hardTarget)

    const sampled: BattleQuestion[] = []
    const fillFrom = (src: BattleQuestion[], target: number) => {
      const shuf = shuffle(src.length > 0 ? src : pool)
      let i = 0
      while (sampled.length < count && i < target) {
        sampled.push(shuf[i % shuf.length])
        i++
      }
    }

    fillFrom(easyPool, easyTarget)
    fillFrom(medPool, medTarget)
    fillFrom(hardPool, hardTarget)

    // Ensure exact count with unique IDs
    const result: BattleQuestion[] = []
    let counter = 1
    for (const q of shuffle(sampled).slice(0, count)) {
      result.push({
        ...q,
        id: `${q.id}_${counter++}`,
      })
    }

    while (result.length < count) {
      const q = pool[result.length % pool.length]
      result.push({
        ...q,
        id: `${q.id}_${counter++}`,
      })
    }

    return result.slice(0, count)
  }
}
