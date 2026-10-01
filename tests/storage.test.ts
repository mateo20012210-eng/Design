import { describe, expect, it } from 'vitest';
import { loadState, saveState, STATE_KEY, SETTINGS_KEY, emptyState, DEFAULT_SETTINGS } from '../src/lib/storage';
import { reducer } from '../src/lib/store';

class MemoryStorage implements Storage {
  private m = new Map<string, string>();
  get length() {
    return this.m.size;
  }
  clear() {
    this.m.clear();
  }
  getItem(k: string) {
    return this.m.get(k) ?? null;
  }
  key(i: number) {
    return [...this.m.keys()][i] ?? null;
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  setItem(k: string, v: string) {
    this.m.set(k, v);
  }
}

describe('progress persistence', () => {
  it('returns defaults on an empty storage', () => {
    const s = loadState(new MemoryStorage());
    expect(s.progress).toEqual({});
    expect(s.settings).toEqual(DEFAULT_SETTINGS);
  });
  it('round-trips state and settings separately', () => {
    const storage = new MemoryStorage();
    let state = emptyState();
    state = reducer(state, { type: 'grade', cardId: 'acc-001', grade: 'got', at: new Date('2026-10-01T10:00:00Z') });
    state = reducer(state, { type: 'toggleBookmark', cardId: 'acc-001' });
    state = reducer(state, { type: 'setSettings', patch: { theme: 'dark', fontSize: 'L' } });
    saveState(state, storage);
    expect(storage.getItem(STATE_KEY)).toBeTruthy();
    expect(JSON.parse(storage.getItem(SETTINGS_KEY)!)).toMatchObject({ theme: 'dark', fontSize: 'L' });
    const loaded = loadState(storage);
    expect(loaded.progress['acc-001'].box).toBe(2);
    expect(loaded.bookmarks).toEqual(['acc-001']);
    expect(loaded.reviewLog).toHaveLength(1);
    expect(loaded.settings.theme).toBe('dark');
  });
  it('tolerates corrupted JSON', () => {
    const storage = new MemoryStorage();
    storage.setItem(STATE_KEY, '{not json');
    storage.setItem(SETTINGS_KEY, 'null');
    const s = loadState(storage);
    expect(s.progress).toEqual({});
    expect(s.settings.theme).toBe('system');
  });
  it('reset clears progress, log and bookmarks but keeps deals and settings', () => {
    let state = emptyState();
    state = reducer(state, { type: 'grade', cardId: 'x', grade: 'missed' });
    state = reducer(state, { type: 'toggleBookmark', cardId: 'x' });
    state = reducer(state, { type: 'saveDeal', deal: { id: 'n1', title: 'T', source: 'S', url: 'https://e.com', publishedAt: '2026-01-01', dealType: 'M&A', region: 'Europe' } });
    state = reducer(state, { type: 'setSettings', patch: { theme: 'dark' } });
    state = reducer(state, { type: 'resetProgress' });
    expect(state.progress).toEqual({});
    expect(state.bookmarks).toEqual([]);
    expect(state.reviewLog).toEqual([]);
    expect(Object.keys(state.deals)).toEqual(['n1']);
    expect(state.settings.theme).toBe('dark');
  });
  it('deal notes update bumps updatedAt and removal works', () => {
    let state = emptyState();
    state = reducer(state, { type: 'saveDeal', deal: { id: 'n1', title: 'T', source: 'S', url: 'https://e.com', publishedAt: '2026-01-01', dealType: 'M&A', region: 'Europe' } });
    const before = state.deals.n1.updatedAt;
    state = reducer(state, { type: 'updateDealNotes', id: 'n1', notes: { ...state.deals.n1.notes, summary: 'hello' } });
    expect(state.deals.n1.notes.summary).toBe('hello');
    expect(new Date(state.deals.n1.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(before).getTime());
    state = reducer(state, { type: 'removeDeal', id: 'n1' });
    expect(state.deals).toEqual({});
  });
});
