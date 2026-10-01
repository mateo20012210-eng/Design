import { Link } from 'react-router-dom';
import { useEditionIndex } from '@/lib/news';
import { Empty, PageTitle } from '@/components/ui';
import { formatDate } from '@/lib/format';

export function PulseArchivePage() {
  const { index, loading } = useEditionIndex();
  return (
    <div>
      <PageTitle title="Past editions" subtitle="The last 12 weeks are kept. Editions you have opened stay readable offline." />
      {loading ? (
        <div className="surface h-20 animate-pulse" />
      ) : !index || index.editions.length === 0 ? (
        <Empty icon="🗄️" title="No editions yet" />
      ) : (
        <ul className="space-y-2">
          {index.editions.map((e) => (
            <li key={e.week}>
              <Link to={`/pulse/${e.week}`} className="surface flex items-center justify-between p-4 hover:-translate-y-0.5 transition-transform focus-ring">
                <span>
                  <span className="font-semibold">Week {e.week.split('-W')[1]}</span>
                  <span className="muted text-sm ml-2">
                    {formatDate(e.from)} – {formatDate(e.to, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </span>
                <span className="text-sm muted">
                  {e.items} items {e.week === index.latest && <span className="ml-1 rounded-full bg-accent-500 text-white text-[10px] font-bold px-1.5 py-0.5">LATEST</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link to="/pulse" className="inline-block mt-5 text-sm muted hover:text-fg underline underline-offset-2">
        ← Back to this week
      </Link>
    </div>
  );
}
