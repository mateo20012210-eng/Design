import type { Card, Category, Difficulty, UserState } from './types';
import { ALL_CARDS, shuffle } from './cards';
import { isDue, sortDueFirst } from './srs';

export type StudyMode = 'category' | 'smart' | 'shuffle' | 'mock' | 'bookmarks' | 'ids';

export interface SessionConfig {
  mode: StudyMode;
  categories?: Category[];
  difficulty?: Difficulty | 'All';
  count?: number; // mock interview size
  timer?: boolean;
  ids?: string[];
  seed?: number;
}

export function parseSessionParams(params: URLSearchParams): SessionConfig {
  const mode = (params.get('mode') ?? 'shuffle') as StudyMode;
  const cats = params.get('cats');
  const diff = (params.get('diff') ?? 'All') as Difficulty | 'All';
  const count = Number(params.get('n') ?? 0) || undefined;
  const timer = params.get('timer') === '1';
  const ids = params.get('ids')?.split(',').filter(Boolean);
  const seed = Number(params.get('seed') ?? 0) || undefined;
  return {
    mode,
    categories: cats ? (cats.split('|').filter(Boolean) as Category[]) : undefined,
    difficulty: diff,
    count,
    timer,
    ids,
    seed,
  };
}

export function sessionTitle(cfg: SessionConfig): string {
  switch (cfg.mode) {
    case 'smart':
      return 'Smart Review';
    case 'shuffle':
      return 'Shuffle All';
    case 'mock':
      return `Mock Interview · ${cfg.count ?? 10} questions`;
    case 'bookmarks':
      return 'Bookmarked cards';
    case 'ids':
      return 'Selected cards';
    case 'category':
      return cfg.categories && cfg.categories.length === 1 ? cfg.categories[0] : `${cfg.categories?.length ?? 0} categories`;
  }
}

function applyDifficulty(cards: Card[], difficulty?: Difficulty | 'All'): Card[] {
  if (!difficulty || difficulty === 'All') return cards;
  return cards.filter((c) => c.difficulty === difficulty);
}

/** Build the ordered list of cards for a study session. */
export function buildSession(cfg: SessionConfig, state: UserState, now: Date = new Date(), all: Card[] = ALL_CARDS): Card[] {
  switch (cfg.mode) {
    case 'category': {
      const cats = new Set(cfg.categories ?? []);
      const cards = applyDifficulty(all.filter((c) => cats.has(c.category)), cfg.difficulty);
      return sortDueFirst(shuffle(cards, cfg.seed), state.progress);
    }
    case 'smart': {
      const cards = applyDifficulty(
        all.filter((c) => isDue(state.progress[c.id], now)),
        cfg.difficulty,
      );
      return sortDueFirst(shuffle(cards, cfg.seed), state.progress);
    }
    case 'shuffle':
      return shuffle(applyDifficulty(all, cfg.difficulty), cfg.seed);
    case 'mock': {
      const n = cfg.count ?? 10;
      const fitCount = Math.max(2, Math.round(n * 0.3));
      const fit = shuffle(all.filter((c) => c.category === 'Fit / Behavioral'), cfg.seed).slice(0, fitCount);
      const tech = shuffle(all.filter((c) => c.category !== 'Fit / Behavioral' && c.category !== 'Markets & Brain Teasers'), cfg.seed ? cfg.seed + 1 : undefined).slice(0, n - fitCount);
      // Interviews usually open with fit, then technicals, but mix a little.
      return [...fit.slice(0, 1), ...shuffle([...fit.slice(1), ...tech], cfg.seed ? cfg.seed + 2 : undefined)];
    }
    case 'bookmarks': {
      const set = new Set(state.bookmarks);
      return all.filter((c) => set.has(c.id));
    }
    case 'ids': {
      const map = new Map(all.map((c) => [c.id, c]));
      return (cfg.ids ?? []).map((id) => map.get(id)).filter((c): c is Card => !!c);
    }
  }
}

export function buildSessionUrl(cfg: SessionConfig): string {
  const p = new URLSearchParams();
  p.set('mode', cfg.mode);
  if (cfg.categories?.length) p.set('cats', cfg.categories.join('|'));
  if (cfg.difficulty && cfg.difficulty !== 'All') p.set('diff', cfg.difficulty);
  if (cfg.count) p.set('n', String(cfg.count));
  if (cfg.timer) p.set('timer', '1');
  if (cfg.ids?.length) p.set('ids', cfg.ids.join(','));
  p.set('seed', String(cfg.seed ?? Math.floor(Math.random() * 1e9)));
  return `/study?${p.toString()}`;
}
