import { Link } from 'react-router-dom';
import type { NewsItem } from '@/lib/types';
import { useStore } from '@/lib/store';
import { cn, formatDate } from '@/lib/format';

export const DEAL_TYPE_CLS: Record<NewsItem['dealType'], string> = {
  'M&A': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200',
  'Private Equity / Buyouts': 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200',
  'ECM / IPOs': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200',
  'DCM / Leveraged Finance': 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200',
  Restructuring: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200',
};

export function NewsItemCard({ item, rank }: { item: NewsItem; rank?: number }) {
  const { state, dispatch } = useStore();
  const saved = !!state.deals[item.id];
  return (
    <article className="surface p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        {rank && <span className="h-6 w-6 rounded-full bg-navy-800 text-white dark:bg-accent-500 text-xs font-bold flex items-center justify-center">{rank}</span>}
        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', DEAL_TYPE_CLS[item.dealType])}>{item.dealType}</span>
        <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold bg-surface-2 muted">{item.region}</span>
        {item.dealSize && <span className="rounded-full px-2 py-0.5 text-[11px] font-bold bg-navy-50 text-navy-700 dark:bg-navy-700 dark:text-navy-100">{item.dealSize}</span>}
      </div>
      <h3 className="font-semibold leading-snug">
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline underline-offset-2 focus-ring rounded">
          {item.title}
        </a>
      </h3>
      {item.excerpt && <p className="text-sm muted mt-1.5">{item.excerpt}</p>}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-xs muted">
        <span className="font-medium text-fg">{item.source}</span>
        <span>{formatDate(item.publishedAt, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        {item.alsoCoveredBy.length > 0 && (
          <span>
            Also covered by{' '}
            {item.alsoCoveredBy.map((s, i) => (
              <span key={s.url}>
                {i > 0 && ', '}
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-fg">
                  {s.source}
                </a>
              </span>
            ))}
          </span>
        )}
        <span className="ml-auto flex items-center gap-2">
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="rounded-lg px-2 h-8 inline-flex items-center hover:bg-surface-2 focus-ring text-fg font-medium">
            Read ↗
          </a>
          {saved ? (
            <Link to={`/deals/${item.id}`} className="rounded-lg px-2 h-8 inline-flex items-center bg-accent-50 text-accent-800 dark:bg-accent-900/40 dark:text-accent-100 font-medium focus-ring">
              📌 Saved · notes
            </Link>
          ) : (
            <button
              onClick={() =>
                dispatch({
                  type: 'saveDeal',
                  deal: { id: item.id, title: item.title, source: item.source, url: item.url, publishedAt: item.publishedAt, dealType: item.dealType, region: item.region, dealSize: item.dealSize, excerpt: item.excerpt },
                })
              }
              className="rounded-lg px-2 h-8 inline-flex items-center hover:bg-surface-2 focus-ring text-fg font-medium"
            >
              + Save as talking point
            </button>
          )}
        </span>
      </div>
    </article>
  );
}
