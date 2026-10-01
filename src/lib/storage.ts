import type { Settings, UserState } from './types';

export const STATE_KEY = 'ibprep:state';
export const SETTINGS_KEY = 'ibprep:settings';
const MAX_LOG = 5000;

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  fontSize: 'M',
  timerEnabled: true,
  timerSeconds: 90,
  onboardingDone: false,
  focusMode: false,
  lastSeenEdition: null,
};

export function emptyState(): UserState {
  return { version: 1, progress: {}, bookmarks: [], reviewLog: [], deals: {}, settings: { ...DEFAULT_SETTINGS } };
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadState(storage: Storage = localStorage): UserState {
  const base = emptyState();
  const saved = safeParse<Partial<UserState>>(storage.getItem(STATE_KEY));
  const settings = safeParse<Partial<Settings>>(storage.getItem(SETTINGS_KEY));
  return {
    ...base,
    ...(saved ?? {}),
    progress: saved?.progress ?? {},
    bookmarks: Array.isArray(saved?.bookmarks) ? saved!.bookmarks : [],
    reviewLog: Array.isArray(saved?.reviewLog) ? saved!.reviewLog : [],
    deals: saved?.deals ?? {},
    settings: { ...DEFAULT_SETTINGS, ...(settings ?? {}) },
    version: 1,
  };
}

export function saveState(state: UserState, storage: Storage = localStorage): void {
  const { settings, ...rest } = state;
  const trimmed = { ...rest, reviewLog: rest.reviewLog.slice(-MAX_LOG) };
  try {
    storage.setItem(STATE_KEY, JSON.stringify(trimmed));
    storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Could not persist state', e);
  }
}
