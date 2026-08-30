export type ProductType = 'EPB' | 'OPB' | '1206';

export type WorkMode = 'organize' | 'individual' | 'full' | 'murderboard';

export interface FormData {
  id?: string;
  updatedAt?: number;
  title?: string;
  productType: ProductType;
  rankGrade: string;
  afsc: string;
  charLimit: number;
  workMode: WorkMode;
  name?: string;
  dutyTitle?: string;
  unit?: string;
  ratingPeriod?: string;
  priorEvaluations?: string;
  rawNotes: string;
}

export interface StatementItem {
  id: string;
  section: string;
  statement: string;
  charCount: number;
  originalNote?: string;
  placeholders: string[];
  causalIntegrity: 'Strong' | 'Moderate' | 'Weak' | 'Caution';
  actionVerb?: string;
  notes?: string;
}

export interface SectionGroup {
  name: string;
  description?: string;
  targetCount?: number;
  statements: StatementItem[];
}

export interface KeyIssue {
  id: string;
  category: 'Causation' | 'Inflation' | 'Metrics' | 'Scope' | 'Acronym' | 'Placement';
  severity: 'high' | 'medium' | 'low';
  issue: string;
  recommendation: string;
}

export interface ChiefReviewItem {
  chiefTitle: 'Functional Chief' | 'Operations Chief' | 'Personnel Chief' | 'Cynical MAJCOM Chief';
  focusArea: string;
  analysis: string;
  strengths: string[];
  weaknesses: string[];
  gradeRating: string;
}

export interface MurderboardReview {
  functionalChief: ChiefReviewItem;
  operationsChief: ChiefReviewItem;
  personnelChief: ChiefReviewItem;
  cynicalMajcomChief: ChiefReviewItem;
  verdictScore: number; // 1 to 10
  verdictSummary: string;
  pathToTen: string[];
}

export interface NextStepOption {
  id: string;
  label: string;
  description?: string;
  actionType: 'refine_statement' | 'tighten_chars' | 'inject_metrics' | 'run_murderboard' | 'fix_causality' | 'rebalance_sections' | 'custom';
  targetSection?: string;
  targetStatementId?: string;
  instructionPrompt?: string;
}

export interface EngineResult {
  blufSummary: string;
  productType: ProductType;
  rankGrade: string;
  afsc: string;
  charLimit: number;
  dutyDescription?: string;
  dutyDescriptionCharCount?: number;
  sections: SectionGroup[];
  additionalComments?: string;
  keyIssues: KeyIssue[];
  murderboardRisks?: string[];
  murderboardReview?: MurderboardReview;
  nextSteps: NextStepOption[];
  isPartialOrganizationOnly: boolean;
  missingRequiredFields: string[];
  hasPriorRecords: boolean;
  priorRecordsWarningMessage?: string;
  redTeamDisclaimer: string;
  generatedAt: number;
}

export interface SensitiveDetectionResult {
  isSensitive: boolean;
  detectedTypes: string[];
  warningMessage: string;
}
