import type { Card, Category } from './types';
import { CATEGORIES } from './types';

// Vite bundles every JSON file in src/data at build time → fully offline.
const modules = import.meta.glob<{ default: Card[] }>('../data/*.json', { eager: true });

const ORDER: Record<Category, number> = Object.fromEntries(CATEGORIES.map((c, i) => [c, i])) as Record<Category, number>;

export const ALL_CARDS: Card[] = Object.values(modules)
  .flatMap((m) => m.default)
  .sort((a, b) => ORDER[a.category] - ORDER[b.category] || a.id.localeCompare(b.id));

export const CARD_BY_ID: Map<string, Card> = new Map(ALL_CARDS.map((c) => [c.id, c]));

export interface CategoryMeta {
  name: Category;
  short: string;
  /** Tailwind classes for the badge (light + dark). */
  badge: string;
  /** Solid colour used for progress bars. */
  bar: string;
  icon: string;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  'Fit / Behavioral': { name: 'Fit / Behavioral', short: 'Fit', badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200', bar: '#e11d48', icon: '💬' },
  Accounting: { name: 'Accounting', short: 'Accounting', badge: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200', bar: '#0284c7', icon: '📒' },
  'Enterprise Value vs. Equity Value': { name: 'Enterprise Value vs. Equity Value', short: 'EV vs. Equity', badge: 'bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200', bar: '#7c3aed', icon: '⚖️' },
  Valuation: { name: 'Valuation', short: 'Valuation', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200', bar: '#d97706', icon: '📊' },
  DCF: { name: 'DCF', short: 'DCF', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200', bar: '#059669', icon: '📈' },
  'M&A / Merger Models': { name: 'M&A / Merger Models', short: 'M&A', badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200', bar: '#4f46e5', icon: '🤝' },
  LBO: { name: 'LBO', short: 'LBO', badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200', bar: '#ea580c', icon: '🏗️' },
  'Debt, Restructuring & Credit': { name: 'Debt, Restructuring & Credit', short: 'Debt & Credit', badge: 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200', bar: '#0d9488', icon: '🏦' },
  'Markets & Brain Teasers': { name: 'Markets & Brain Teasers', short: 'Markets', badge: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/50 dark:text-fuchsia-200', bar: '#c026d3', icon: '🧠' },
};

export function cardsByCategory(): Record<Category, Card[]> {
  const out = Object.fromEntries(CATEGORIES.map((c) => [c, [] as Card[]])) as Record<Category, Card[]>;
  for (const c of ALL_CARDS) out[c.category].push(c);
  return out;
}

const WORD = /[a-z0-9$%]+/g;
export function searchCards(query: string, cards: Card[] = ALL_CARDS): Card[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.match(WORD) ?? [];
  if (terms.length === 0) return [];
  const scored: { card: Card; score: number }[] = [];
  for (const card of cards) {
    const question = card.question.toLowerCase();
    const key = card.keyAnswer.toLowerCase();
    const body = `${card.explanation} ${card.tags.join(' ')} ${(card.followUps ?? []).join(' ')}`.toLowerCase();
    let score = 0;
    let allFound = true;
    for (const t of terms) {
      if (question.includes(t)) score += 10;
      else if (key.includes(t)) score += 5;
      else if (body.includes(t)) score += 2;
      else allFound = false;
    }
    if (question.includes(q)) score += 25;
    if (allFound && score > 0) scored.push({ card, score });
  }
  return scored.sort((a, b) => b.score - a.score).map((s) => s.card);
}

/** Deterministic shuffle with an optional seed (Fisher–Yates). */
export function shuffle<T>(arr: T[], seed?: number): T[] {
  const a = [...arr];
  let s = seed ?? Math.floor(Math.random() * 2 ** 31);
  const rnd = () => {
    s = (s * 1664525 + 1013904223) % 2 ** 32;
    return s / 2 ** 32;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
