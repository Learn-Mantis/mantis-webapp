/**
 * Five hand-checked questions for the signed-out demo on the landing page.
 * Answers are deliberately spread across A–D. Every fact here was verified;
 * edit with the same care.
 */

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

export const DEMO_QUESTIONS: ClinicalVignette[] = [
  {
    id: 'onb-1',
    subject: 'medicine',
    subjectLabel: 'Cardiology',
    difficulty: 'medium',
    question:
      'A 58-year-old male with long-standing hypertension presents with sudden severe tearing chest pain radiating to the interscapular region. Blood pressure in the right arm is 180/100 mmHg and left arm is 130/70 mmHg. What is the investigation of choice to confirm the diagnosis in this hemodynamically stable patient?',
    options: {
      A: 'Transthoracic Echocardiogram (TTE)',
      B: 'Coronary Angiography',
      C: 'Contrast-Enhanced CT Angiography (CTA) of the chest',
      D: '12-Lead Electrocardiogram',
    },
    correctOption: 'C',
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
      'A 24-year-old female presents with a single acute acetaminophen overdose. The serum acetaminophen level drawn 4 hours after ingestion falls above the Rumack-Matthew nomogram treatment line. What is the specific antidote and its mechanism of action?',
    options: {
      A: 'N-acetylcysteine (NAC) — Restores hepatic glutathione stores',
      B: 'Deferoxamine — Iron chelation',
      C: 'Flumazenil — Competitive GABA-A antagonism',
      D: 'Pralidoxime — Reactivates acetylcholinesterase',
    },
    correctOption: 'A',
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
      B: 'Tetralogy of Fallot',
      C: 'Coarctation of the Aorta',
      D: 'Coronary Artery Aneurysms',
    },
    correctOption: 'D',
    explanation:
      'Kawasaki disease (Mucocutaneous Lymph Node Syndrome) is a medium-vessel vasculitis. The most dreaded complication is Coronary Artery Aneurysms (occurs in ~25% of untreated cases). Treatment with IVIG and high-dose Aspirin significantly reduces this risk.',
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
      'Acute calculous cholecystitis with sonographic signs of inflammation (wall thickness > 3mm, Murphy’s sign, pericholecystic fluid) is definitively managed by early laparoscopic cholecystectomy (ideally within 72 hours of symptom onset).',
    clinicalPearl:
      'Early laparoscopic cholecystectomy reduces total hospital stay and complication rates compared to interval delayed surgery.',
  },
  {
    id: 'onb-5',
    subject: 'pathology',
    subjectLabel: 'Hematopathology',
    difficulty: 'medium',
    question:
      'A 32-year-old female presents with severe fatigue, pallor, and jaundice. Peripheral blood smear reveals numerous spherocytes and polychromasia. Direct Antiglobulin Test (Coombs test) is strongly positive with IgG. What is the diagnosis?',
    options: {
      A: 'Warm Autoimmune Hemolytic Anemia (AIHA)',
      B: 'Hereditary Spherocytosis',
      C: 'Cold Agglutinin Disease',
      D: 'Paroxysmal Nocturnal Hemoglobinuria',
    },
    correctOption: 'A',
    explanation:
      'Warm Autoimmune Hemolytic Anemia is mediated by IgG antibodies (active at 37°C) causing extravascular hemolysis in the spleen. It is distinguished from Hereditary Spherocytosis by a positive Direct Coombs Test (Hereditary Spherocytosis is Coombs negative).',
    clinicalPearl:
      'IgG antibodies = Warm AIHA (extravascular, spleen); IgM antibodies = Cold agglutinin disease (complement-mediated; mainly extravascular in the liver).',
  },
]
