import { describe, expect, it } from 'vitest';
import { createExport, decodeCompact, encodeCompact, mergeImport, overwriteImport, parseImport } from '../src/lib/sync';
import { emptyState } from '../src/lib/storage';
import type { SavedDeal, UserState } from '../src/lib/types';

const deal = (id: string, updatedAt: string, summary = ''): SavedDeal => ({
  id,
  title: 'Deal ' + id,
  source: 'S',
  url: 'https://e.com/' + id,
  publishedAt: '2026-09-01',
  dealType: 'M&A',
  region: 'Europe',
  savedAt: updatedAt,
  updatedAt,
  notes: { summary, rationale: '', valuation: '', financing: '', whyItMatters: '', risks: '', myView: '' },
});

function stateA(): UserState {
  const s = emptyState();
  s.progress = {
    'acc-001': { box: 3, due: '2026-10-05T00:00:00Z', lastReviewed: '2026-10-01T00:00:00Z', reviews: 3, lapses: 0 },
    'acc-002': { box: 1, due: '2026-10-02T00:00:00Z', lastReviewed: '2026-09-20T00:00:00Z', reviews: 1, lapses: 1 },
  };
  s.bookmarks = ['acc-001'];
  s.reviewLog = [{ cardId: 'acc-001', grade: 'got', at: '2026-10-01T00:00:00Z' }];
  s.deals = { d1: deal('d1', '2026-09-10T00:00:00Z', 'old'), d2: deal('d2', '2026-09-12T00:00:00Z') };
  return s;
}

describe('export / import merge', () => {
  it('export payload is recognisable and excludes settings', () => {
    const p = createExport(stateA());
    expect(p.app).toBe('ib-interview-prep');
    expect((p as unknown as Record<string, unknown>).settings).toBeUndefined();
    expect(parseImport(JSON.stringify(p)).progress['acc-001'].box).toBe(3);
  });
  it('rejects foreign JSON', () => {
    expect(() => parseImport('{"foo":1}')).toThrow();
    expect(() => parseImport('garbage')).toThrow();
  });
  it('compact code round-trips', () => {
    const p = createExport(stateA());
    const code = encodeCompact(p);
    expect(code.startsWith('IBPREP1:')).toBe(true);
    expect(JSON.parse(decodeCompact(code))).toEqual(p);
    expect(parseImport(code).bookmarks).toEqual(['acc-001']);
  });
  it('merge keeps the most recent review per card and unions bookmarks and deals', () => {
    const current = stateA();
    const other = emptyState();
    other.progress = {
      'acc-001': { box: 1, due: '2026-09-26T00:00:00Z', lastReviewed: '2026-09-25T00:00:00Z', reviews: 2, lapses: 1 }, // older → ignored
      'acc-002': { box: 2, due: '2026-10-08T00:00:00Z', lastReviewed: '2026-10-02T00:00:00Z', reviews: 2, lapses: 1 }, // newer → wins
      'dcf-001': { box: 2, due: '2026-10-08T00:00:00Z', lastReviewed: '2026-10-02T00:00:00Z', reviews: 1, lapses: 0 }, // new → added
    };
    other.bookmarks = ['acc-001', 'dcf-001'];
    other.reviewLog = [
      { cardId: 'acc-001', grade: 'got', at: '2026-10-01T00:00:00Z' }, // duplicate
      { cardId: 'dcf-001', grade: 'got', at: '2026-10-02T00:00:00Z' },
    ];
    other.deals = { d1: deal('d1', '2026-09-20T00:00:00Z', 'newer notes'), d3: deal('d3', '2026-09-15T00:00:00Z') };
    const merged = mergeImport(current, createExport(other));
    expect(merged.progress['acc-001'].box).toBe(3);
    expect(merged.progress['acc-002'].box).toBe(2);
    expect(merged.progress['dcf-001'].box).toBe(2);
    expect(merged.bookmarks.sort()).toEqual(['acc-001', 'dcf-001']);
    expect(merged.reviewLog).toHaveLength(2);
    expect(Object.keys(merged.deals).sort()).toEqual(['d1', 'd2', 'd3']);
    expect(merged.deals.d1.notes.summary).toBe('newer notes');
    expect(merged.settings).toEqual(current.settings);
  });
  it('overwrite replaces data but keeps device settings', () => {
    const current = stateA();
    current.settings.theme = 'dark';
    const other = emptyState();
    other.progress = { 'val-001': { box: 5, due: '2026-11-01T00:00:00Z', lastReviewed: '2026-10-01T00:00:00Z', reviews: 9, lapses: 0 } };
    const result = overwriteImport(current, createExport(other));
    expect(Object.keys(result.progress)).toEqual(['val-001']);
    expect(result.deals).toEqual({});
    expect(result.settings.theme).toBe('dark');
  });
});
