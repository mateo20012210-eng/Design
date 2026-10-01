/**
 * Validates the flashcard question bank in src/data/*.json.
 * Run with: npm run validate-data
 */
import fs from 'node:fs';
import path from 'node:path';
import { cardArraySchema } from '../src/lib/schema';
import type { Card, Category } from '../src/lib/types';

const DATA_DIR = path.resolve('src/data');
const MIN_TOTAL = 280;
const MIN_PER_CATEGORY: Record<Category, number> = {
  'Fit / Behavioral': 30,
  Accounting: 45,
  'Enterprise Value vs. Equity Value': 30,
  Valuation: 35,
  DCF: 35,
  'M&A / Merger Models': 35,
  LBO: 30,
  'Debt, Restructuring & Credit': 12,
  'Markets & Brain Teasers': 12,
};

const FILE_PREFIX: Record<string, Category> = {
  'fit.json': 'Fit / Behavioral',
  'accounting.json': 'Accounting',
  'ev-equity.json': 'Enterprise Value vs. Equity Value',
  'valuation.json': 'Valuation',
  'dcf.json': 'DCF',
  'ma.json': 'M&A / Merger Models',
  'lbo.json': 'LBO',
  'debt.json': 'Debt, Restructuring & Credit',
  'markets.json': 'Markets & Brain Teasers',
};

const STOP = new Set(['the', 'a', 'an', 'of', 'to', 'in', 'and', 'or', 'is', 'are', 'what', 'how', 'do', 'does', 'you', 'would', 'for', 'on', 'it', 'be', 'that', 'this', 'with', 'by', 'as', 'at', 'from', 'can', 'if', 'why', 'me', 'your', 'about', 'walk', 'through']);

function tokens(q: string): Set<string> {
  return new Set(
    q
      .toLowerCase()
      .replace(/[^a-z0-9$% ]+/g, ' ')
      .split(/\s+/)
      .filter((w) => w && !STOP.has(w)),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

let errors: string[] = [];
const warnings: string[] = [];
const all: Card[] = [];
const files = fs.existsSync(DATA_DIR) ? fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json')) : [];

for (const file of files) {
  const raw = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    errors.push(`${file}: invalid JSON (${(e as Error).message})`);
    continue;
  }
  const parsed = cardArraySchema.safeParse(json);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const idx = issue.path[0];
      const id = Array.isArray(json) && typeof idx === 'number' ? (json[idx] as { id?: string })?.id ?? `#${idx}` : String(idx);
      errors.push(`${file} [${id}] ${issue.path.slice(1).join('.')}: ${issue.message}`);
    }
    continue;
  }
  const expectedCategory = FILE_PREFIX[file];
  for (const card of parsed.data) {
    if (expectedCategory && card.category !== expectedCategory) {
      errors.push(`${file} [${card.id}] category "${card.category}" does not match file (${expectedCategory})`);
    }
    if (/\.\.\.$|…$/.test(card.keyAnswer.trim())) warnings.push(`[${card.id}] keyAnswer looks truncated`);
    if (/\bTODO\b|\bTBD\b|lorem ipsum/i.test(JSON.stringify(card))) errors.push(`[${card.id}] contains placeholder text`);
    all.push(card as Card);
  }
}

// Unique IDs
const seen = new Map<string, number>();
for (const c of all) seen.set(c.id, (seen.get(c.id) ?? 0) + 1);
for (const [id, n] of seen) if (n > 1) errors.push(`duplicate id "${id}" (${n} times)`);

// Near-duplicate questions
const toks = all.map((c) => tokens(c.question));
for (let i = 0; i < all.length; i++) {
  for (let j = i + 1; j < all.length; j++) {
    const s = jaccard(toks[i], toks[j]);
    if (s >= 0.8) errors.push(`near-duplicate questions: ${all[i].id} vs ${all[j].id} (similarity ${s.toFixed(2)})`);
    else if (s >= 0.65) warnings.push(`similar questions: ${all[i].id} vs ${all[j].id} (similarity ${s.toFixed(2)})`);
  }
}

// Counts
const counts: Record<string, number> = {};
for (const c of all) counts[c.category] = (counts[c.category] ?? 0) + 1;
for (const [cat, min] of Object.entries(MIN_PER_CATEGORY)) {
  const n = counts[cat] ?? 0;
  if (n < min) errors.push(`category "${cat}" has ${n} cards (minimum ${min})`);
}
if (all.length < MIN_TOTAL) errors.push(`total cards ${all.length} < ${MIN_TOTAL}`);

const basic = all.filter((c) => c.difficulty === 'Basic').length;
console.log('Question bank summary');
console.log('---------------------');
for (const cat of Object.keys(MIN_PER_CATEGORY)) console.log(`${(counts[cat] ?? 0).toString().padStart(4)}  ${cat}`);
console.log(`${all.length.toString().padStart(4)}  TOTAL  (${basic} Basic / ${all.length - basic} Advanced)`);
console.log(`${all.filter((c) => c.ifrsNote).length.toString().padStart(4)}  cards with an IFRS note`);
console.log('');
if (warnings.length) {
  console.log(`Warnings (${warnings.length}):`);
  for (const w of warnings) console.log('  - ' + w);
  console.log('');
}
if (errors.length) {
  console.error(`Errors (${errors.length}):`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log('OK: question bank is valid.');
