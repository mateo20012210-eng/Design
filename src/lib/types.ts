export const CATEGORIES = [
  'Fit / Behavioral',
  'Accounting',
  'Enterprise Value vs. Equity Value',
  'Valuation',
  'DCF',
  'M&A / Merger Models',
  'LBO',
  'Debt, Restructuring & Credit',
  'Markets & Brain Teasers',
] as const;

export type Category = (typeof CATEGORIES)[number];
export type Difficulty = 'Basic' | 'Advanced';

export interface Card {
  id: string;
  category: Category;
  difficulty: Difficulty;
  question: string;
  /** 1–3 sentence answer you'd say first in the interview. */
  keyAnswer: string;
  /** Full explanation in lightweight markdown. */
  explanation: string;
  commonMistakes?: string[];
  followUps?: string[];
  ifrsNote?: string;
  tags: string[];
}

export type Grade = 'got' | 'shaky' | 'missed';

/** Spaced-repetition state of one card (Leitner, 5 boxes). */
export interface CardProgress {
  box: number; // 1..5
  due: string; // ISO date-time when the card becomes due again
  lastReviewed: string; // ISO date-time of the last review
  reviews: number;
  lapses: number; // number of "missed" grades
}

export interface ReviewLogEntry {
  cardId: string;
  grade: Grade;
  at: string; // ISO date-time
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'S' | 'M' | 'L';
  timerEnabled: boolean;
  timerSeconds: number;
  onboardingDone: boolean;
  focusMode: boolean;
  lastSeenEdition: string | null;
}

export interface DealNotes {
  summary: string;
  rationale: string;
  valuation: string;
  financing: string;
  whyItMatters: string;
  risks: string;
  myView: string;
}

export interface SavedDeal {
  id: string; // news item id
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  dealType: DealType;
  region: Region;
  dealSize?: string;
  excerpt?: string;
  savedAt: string;
  updatedAt: string;
  notes: DealNotes;
}

export interface UserState {
  version: 1;
  progress: Record<string, CardProgress>;
  bookmarks: string[];
  reviewLog: ReviewLogEntry[];
  deals: Record<string, SavedDeal>;
  settings: Settings;
}

// ---- Market Pulse ----

export const DEAL_TYPES = ['M&A', 'Private Equity / Buyouts', 'ECM / IPOs', 'DCM / Leveraged Finance', 'Restructuring'] as const;
export type DealType = (typeof DEAL_TYPES)[number];

export const REGIONS = ['North America', 'Europe', 'Latin America', 'APAC', 'Middle East & Africa', 'Global'] as const;
export type Region = (typeof REGIONS)[number];

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string; // ISO
  dealType: DealType;
  region: Region;
  dealSize?: string;
  excerpt?: string;
  score: number;
  alsoCoveredBy: { source: string; url: string }[];
}

export interface EditionMeta {
  generatedAt: string;
  sourcesOk: string[];
  sourcesFailed: { name: string; error: string }[];
  totalFetched: number;
  totalRelevant: number;
}

export interface Edition {
  week: string; // ISO week id e.g. 2026-W40
  from: string; // ISO date (Monday)
  to: string; // ISO date (Sunday)
  top: string[]; // ids of the top 5 items
  items: NewsItem[];
  meta: EditionMeta;
}

export interface EditionIndex {
  latest: string | null;
  editions: { week: string; from: string; to: string; items: number; generatedAt: string }[];
}
