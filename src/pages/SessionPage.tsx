import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { buildSession, parseSessionParams, sessionTitle } from '@/lib/session';
import { Flashcard, GradeBar } from '@/components/Flashcard';
import { Button, Empty, ProgressBar } from '@/components/ui';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useSwipe } from '@/hooks/useSwipe';
import type { Grade } from '@/lib/types';
import { CATEGORY_META } from '@/lib/cards';

export function SessionPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { state, dispatch } = useStore();
  const cfg = useMemo(() => parseSessionParams(params), [params]);
  // Build once per session (so grading doesn't reshuffle or remove cards mid-session).
  const [cards] = useState(() => buildSession(cfg, state));
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [anim, setAnim] = useState<'left' | 'right' | null>(null);
  const [graded, setGraded] = useState<Record<string, Grade>>({});
  const [done, setDone] = useState(false);

  const timerOn = cfg.mode === 'mock' && cfg.timer && state.settings.timerEnabled;
  const [remaining, setRemaining] = useState<number | null>(timerOn ? state.settings.timerSeconds : null);
  const timerRef = useRef<number | null>(null);

  const card = cards[index];
  const total = cards.length;

  // Timer per question (mock interview)
  useEffect(() => {
    if (!timerOn || revealed || done) return;
    setRemaining(state.settings.timerSeconds);
    timerRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r === null) return r;
        if (r <= 1) {
          window.clearInterval(timerRef.current!);
          setRevealed(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [index, timerOn, revealed, done, state.settings.timerSeconds]);

  const go = useCallback(
    (delta: number) => {
      const next = index + delta;
      if (next < 0) return;
      if (next >= total) {
        setDone(true);
        return;
      }
      setAnim(delta > 0 ? 'left' : 'right');
      setIndex(next);
      setRevealed(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [index, total],
  );

  const reveal = useCallback(() => setRevealed(true), []);

  const grade = useCallback(
    (g: Grade) => {
      if (!card) return;
      dispatch({ type: 'grade', cardId: card.id, grade: g });
      setGraded((prev) => ({ ...prev, [card.id]: g }));
      go(1);
    },
    [card, dispatch, go],
  );

  const toggleBookmark = useCallback(() => {
    if (card) dispatch({ type: 'toggleBookmark', cardId: card.id });
  }, [card, dispatch]);

  useHotkeys(
    useMemo(
      () => ({
        ' ': () => (revealed ? go(1) : reveal()),
        Enter: () => (revealed ? go(1) : reveal()),
        '1': () => revealed && grade('got'),
        '2': () => revealed && grade('shaky'),
        '3': () => revealed && grade('missed'),
        ArrowRight: () => go(1),
        ArrowLeft: () => go(-1),
        b: toggleBookmark,
        Escape: () => navigate('/'),
      }),
      [revealed, go, reveal, grade, toggleBookmark, navigate],
    ),
    !done,
  );

  const swipe = useSwipe({ onLeft: () => go(1), onRight: () => go(-1), onTap: () => !revealed && reveal() });

  if (total === 0) {
    return (
      <Empty
        icon={cfg.mode === 'smart' ? '🎉' : '🗂️'}
        title={cfg.mode === 'smart' ? 'Nothing due right now' : cfg.mode === 'bookmarks' ? 'No bookmarks yet' : 'No cards match'}
        body={cfg.mode === 'smart' ? 'All your cards are scheduled for later. Try Shuffle All or a category to keep going.' : 'Bookmark cards with the ☆ icon while studying, or choose another study mode.'}
        action={
          <Button variant="primary" onClick={() => navigate('/')}>
            Back to Study
          </Button>
        }
      />
    );
  }

  if (done) {
    const counts = { got: 0, shaky: 0, missed: 0 };
    for (const g of Object.values(graded)) counts[g]++;
    const gradedCount = Object.keys(graded).length;
    return (
      <div className="max-w-md mx-auto text-center py-8 flip-enter">
        <div className="text-5xl mb-3" aria-hidden>
          🏁
        </div>
        <h1 className="text-2xl font-bold">Session complete</h1>
        <p className="muted mt-1">
          {total} cards · {gradedCount} graded
        </p>
        <div className="grid grid-cols-3 gap-3 mt-6">
          <Stat label="Got it" value={counts.got} cls="text-accent-600" />
          <Stat label="Shaky" value={counts.shaky} cls="text-amber-600" />
          <Stat label="Missed" value={counts.missed} cls="text-rose-600" />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
          <Button variant="primary" onClick={() => navigate(0)}>
            Study again
          </Button>
          <Button onClick={() => navigate('/')}>Back to Study</Button>
          <Button variant="ghost" onClick={() => navigate('/progress')}>
            View progress
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[760px] mx-auto pb-24">
      <div className="flex items-center justify-between gap-3 mb-3">
        <Link to="/" className="muted hover:text-fg text-sm focus-ring rounded-lg px-1 -ml-1 tap inline-flex items-center">
          ← Exit
        </Link>
        <div className="text-sm font-medium truncate">{sessionTitle(cfg)}</div>
        <div className="text-sm muted tabular-nums">
          {index + 1} / {total}
        </div>
      </div>
      <ProgressBar value={(index + (revealed ? 0.5 : 0)) / total} color={CATEGORY_META[card.category].bar} className="mb-4" label="Session progress" />

      <div {...swipe} className="touch-pan-y" style={{ touchAction: 'pan-y' }}>
        <Flashcard
          key={card.id}
          card={card}
          revealed={revealed}
          onReveal={reveal}
          bookmarked={state.bookmarks.includes(card.id)}
          onToggleBookmark={toggleBookmark}
          animation={anim}
          timerSeconds={timerOn && !revealed ? remaining : null}
        />
      </div>

      <div className="mt-4 sticky bottom-20 sm:bottom-4 z-10">
        {revealed ? (
          <div className="surface p-3">
            <GradeBar onGrade={grade} />
          </div>
        ) : (
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => go(-1)} disabled={index === 0} aria-label="Previous card">
              ← Prev
            </Button>
            <Button variant="ghost" onClick={() => go(1)} aria-label="Skip card">
              Skip →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, cls }: { label: string; value: number; cls: string }) {
  return (
    <div className="surface p-4">
      <div className={`text-2xl font-bold ${cls}`}>{value}</div>
      <div className="text-xs muted">{label}</div>
    </div>
  );
}

export default React.memo(SessionPage);
