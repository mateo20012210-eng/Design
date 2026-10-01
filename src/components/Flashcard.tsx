import React from 'react';
import { Link } from 'react-router-dom';
import type { Card } from '@/lib/types';
import { Markdown } from '@/lib/markdown';
import { Button, CategoryBadge, DifficultyBadge } from './ui';
import { cn } from '@/lib/format';

interface Props {
  card: Card;
  revealed: boolean;
  onReveal: () => void;
  bookmarked: boolean;
  onToggleBookmark: () => void;
  animation?: 'left' | 'right' | null;
  timerSeconds?: number | null; // remaining seconds (mock interview)
  showPermalink?: boolean;
}

export function Flashcard({ card, revealed, onReveal, bookmarked, onToggleBookmark, animation, timerSeconds, showPermalink = true }: Props) {
  const isDealCard = card.tags.includes('recent deal');
  return (
    <article className={cn('surface overflow-hidden', animation === 'left' && 'slide-left', animation === 'right' && 'slide-right')} aria-live="polite">
      <div className="p-5 sm:p-7">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={card.category} />
            <DifficultyBadge difficulty={card.difficulty} />
          </div>
          <div className="flex items-center gap-1">
            {typeof timerSeconds === 'number' && (
              <span className={cn('font-mono text-sm tabular-nums rounded-lg px-2 py-1', timerSeconds <= 10 ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200' : 'bg-surface-2 muted')} aria-label="Time remaining">
                {Math.floor(timerSeconds / 60)}:{String(timerSeconds % 60).padStart(2, '0')}
              </span>
            )}
            <button
              onClick={onToggleBookmark}
              className={cn('tap rounded-xl text-xl focus-ring hover:bg-surface-2', bookmarked ? 'text-amber-500' : 'muted')}
              aria-pressed={bookmarked}
              aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this card'}
              title="Bookmark (B)"
            >
              {bookmarked ? '★' : '☆'}
            </button>
          </div>
        </div>

        <h2 className="text-xl sm:text-[1.45rem] font-semibold leading-snug tracking-tight">{card.question}</h2>

        {!revealed ? (
          <div className="mt-8">
            <Button variant="primary" size="lg" className="w-full sm:w-auto" onClick={onReveal}>
              Show answer <span className="hidden sm:inline text-xs opacity-70 ml-1">Space</span>
            </Button>
            <p className="muted text-xs mt-3 sm:hidden">Tap the card or the button to reveal.</p>
          </div>
        ) : (
          <div className="mt-6 flip-enter">
            <section className="rounded-xl bg-navy-50 dark:bg-navy-700/50 border border-navy-100 dark:border-navy-600 p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-navy-600 dark:text-navy-200 mb-1">Key answer</div>
              <p className="font-semibold leading-relaxed">{card.keyAnswer}</p>
            </section>

            <section className="mt-5">
              <div className="text-[11px] font-bold uppercase tracking-wider muted mb-2">Full explanation</div>
              <Markdown source={card.explanation} />
            </section>

            {card.ifrsNote && (
              <section className="mt-5 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-200 mb-1">IFRS note</div>
                <Markdown source={card.ifrsNote} className="text-[0.95rem]" />
              </section>
            )}

            {card.commonMistakes && card.commonMistakes.length > 0 && (
              <section className="mt-5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 mb-2">Common mistakes</div>
                <ul className="list-disc pl-5 space-y-1 text-[0.95rem]">
                  {card.commonMistakes.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </section>
            )}

            {card.followUps && card.followUps.length > 0 && (
              <section className="mt-5">
                <div className="text-[11px] font-bold uppercase tracking-wider muted mb-2">Likely follow-ups</div>
                <ul className="list-disc pl-5 space-y-1 text-[0.95rem]">
                  {card.followUps.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </section>
            )}

            {isDealCard && (
              <Link to="/deals" className="mt-5 flex items-center gap-3 rounded-xl border border-accent-200 bg-accent-50 dark:bg-accent-900/20 dark:border-accent-800 p-4 hover:bg-accent-100 dark:hover:bg-accent-900/30 focus-ring">
                <span className="text-2xl" aria-hidden>
                  📌
                </span>
                <span>
                  <span className="font-semibold block">Open My Deals</span>
                  <span className="text-sm muted">Your saved talking points from Market Pulse, with your own notes.</span>
                </span>
              </Link>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {card.tags.map((t) => (
                <span key={t} className="text-xs muted rounded-full bg-surface-2 px-2 py-0.5">
                  #{t}
                </span>
              ))}
              {showPermalink && (
                <Link to={`/card/${card.id}`} className="ml-auto text-xs muted hover:text-fg underline-offset-2 hover:underline">
                  {card.id}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

export function GradeBar({ onGrade, disabled }: { onGrade: (g: 'got' | 'shaky' | 'missed') => void; disabled?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3" role="group" aria-label="Grade yourself">
      <GradeButton label="Missed" hint="1 day" kbd="3" className="bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-100 dark:border-rose-800" onClick={() => onGrade('missed')} disabled={disabled} />
      <GradeButton label="Shaky" hint="soon" kbd="2" className="bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-100 dark:border-amber-800" onClick={() => onGrade('shaky')} disabled={disabled} />
      <GradeButton label="Got it" hint="later" kbd="1" className="bg-accent-50 text-accent-800 border-accent-200 hover:bg-accent-100 dark:bg-accent-900/30 dark:text-accent-100 dark:border-accent-800" onClick={() => onGrade('got')} disabled={disabled} />
    </div>
  );
}

function GradeButton({ label, hint, kbd, className, onClick, disabled }: { label: string; hint: string; kbd: string; className: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className={cn('rounded-xl border h-14 sm:h-16 flex flex-col items-center justify-center font-semibold focus-ring transition-colors active:scale-[0.98] disabled:opacity-50', className)}>
      <span>{label}</span>
      <span className="text-[11px] font-normal opacity-70">
        {hint} <span className="hidden sm:inline">· {kbd}</span>
      </span>
    </button>
  );
}

export const FlashcardMemo = React.memo(Flashcard);
