import { Link } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { Button, Empty, PageTitle } from '@/components/ui';
import { DEAL_TYPE_CLS } from '@/components/NewsItemCard';
import { cn, formatDate } from '@/lib/format';
import type { DealNotes } from '@/lib/types';

export function notesCompletion(n: DealNotes): number {
  const fields = Object.values(n);
  return fields.filter((v) => v.trim().length > 0).length / fields.length;
}

export function DealsPage() {
  const { state } = useStore();
  const deals = Object.values(state.deals).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return (
    <div>
      <PageTitle title="My Deals" subtitle="Talking points for “tell me about a recent deal”. Fill in the notes in your own words." />
      {deals.length === 0 ? (
        <Empty
          icon="📌"
          title="No saved deals yet"
          body="Open Market Pulse and tap “Save as talking point” on any item. Aim for 2–3 deals you can discuss in depth."
          action={
            <Link to="/pulse">
              <Button variant="primary">Open Market Pulse</Button>
            </Link>
          }
        />
      ) : (
        <ul className="space-y-2">
          {deals.map((d) => {
            const done = notesCompletion(d.notes);
            return (
              <li key={d.id}>
                <Link to={`/deals/${d.id}`} className="surface block p-4 hover:-translate-y-0.5 transition-transform focus-ring">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', DEAL_TYPE_CLS[d.dealType])}>{d.dealType}</span>
                    <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold bg-surface-2 muted">{d.region}</span>
                    {d.dealSize && <span className="rounded-full px-2 py-0.5 text-[11px] font-bold bg-navy-50 text-navy-700 dark:bg-navy-700 dark:text-navy-100">{d.dealSize}</span>}
                    <span className="ml-auto text-[11px] muted">{formatDate(d.publishedAt, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="font-semibold leading-snug">{d.title}</div>
                  <div className="flex items-center gap-2 mt-2 text-xs muted">
                    <span className="h-1.5 flex-1 rounded-full bg-surface-2 overflow-hidden">
                      <span className="block h-full bg-accent-500 rounded-full" style={{ width: `${done * 100}%` }} />
                    </span>
                    <span>{Math.round(done * 100)}% of notes filled</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
