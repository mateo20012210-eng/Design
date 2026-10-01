import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useEdition, useEditionIndex } from '@/lib/news';
import { useStore } from '@/lib/store';
import { DEAL_TYPES, REGIONS, type DealType, type Region } from '@/lib/types';
import { NewsItemCard } from '@/components/NewsItemCard';
import { Chip, Empty, PageTitle } from '@/components/ui';
import { formatDate, formatDateTime } from '@/lib/format';
import { useOnline } from '@/hooks/useOnline';

export function PulsePage() {
  const { week: weekParam } = useParams();
  const { index, loading: indexLoading } = useEditionIndex();
  const week = weekParam ?? index?.latest ?? null;
  const { edition, loading, error } = useEdition(week);
  const { state, dispatch } = useStore();
  const online = useOnline();
  const [type, setType] = useState<DealType | 'All'>('All');
  const [region, setRegion] = useState<Region | 'All'>('All');

  // Mark the latest edition as seen (clears the "New" badge)
  useEffect(() => {
    if (!weekParam && index?.latest && state.settings.lastSeenEdition !== index.latest) {
      dispatch({ type: 'setSettings', patch: { lastSeenEdition: index.latest } });
    }
  }, [index?.latest, weekParam, state.settings.lastSeenEdition, dispatch]);

  const filtered = useMemo(() => {
    if (!edition) return [];
    return edition.items.filter((i) => (type === 'All' || i.dealType === type) && (region === 'All' || i.region === region));
  }, [edition, type, region]);
  const topItems = useMemo(() => (edition ? edition.top.map((id) => edition.items.find((i) => i.id === id)).filter((x): x is NonNullable<typeof x> => !!x) : []), [edition]);
  const isFiltering = type !== 'All' || region !== 'All';

  if (indexLoading || loading) {
    return (
      <div>
        <PageTitle title="Market Pulse" subtitle="Loading this week’s edition…" />
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="surface h-28 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!week || !edition || error) {
    return (
      <div>
        <PageTitle title="Market Pulse" />
        <Empty
          icon={online ? '📰' : '📡'}
          title={online ? 'No edition available yet' : 'You are offline'}
          body={online ? 'The weekly job runs every Monday morning and publishes the first edition automatically. Check back soon.' : 'Editions you have opened before are available offline. Connect to download the latest one.'}
        />
      </div>
    );
  }

  return (
    <div>
      <PageTitle
        title="Market Pulse"
        subtitle={`Week ${edition.week.split('-W')[1]} · ${formatDate(edition.from)} – ${formatDate(edition.to, { month: 'short', day: 'numeric', year: 'numeric' })} · ${edition.items.length} items`}
        action={
          <Link to="/pulse/archive" className="text-sm font-medium rounded-xl border border-base px-3 h-10 inline-flex items-center hover:bg-surface-2 focus-ring whitespace-nowrap">
            Archive
          </Link>
        }
      />
      {weekParam && index?.latest && weekParam !== index.latest && (
        <div className="mb-4 rounded-xl bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-100 p-3 text-sm">
          You are reading a past edition.{' '}
          <Link to="/pulse" className="underline font-medium">
            Go to the latest
          </Link>
        </div>
      )}

      {!isFiltering && topItems.length > 0 && (
        <section className="mb-7">
          <h2 className="font-bold text-lg mb-3">Top 5 of the week</h2>
          <div className="space-y-3">
            {topItems.map((item, i) => (
              <NewsItemCard key={item.id} item={item} rank={i + 1} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-bold text-lg mb-3">All items</h2>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap" role="group" aria-label="Filter by deal type">
          <Chip active={type === 'All'} onClick={() => setType('All')}>
            All types
          </Chip>
          {DEAL_TYPES.map((t) => (
            <Chip key={t} active={type === t} onClick={() => setType(t)}>
              {t}
            </Chip>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap" role="group" aria-label="Filter by region">
          <Chip active={region === 'All'} onClick={() => setRegion('All')}>
            All regions
          </Chip>
          {REGIONS.map((r) => (
            <Chip key={r} active={region === r} onClick={() => setRegion(r)}>
              {r}
            </Chip>
          ))}
        </div>
        {filtered.length === 0 ? (
          <Empty icon="🔎" title="No items match these filters" />
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <NewsItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      <footer className="mt-8 text-xs muted">
        Generated {formatDateTime(edition.meta.generatedAt)} from {edition.meta.sourcesOk.length} feeds
        {edition.meta.sourcesFailed.length > 0 && ` (${edition.meta.sourcesFailed.length} unavailable: ${edition.meta.sourcesFailed.map((f) => f.name).join(', ')})`}. Headlines and short excerpts belong to their publishers; links open the original article.
      </footer>
    </div>
  );
}
