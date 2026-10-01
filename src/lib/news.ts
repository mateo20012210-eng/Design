import { useEffect, useState } from 'react';
import type { Edition, EditionIndex } from './types';
import { useStore } from './store';

const BASE = import.meta.env.BASE_URL.replace(/\/?$/, '/');

export function newsUrl(path: string): string {
  return `${BASE}news/${path}`;
}

export async function fetchIndex(): Promise<EditionIndex | null> {
  try {
    const res = await fetch(newsUrl('index.json'), { cache: 'no-cache' });
    if (!res.ok) return null;
    return (await res.json()) as EditionIndex;
  } catch {
    return null;
  }
}

export async function fetchEdition(week: string): Promise<Edition | null> {
  try {
    const res = await fetch(newsUrl(`${week}.json`));
    if (!res.ok) return null;
    return (await res.json()) as Edition;
  } catch {
    return null;
  }
}

/** Shared cache so the badge hook and the Pulse page do not refetch separately. */
let indexPromise: Promise<EditionIndex | null> | null = null;
export function getIndex(force = false): Promise<EditionIndex | null> {
  if (!indexPromise || force) indexPromise = fetchIndex();
  return indexPromise;
}

export function useEditionIndex(): { index: EditionIndex | null; loading: boolean; reload: () => void } {
  const [index, setIndex] = useState<EditionIndex | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    getIndex(tick > 0).then((i) => {
      if (!alive) return;
      setIndex(i);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [tick]);
  return { index, loading, reload: () => setTick((t) => t + 1) };
}

export function useEdition(week: string | null | undefined): { edition: Edition | null; loading: boolean; error: boolean } {
  const [edition, setEdition] = useState<Edition | null>(null);
  const [loading, setLoading] = useState(!!week);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!week) {
      setEdition(null);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(false);
    fetchEdition(week).then((e) => {
      if (!alive) return;
      setEdition(e);
      setError(!e);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [week]);
  return { edition, loading, error };
}

/** True when the latest edition in the index is newer than the one the user last opened. */
export function useNewEditionBadge(): boolean {
  const { state } = useStore();
  const [latest, setLatest] = useState<string | null>(null);
  useEffect(() => {
    getIndex().then((i) => setLatest(i?.latest ?? null));
  }, []);
  return !!latest && latest !== state.settings.lastSeenEdition;
}
