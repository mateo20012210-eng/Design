import type { CardProgress, SavedDeal, UserState } from './types';
import { emptyState } from './storage';

/** Exported file format. Settings are intentionally left out (device-specific). */
export interface ExportPayload {
  app: 'ib-interview-prep';
  version: 1;
  exportedAt: string;
  progress: Record<string, CardProgress>;
  bookmarks: string[];
  reviewLog: UserState['reviewLog'];
  deals: Record<string, SavedDeal>;
}

export function createExport(state: UserState, now: Date = new Date()): ExportPayload {
  return {
    app: 'ib-interview-prep',
    version: 1,
    exportedAt: now.toISOString(),
    progress: state.progress,
    bookmarks: state.bookmarks,
    reviewLog: state.reviewLog.slice(-2000),
    deals: state.deals,
  };
}

export function parseImport(text: string): ExportPayload {
  let json: unknown;
  try {
    json = JSON.parse(text.trim());
  } catch {
    // Maybe a compact base64 code
    try {
      json = JSON.parse(decodeCompact(text.trim()));
    } catch {
      throw new Error('This is not a valid IB Interview Prep export.');
    }
  }
  const obj = json as Partial<ExportPayload>;
  if (!obj || obj.app !== 'ib-interview-prep' || typeof obj.progress !== 'object') {
    throw new Error('This is not a valid IB Interview Prep export.');
  }
  return {
    app: 'ib-interview-prep',
    version: 1,
    exportedAt: obj.exportedAt ?? new Date(0).toISOString(),
    progress: obj.progress ?? {},
    bookmarks: Array.isArray(obj.bookmarks) ? obj.bookmarks : [],
    reviewLog: Array.isArray(obj.reviewLog) ? obj.reviewLog : [],
    deals: obj.deals ?? {},
  };
}

/**
 * Merge an imported payload into the current state.
 * - progress: keep the most recently reviewed entry per card.
 * - bookmarks: union.
 * - reviewLog: union, de-duplicated by (cardId, at), sorted by time.
 * - deals: union; on conflict keep the most recently updated notes.
 */
export function mergeImport(current: UserState, incoming: ExportPayload): UserState {
  const progress: Record<string, CardProgress> = { ...current.progress };
  for (const [id, p] of Object.entries(incoming.progress)) {
    const existing = progress[id];
    if (!existing || new Date(p.lastReviewed).getTime() > new Date(existing.lastReviewed).getTime()) {
      progress[id] = p;
    }
  }
  const bookmarks = Array.from(new Set([...current.bookmarks, ...incoming.bookmarks]));
  const logKeys = new Set<string>();
  const reviewLog = [...current.reviewLog, ...incoming.reviewLog]
    .filter((e) => {
      const k = `${e.cardId}|${e.at}`;
      if (logKeys.has(k)) return false;
      logKeys.add(k);
      return true;
    })
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  const deals: Record<string, SavedDeal> = { ...current.deals };
  for (const [id, d] of Object.entries(incoming.deals)) {
    const existing = deals[id];
    if (!existing || new Date(d.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) deals[id] = d;
  }
  return { ...current, progress, bookmarks, reviewLog, deals };
}

/** Replace everything (except settings) with the imported payload. */
export function overwriteImport(current: UserState, incoming: ExportPayload): UserState {
  return {
    ...emptyState(),
    settings: current.settings,
    progress: incoming.progress,
    bookmarks: incoming.bookmarks,
    reviewLog: incoming.reviewLog,
    deals: incoming.deals,
  };
}

// --- compact code (base64 of JSON, with a prefix so it is recognisable) ---
const PREFIX = 'IBPREP1:';

export function encodeCompact(payload: ExportPayload): string {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return PREFIX + btoa(bin);
}

export function decodeCompact(code: string): string {
  if (!code.startsWith(PREFIX)) throw new Error('Not a compact code');
  const bin = atob(code.slice(PREFIX.length));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
