import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { searchCards } from '@/lib/cards';
import { Button, CategoryBadge, DifficultyBadge, Empty, PageTitle } from '@/components/ui';
import { buildSessionUrl } from '@/lib/session';
import { useStore } from '@/lib/store';

export function SearchPage() {
  const [q, setQ] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { state } = useStore();
  useEffect(() => ref.current?.focus(), []);
  const results = useMemo(() => searchCards(q), [q]);

  return (
    <div>
      <PageTitle title="Search" subtitle="Full-text search across questions and answers." />
      <div className="relative mb-4">
        <input
          ref={ref}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setQ('');
              (e.target as HTMLInputElement).blur();
            }
          }}
          type="search"
          placeholder="e.g. treasury stock method, WACC, deferred tax…"
          aria-label="Search questions"
          className="w-full h-12 rounded-xl border border-base bg-surface px-4 pr-10 text-base focus-ring"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 muted" aria-hidden>
          🔍
        </span>
      </div>
      {q.trim() === '' ? (
        <Empty icon="🔎" title="Type to search" body="Try a concept (“unlevered free cash flow”), a number (“$10 depreciation”) or a tag." />
      ) : results.length === 0 ? (
        <Empty icon="🤔" title="No matches" body="Try fewer or different words." />
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm muted">{results.length} result{results.length === 1 ? '' : 's'}</span>
            {results.length > 1 && (
              <Button size="sm" variant="primary" onClick={() => navigate(buildSessionUrl({ mode: 'ids', ids: results.slice(0, 50).map((c) => c.id) }))}>
                Study these {Math.min(results.length, 50)}
              </Button>
            )}
          </div>
          <ul className="space-y-2">
            {results.slice(0, 60).map((c) => (
              <li key={c.id}>
                <Link to={`/card/${c.id}`} className="surface block p-4 hover:-translate-y-0.5 transition-transform focus-ring">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <CategoryBadge category={c.category} short />
                    <DifficultyBadge difficulty={c.difficulty} />
                    {state.bookmarks.includes(c.id) && <span className="text-amber-500 text-sm">★</span>}
                  </div>
                  <div className="font-medium leading-snug">{c.question}</div>
                  <div className="text-sm muted mt-1 line-clamp-2">{c.keyAnswer}</div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
