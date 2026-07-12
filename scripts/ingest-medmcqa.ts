/**
 * MedMCQA → Supabase ingestion.
 *
 * Reads a MedMCQA JSONL file and upserts rows into `public.questions` behind the
 * QuestionProvider abstraction's schema. Idempotent on (source, source_id).
 *
 * Usage:
 *   1. Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, MEDMCQA_FILE in .env.local
 *   2. npm run ingest:medmcqa
 *
 * MedMCQA is released for research use — retain attribution when publishing.
 */
import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'
import { config as loadEnv } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { SUBJECTS } from '../lib/config/subjects'

loadEnv({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const FILE = process.env.MEDMCQA_FILE ?? './scripts/data/medmcqa-train.jsonl'
const BATCH_SIZE = 500

type Difficulty = 'easy' | 'medium' | 'hard'
type CorrectOption = 'A' | 'B' | 'C' | 'D'

// MedMCQA `cop` is 1-indexed (1=A, 2=B, 3=C, 4=D) — confirmed against both the
// official repo (medmcqa/medmcqa: dataset.py does `label = cop - 1`) and the
// Hugging Face mirror (openlifescienceai/medmcqa), which share the same example
// record (cop: 1 → opa "Leukemoid reaction").
const OPTION_BY_COP: Record<number, CorrectOption> = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' }

// MedMCQA has no difficulty label — assign a configurable default.
const DEFAULT_DIFFICULTY: Difficulty = 'medium'

// MedMCQA subject_name → our taxonomy code.
const SUBJECT_MAP: Record<string, string> = {
  Anatomy: 'anatomy',
  Physiology: 'physiology',
  Biochemistry: 'biochemistry',
  Pathology: 'pathology',
  Pharmacology: 'pharmacology',
  Microbiology: 'microbiology',
  'Forensic Medicine': 'fmt',
  'Social & Preventive Medicine': 'psm',
  Medicine: 'medicine',
  Surgery: 'surgery',
  'Gynaecology & Obstetrics': 'obgyn',
  Pediatrics: 'pediatrics',
  ENT: 'ent',
  Ophthalmology: 'ophthalmology',
  Orthopaedics: 'orthopedics',
  Skin: 'dermatology',
  Psychiatry: 'psychiatry',
  Radiology: 'radiology',
  Anaesthesia: 'anaesthesia',
}

const GROUP_BY_CODE = new Map(SUBJECTS.map((s) => [s.code, s.group]))

interface MedMcqaRow {
  id?: string
  question?: string
  opa?: string
  opb?: string
  opc?: string
  opd?: string
  cop?: number
  exp?: string | null
  subject_name?: string
  topic_name?: string | null
  /** 'single' or 'multi' — our schema only supports one correct_option, so 'multi' rows are skipped. */
  choice_type?: string
}

interface QuestionInsert {
  source: 'medmcqa'
  source_id: string
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: CorrectOption
  explanation: string | null
  subject: string
  subject_group: string | null
  topic: string | null
  difficulty: Difficulty
}

function mapRow(raw: MedMcqaRow): QuestionInsert | null {
  if (!raw.id || !raw.question || raw.cop == null) return null
  if (raw.choice_type && raw.choice_type !== 'single') return null // our schema has one correct_option
  const correct = OPTION_BY_COP[raw.cop]
  const subject = raw.subject_name ? SUBJECT_MAP[raw.subject_name] : undefined
  if (!correct || !subject) return null // skip unmapped subjects (e.g. Dental/Unknown)
  if (!raw.opa || !raw.opb || !raw.opc || !raw.opd) return null

  return {
    source: 'medmcqa',
    source_id: String(raw.id),
    question: raw.question,
    option_a: raw.opa,
    option_b: raw.opb,
    option_c: raw.opc,
    option_d: raw.opd,
    correct_option: correct,
    explanation: raw.exp ?? null,
    subject,
    subject_group: GROUP_BY_CODE.get(subject) ?? null,
    topic: raw.topic_name ?? null,
    difficulty: DEFAULT_DIFFICULTY,
  }
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  })

  const rl = createInterface({
    input: createReadStream(FILE, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  })

  let batch: QuestionInsert[] = []
  let total = 0
  let skipped = 0

  async function flush() {
    if (batch.length === 0) return
    const { error } = await supabase.from('questions').upsert(batch, { onConflict: 'source,source_id' })
    if (error) {
      console.error('Upsert failed:', error.message)
      process.exit(1)
    }
    total += batch.length
    process.stdout.write(`\rInserted ${total} questions…`)
    batch = []
  }

  for await (const line of rl) {
    const trimmed = line.trim()
    if (!trimmed) continue
    let parsed: MedMcqaRow
    try {
      parsed = JSON.parse(trimmed)
    } catch {
      skipped++
      continue
    }
    const row = mapRow(parsed)
    if (!row) {
      skipped++
      continue
    }
    batch.push(row)
    if (batch.length >= BATCH_SIZE) await flush()
  }
  await flush()

  console.log(`\nDone. Inserted ${total} questions, skipped ${skipped}.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
