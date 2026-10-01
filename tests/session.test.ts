import { describe, expect, it } from 'vitest';
import { buildSession, parseSessionParams, buildSessionUrl } from '../src/lib/session';
import { emptyState } from '../src/lib/storage';
import type { Card } from '../src/lib/types';

const mk = (id: string, category: Card['category'], difficulty: Card['difficulty'] = 'Basic'): Card => ({ id, category, difficulty, question: 'q ' + id, keyAnswer: 'a', explanation: 'e', tags: [] });
const cards: Card[] = [mk('fit-001', 'Fit / Behavioral'), mk('fit-002', 'Fit / Behavioral'), mk('acc-001', 'Accounting'), mk('acc-002', 'Accounting', 'Advanced'), mk('dcf-001', 'DCF'), mk('mkt-001', 'Markets & Brain Teasers')];
const now = new Date('2026-10-01T00:00:00Z');

describe('study session builder', () => {
  it('category + difficulty filter', () => {
    const s = buildSession({ mode: 'category', categories: ['Accounting'], difficulty: 'Advanced' }, emptyState(), now, cards);
    expect(s.map((c) => c.id)).toEqual(['acc-002']);
  });
  it('smart review only returns due cards', () => {
    const state = emptyState();
    state.progress['acc-001'] = { box: 3, due: '2026-10-10T00:00:00Z', lastReviewed: '2026-10-01T00:00:00Z', reviews: 1, lapses: 0 };
    state.progress['dcf-001'] = { box: 1, due: '2026-09-30T00:00:00Z', lastReviewed: '2026-09-29T00:00:00Z', reviews: 1, lapses: 1 };
    const ids = buildSession({ mode: 'smart' }, state, now, cards).map((c) => c.id);
    expect(ids).not.toContain('acc-001');
    expect(ids).toContain('dcf-001');
    expect(ids[0]).toBe('dcf-001'); // lowest box first
  });
  it('mock interview mixes fit and technicals and starts with fit', () => {
    const s = buildSession({ mode: 'mock', count: 4, seed: 1 }, emptyState(), now, cards);
    expect(s).toHaveLength(4);
    expect(s[0].category).toBe('Fit / Behavioral');
    expect(s.some((c) => c.category !== 'Fit / Behavioral')).toBe(true);
    expect(s.some((c) => c.category === 'Markets & Brain Teasers')).toBe(false);
  });
  it('bookmarks and ids modes', () => {
    const state = emptyState();
    state.bookmarks = ['dcf-001'];
    expect(buildSession({ mode: 'bookmarks' }, state, now, cards).map((c) => c.id)).toEqual(['dcf-001']);
    expect(buildSession({ mode: 'ids', ids: ['acc-002', 'nope', 'fit-001'] }, state, now, cards).map((c) => c.id)).toEqual(['acc-002', 'fit-001']);
  });
  it('shuffle is deterministic for a seed', () => {
    const a = buildSession({ mode: 'shuffle', seed: 42 }, emptyState(), now, cards).map((c) => c.id);
    const b = buildSession({ mode: 'shuffle', seed: 42 }, emptyState(), now, cards).map((c) => c.id);
    expect(a).toEqual(b);
    expect(a).toHaveLength(cards.length);
  });
  it('url round-trip', () => {
    const url = buildSessionUrl({ mode: 'category', categories: ['Accounting', 'DCF'], difficulty: 'Basic', seed: 7 });
    const cfg = parseSessionParams(new URLSearchParams(url.split('?')[1]));
    expect(cfg.mode).toBe('category');
    expect(cfg.categories).toEqual(['Accounting', 'DCF']);
    expect(cfg.difficulty).toBe('Basic');
    expect(cfg.seed).toBe(7);
  });
});
