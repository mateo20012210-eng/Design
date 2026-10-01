import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false));
  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = () => setMatches(mq.matches);
    handler();
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

export type Tier = 'phone' | 'tablet' | 'desktop';

/** phone < 768px ≤ tablet < 1024px ≤ desktop */
export function useTier(): Tier {
  const tablet = useMediaQuery('(min-width: 768px)');
  const desktop = useMediaQuery('(min-width: 1024px)');
  if (desktop) return 'desktop';
  if (tablet) return 'tablet';
  return 'phone';
}
