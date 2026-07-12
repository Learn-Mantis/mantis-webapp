/**
 * Canonical subject taxonomy + MBBS phase grouping. Single source of truth used
 * by Battle matchmaking, QBank, and question ingestion. Codes match
 * `pyq/schema/subjects.json`.
 */

export type SubjectGroup = 'pre-clinical' | 'para-clinical' | 'clinical'

export interface Subject {
  code: string
  name: string
  group: SubjectGroup
}

export const SUBJECTS: Subject[] = [
  // Pre-clinical
  { code: 'anatomy', name: 'Anatomy', group: 'pre-clinical' },
  { code: 'physiology', name: 'Physiology', group: 'pre-clinical' },
  { code: 'biochemistry', name: 'Biochemistry', group: 'pre-clinical' },
  // Para-clinical
  { code: 'pathology', name: 'Pathology', group: 'para-clinical' },
  { code: 'pharmacology', name: 'Pharmacology', group: 'para-clinical' },
  { code: 'microbiology', name: 'Microbiology', group: 'para-clinical' },
  { code: 'fmt', name: 'Forensic Medicine', group: 'para-clinical' },
  { code: 'psm', name: 'PSM', group: 'para-clinical' },
  // Clinical
  { code: 'medicine', name: 'Medicine', group: 'clinical' },
  { code: 'surgery', name: 'Surgery', group: 'clinical' },
  { code: 'obgyn', name: 'OBG', group: 'clinical' },
  { code: 'pediatrics', name: 'Pediatrics', group: 'clinical' },
  { code: 'ent', name: 'ENT', group: 'clinical' },
  { code: 'ophthalmology', name: 'Ophthalmology', group: 'clinical' },
  { code: 'orthopedics', name: 'Orthopedics', group: 'clinical' },
  { code: 'dermatology', name: 'Dermatology', group: 'clinical' },
  { code: 'psychiatry', name: 'Psychiatry', group: 'clinical' },
  { code: 'radiology', name: 'Radiology', group: 'clinical' },
  { code: 'anaesthesia', name: 'Anesthesia', group: 'clinical' },
]

export const SUBJECT_GROUPS: { key: SubjectGroup; label: string }[] = [
  { key: 'pre-clinical', label: 'Pre Clinical' },
  { key: 'para-clinical', label: 'Para Clinical' },
  { key: 'clinical', label: 'Clinical' },
]

export function subjectsByGroup(group: SubjectGroup): Subject[] {
  return SUBJECTS.filter((s) => s.group === group)
}

export function subjectName(code: string): string {
  return SUBJECTS.find((s) => s.code === code)?.name ?? code
}

/** Category selection surfaced in Battle matchmaking (Step 1). */
export type BattleCategory =
  | { kind: 'all' }
  | { kind: 'group'; group: SubjectGroup }
  | { kind: 'subject'; code: string }

export interface BattleCategoryOption {
  id: string
  label: string
  category: BattleCategory
}

export const BATTLE_CATEGORIES: BattleCategoryOption[] = [
  { id: 'all', label: 'All Subjects', category: { kind: 'all' } },
  ...SUBJECT_GROUPS.map((g) => ({
    id: g.key,
    label: g.label,
    category: { kind: 'group', group: g.key } as BattleCategory,
  })),
  ...SUBJECTS.map((s) => ({
    id: s.code,
    label: s.name,
    category: { kind: 'subject', code: s.code } as BattleCategory,
  })),
]
