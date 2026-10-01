import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import type { DealNotes, Grade, SavedDeal, Settings, UserState } from './types';
import { applyGrade } from './srs';
import { emptyState, loadState, saveState } from './storage';

type Action =
  | { type: 'grade'; cardId: string; grade: Grade; at?: Date }
  | { type: 'toggleBookmark'; cardId: string }
  | { type: 'setSettings'; patch: Partial<Settings> }
  | { type: 'resetProgress' }
  | { type: 'replace'; state: UserState }
  | { type: 'saveDeal'; deal: Omit<SavedDeal, 'savedAt' | 'updatedAt' | 'notes'> }
  | { type: 'updateDealNotes'; id: string; notes: DealNotes }
  | { type: 'removeDeal'; id: string };

export const EMPTY_NOTES: DealNotes = { summary: '', rationale: '', valuation: '', financing: '', whyItMatters: '', risks: '', myView: '' };

export function reducer(state: UserState, action: Action): UserState {
  switch (action.type) {
    case 'grade': {
      const at = action.at ?? new Date();
      const progress = { ...state.progress, [action.cardId]: applyGrade(state.progress[action.cardId], action.grade, at) };
      const reviewLog = [...state.reviewLog, { cardId: action.cardId, grade: action.grade, at: at.toISOString() }];
      return { ...state, progress, reviewLog };
    }
    case 'toggleBookmark': {
      const has = state.bookmarks.includes(action.cardId);
      return { ...state, bookmarks: has ? state.bookmarks.filter((b) => b !== action.cardId) : [...state.bookmarks, action.cardId] };
    }
    case 'setSettings':
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case 'resetProgress':
      return { ...state, progress: {}, reviewLog: [], bookmarks: [] };
    case 'replace':
      return action.state;
    case 'saveDeal': {
      if (state.deals[action.deal.id]) return state;
      const now = new Date().toISOString();
      const deal: SavedDeal = { ...action.deal, savedAt: now, updatedAt: now, notes: { ...EMPTY_NOTES } };
      return { ...state, deals: { ...state.deals, [deal.id]: deal } };
    }
    case 'updateDealNotes': {
      const d = state.deals[action.id];
      if (!d) return state;
      return { ...state, deals: { ...state.deals, [action.id]: { ...d, notes: action.notes, updatedAt: new Date().toISOString() } } };
    }
    case 'removeDeal': {
      const deals = { ...state.deals };
      delete deals[action.id];
      return { ...state, deals };
    }
    default:
      return state;
  }
}

interface StoreCtx {
  state: UserState;
  dispatch: React.Dispatch<Action>;
}

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => (typeof localStorage !== 'undefined' ? loadState() : emptyState()));

  useEffect(() => {
    saveState(state);
  }, [state]);

  // Theme + font size side effects
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const t = state.settings.theme;
      const dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      root.classList.toggle('dark', dark);
      root.dataset.fontSize = state.settings.fontSize;
    };
    apply();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [state.settings.theme, state.settings.fontSize]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
