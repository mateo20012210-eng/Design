import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { ALL_CARDS, CATEGORY_META, cardsByCategory } from '@/lib/cards';
import { CATEGORIES, type Category, type Difficulty } from '@/lib/types';
import { isDue, masteryScore, studyStreak } from '@/lib/srs';
import { buildSessionUrl } from '@/lib/session';
import { Button, Chip, Modal, PageTitle, ProgressBar, Segmented, Toggle } from '@/components/ui';
import { cn, pct } from '@/lib/format';

export function StudyPage() {
  const { state } = useStore();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Category[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty | 'All'>('All');
  const [mockOpen, setMockOpen] = useState(false);
  const [mockCount, setMockCount] = useState<10 | 20>(10);
  const [mockTimer, setMockTimer] = useState(state.settings.timerEnabled);

  const byCat = useMemo(() => cardsByCategory(), []);
  const now = new Date();
  const due = ALL_CARDS.filter((c) => isDue(state.progress[c.id], now)).length;
  const streak = studyStreak(state.reviewLog.map((r) => r.at), now);
  const reviewedTotal = Object.keys(state.progress).length;

  const toggleCat = (c: Category) => setSelected((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]));

  const startCategory = () => {
    const cats = selected.length ? selected : [...CATEGORIES];
    navigate(buildSessionUrl({ mode: 'category', categories: cats, difficulty }));
  };

  return (
    <div>
      <PageTitle title="Study" subtitle={`${ALL_CARDS.length} questions · ${CATEGORIES.length} categories`} />

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
        <Stat label="Due today" value={due} accent />
        <Stat label="Day streak" value={streak} suffix={streak === 1 ? ' day' : ' days'} />
        <Stat label="Cards seen" value={reviewedTotal} suffix={` / ${ALL_CARDS.length}`} />
      </div>

      {/* Primary modes */}
      <div className="grid sm:grid-cols-2 gap-3 mb-8">
        <ModeCard
          icon="🧠"
          title="Smart Review"
          body={due > 0 ? `${due} card${due === 1 ? '' : 's'} due under spaced repetition.` : 'Nothing due — great job. Come back tomorrow.'}
          cta={due > 0 ? `Review ${Math.min(due, 999)}` : 'Open'}
          primary
          onClick={() => navigate(buildSessionUrl({ mode: 'smart', difficulty }))}
          shortcut="Leitner · 5 boxes"
        />
        <ModeCard icon="🎲" title="Shuffle All" body="Every card in random order. Good for a long session." cta="Shuffle" onClick={() => navigate(buildSessionUrl({ mode: 'shuffle', difficulty }))} />
        <ModeCard icon="🎤" title="Mock Interview" body="10 or 20 random fit + technical questions. Optional 90-second timer to practise answering out loud." cta="Set up" onClick={() => setMockOpen(true)} />
        <ModeCard
          icon="★"
          title="Bookmarked"
          body={state.bookmarks.length ? `${state.bookmarks.length} bookmarked card${state.bookmarks.length === 1 ? '' : 's'}.` : 'Bookmark cards with ☆ while studying.'}
          cta="Review"
          onClick={() => navigate(buildSessionUrl({ mode: 'bookmarks' }))}
        />
      </div>

      {/* Category study */}
      <section className="surface p-5 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-bold text-lg">Study by category</h2>
            <p className="muted text-sm">Pick one or several. Leave empty for all.</p>
          </div>
          <Segmented
            label="Difficulty"
            value={difficulty}
            onChange={setDifficulty}
            options={[
              { value: 'All', label: 'All' },
              { value: 'Basic', label: 'Basic' },
              { value: 'Advanced', label: 'Advanced' },
            ]}
          />
        </div>
        <ul className="divide-y divide-[var(--border)] -mx-2">
          {CATEGORIES.map((cat) => {
            const cards = byCat[cat];
            const mastery = masteryScore(cards.map((c) => state.progress[c.id]));
            const dueHere = cards.filter((c) => isDue(state.progress[c.id], now)).length;
            const active = selected.includes(cat);
            return (
              <li key={cat}>
                <button
                  onClick={() => toggleCat(cat)}
                  aria-pressed={active}
                  className={cn('w-full text-left flex items-center gap-3 px-2 py-3 rounded-xl transition-colors focus-ring tap', active ? 'bg-navy-50 dark:bg-navy-700/50' : 'hover:bg-surface-2')}
                >
                  <span className={cn('h-5 w-5 rounded-md border flex items-center justify-center text-xs shrink-0', active ? 'bg-navy-800 border-navy-800 text-white dark:bg-accent-500 dark:border-accent-500' : 'border-navy-300')} aria-hidden>
                    {active ? '✓' : ''}
                  </span>
                  <span className="text-lg w-7 text-center" aria-hidden>
                    {CATEGORY_META[cat].icon}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">{cat}</span>
                      <span className="text-xs muted tabular-nums shrink-0">
                        {cards.length} cards · {dueHere} due
                      </span>
                    </span>
                    <ProgressBar value={mastery} color={CATEGORY_META[cat].bar} className="mt-1.5 h-1.5" />
                  </span>
                  <span className="text-xs muted w-10 text-right tabular-nums">{pct(mastery)}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <Button variant="primary" onClick={startCategory}>
            Start {selected.length ? `${selected.length} categor${selected.length === 1 ? 'y' : 'ies'}` : 'all categories'}
          </Button>
          {selected.length > 0 && (
            <Button variant="ghost" onClick={() => setSelected([])}>
              Clear
            </Button>
          )}
          <Link to="/search" className="ml-auto text-sm muted hover:text-fg underline-offset-2 hover:underline">
            Search questions →
          </Link>
        </div>
      </section>

      <Modal open={mockOpen} onClose={() => setMockOpen(false)} title="Mock interview">
        <p className="muted text-sm mb-4">A random mix of fit and technical questions, like a real first round. Answer out loud before revealing.</p>
        <div className="flex items-center justify-between py-3 border-b border-base">
          <span className="font-medium">Questions</span>
          <div className="flex gap-2">
            <Chip active={mockCount === 10} onClick={() => setMockCount(10)}>
              10
            </Chip>
            <Chip active={mockCount === 20} onClick={() => setMockCount(20)}>
              20
            </Chip>
          </div>
        </div>
        <div className="flex items-center justify-between py-3">
          <div>
            <div className="font-medium">Per-question timer</div>
            <div className="text-xs muted">{state.settings.timerSeconds} seconds, reveals automatically when time is up</div>
          </div>
          <Toggle checked={mockTimer} onChange={setMockTimer} label="Timer" />
        </div>
        <Button variant="primary" size="lg" className="w-full mt-4" onClick={() => navigate(buildSessionUrl({ mode: 'mock', count: mockCount, timer: mockTimer }))}>
          Start mock interview
        </Button>
      </Modal>
    </div>
  );
}

function Stat({ label, value, suffix, accent }: { label: string; value: number; suffix?: string; accent?: boolean }) {
  return (
    <div className="surface px-3 py-3 sm:px-4">
      <div className={cn('text-xl sm:text-2xl font-bold tabular-nums', accent && value > 0 && 'text-accent-600 dark:text-accent-300')}>
        {value}
        {suffix && <span className="text-xs font-medium muted">{suffix}</span>}
      </div>
      <div className="text-[11px] sm:text-xs muted">{label}</div>
    </div>
  );
}

function ModeCard({ icon, title, body, cta, onClick, primary, shortcut }: { icon: string; title: string; body: string; cta: string; onClick: () => void; primary?: boolean; shortcut?: string }) {
  return (
    <button onClick={onClick} className={cn('surface p-5 text-left flex gap-4 items-start transition-transform hover:-translate-y-0.5 focus-ring', primary && 'ring-1 ring-accent-300 dark:ring-accent-700')}>
      <span className="text-2xl leading-none mt-0.5" aria-hidden>
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center justify-between gap-2">
          <span className="font-bold">{title}</span>
          <span className={cn('text-xs font-semibold rounded-full px-2 py-0.5', primary ? 'bg-accent-500 text-white' : 'bg-surface-2 muted')}>{cta}</span>
        </span>
        <span className="block text-sm muted mt-1">{body}</span>
        {shortcut && <span className="block text-[11px] muted mt-2 opacity-70">{shortcut}</span>}
      </span>
    </button>
  );
}
