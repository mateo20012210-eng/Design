import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { ALL_CARDS, CATEGORY_META, cardsByCategory } from '@/lib/cards';
import { CATEGORIES } from '@/lib/types';
import { dayKey, isDue, isMastered, masteryScore, studyStreak, MAX_BOX } from '@/lib/srs';
import { Button, PageTitle, ProgressBar } from '@/components/ui';
import { buildSessionUrl } from '@/lib/session';
import { pct } from '@/lib/format';

export function ProgressPage() {
  const { state } = useStore();
  const navigate = useNavigate();
  const now = new Date();
  const byCat = useMemo(() => cardsByCategory(), []);

  const progressList = ALL_CARDS.map((c) => state.progress[c.id]);
  const overall = masteryScore(progressList);
  const mastered = progressList.filter(isMastered).length;
  const due = ALL_CARDS.filter((c) => isDue(state.progress[c.id], now)).length;
  const streak = studyStreak(state.reviewLog.map((r) => r.at), now);
  const totalReviews = state.reviewLog.length;
  const seen = Object.keys(state.progress).length;

  const boxes = Array.from({ length: MAX_BOX }, (_, i) => progressList.filter((p) => p?.box === i + 1).length);
  const unseen = ALL_CARDS.length - seen;

  // Last 14 days activity
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now.getTime() - (13 - i) * 86400000);
    return { key: dayKey(d), label: d.toLocaleDateString('en-GB', { weekday: 'narrow' }), count: 0 };
  });
  const byDay = new Map(days.map((d) => [d.key, d]));
  for (const r of state.reviewLog) {
    const d = byDay.get(dayKey(new Date(r.at)));
    if (d) d.count++;
  }
  const maxDay = Math.max(1, ...days.map((d) => d.count));

  // Weakest cards (most lapses, lowest box)
  const weakest = ALL_CARDS.filter((c) => state.progress[c.id])
    .sort((a, b) => {
      const pa = state.progress[a.id];
      const pb = state.progress[b.id];
      return pb.lapses - pa.lapses || pa.box - pb.box;
    })
    .slice(0, 5);

  return (
    <div>
      <PageTitle title="Progress" subtitle="Mastery is based on your Leitner box per card: box 4–5 counts as mastered." />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Tile label="Overall mastery" value={pct(overall)} />
        <Tile label="Cards due today" value={String(due)} />
        <Tile label="Study streak" value={`${streak}d`} />
        <Tile label="Total reviews" value={String(totalReviews)} />
      </div>

      <section className="surface p-5 mb-6">
        <h2 className="font-bold mb-3">Mastery by category</h2>
        <ul className="space-y-3">
          {CATEGORIES.map((cat) => {
            const cards = byCat[cat];
            const m = masteryScore(cards.map((c) => state.progress[c.id]));
            const mast = cards.filter((c) => isMastered(state.progress[c.id])).length;
            return (
              <li key={cat}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium">
                    <span className="mr-1.5" aria-hidden>
                      {CATEGORY_META[cat].icon}
                    </span>
                    {cat}
                  </span>
                  <span className="muted tabular-nums">
                    {mast}/{cards.length} mastered · {pct(m)}
                  </span>
                </div>
                <ProgressBar value={m} color={CATEGORY_META[cat].bar} label={`${cat} mastery`} />
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <section className="surface p-5">
          <h2 className="font-bold mb-3">Leitner boxes</h2>
          <ul className="space-y-2 text-sm">
            <BoxRow label="Unseen" count={unseen} total={ALL_CARDS.length} color="#94a3b8" />
            {boxes.map((n, i) => (
              <BoxRow key={i} label={`Box ${i + 1} · ${['1 day', '3 days', '1 week', '2 weeks', '1 month'][i]}`} count={n} total={ALL_CARDS.length} color={['#f43f5e', '#f59e0b', '#eab308', '#22c55e', '#14b077'][i]} />
            ))}
          </ul>
          <p className="muted text-xs mt-3">
            {mastered} of {ALL_CARDS.length} cards mastered.
          </p>
        </section>

        <section className="surface p-5">
          <h2 className="font-bold mb-3">Last 14 days</h2>
          <div className="flex items-end gap-1 h-28" role="img" aria-label="Reviews per day over the last 14 days">
            {days.map((d) => (
              <div key={d.key} className="flex-1 flex flex-col items-center gap-1" title={`${d.key}: ${d.count} reviews`}>
                <div className="w-full rounded-t-md bg-accent-500/80 transition-[height]" style={{ height: `${(d.count / maxDay) * 88}px`, minHeight: d.count ? 4 : 1, opacity: d.count ? 1 : 0.25 }} />
                <span className="text-[10px] muted">{d.label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {weakest.length > 0 && (
        <section className="surface p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">Weakest cards</h2>
            <Button size="sm" onClick={() => navigate(buildSessionUrl({ mode: 'ids', ids: weakest.map((c) => c.id) }))}>
              Drill these
            </Button>
          </div>
          <ul className="divide-y divide-[var(--border)]">
            {weakest.map((c) => (
              <li key={c.id} className="py-2.5 text-sm flex items-start justify-between gap-3">
                <button onClick={() => navigate(`/card/${c.id}`)} className="text-left hover:underline underline-offset-2 focus-ring rounded">
                  {c.question}
                </button>
                <span className="muted text-xs whitespace-nowrap">
                  box {state.progress[c.id].box} · {state.progress[c.id].lapses} missed
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface p-4">
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs muted">{label}</div>
    </div>
  );
}

function BoxRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  return (
    <li>
      <div className="flex justify-between mb-1">
        <span>{label}</span>
        <span className="muted tabular-nums">{count}</span>
      </div>
      <ProgressBar value={total ? count / total : 0} color={color} className="h-1.5" label={label} />
    </li>
  );
}
