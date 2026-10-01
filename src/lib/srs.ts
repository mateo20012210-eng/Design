import type { CardProgress, Grade } from './types';

/** Leitner system with 5 boxes. Interval (days) a card waits in each box before it is due again. */
export const BOX_INTERVALS_DAYS: Record<number, number> = { 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 };
export const MAX_BOX = 5;
export const DAY_MS = 24 * 60 * 60 * 1000;

export function nextBox(current: number, grade: Grade): number {
  if (grade === 'got') return Math.min(MAX_BOX, current + 1);
  if (grade === 'missed') return 1;
  // shaky: stay in the box, but never above box 3 (you clearly haven't mastered it)
  return Math.min(current, 3);
}

/**
 * Apply a self-grade to a card's progress. `now` is injectable for tests.
 * - Got it   → move up a box, due after the new box's interval.
 * - Shaky    → stay (capped at box 3), due after half the box interval (min 1 day).
 * - Missed   → back to box 1, due tomorrow.
 */
export function applyGrade(prev: CardProgress | undefined, grade: Grade, now: Date = new Date()): CardProgress {
  const currentBox = prev?.box ?? 1;
  const box = prev ? nextBox(currentBox, grade) : grade === 'got' ? 2 : 1;
  let days = BOX_INTERVALS_DAYS[box];
  if (grade === 'shaky') days = Math.max(1, Math.round(days / 2));
  if (grade === 'missed') days = 1;
  return {
    box,
    due: new Date(now.getTime() + days * DAY_MS).toISOString(),
    lastReviewed: now.toISOString(),
    reviews: (prev?.reviews ?? 0) + 1,
    lapses: (prev?.lapses ?? 0) + (grade === 'missed' ? 1 : 0),
  };
}

export function isDue(progress: CardProgress | undefined, now: Date = new Date()): boolean {
  if (!progress) return true; // never reviewed → due
  return new Date(progress.due).getTime() <= now.getTime();
}

/** A card counts as "mastered" once it reaches box 4 or 5. */
export function isMastered(progress: CardProgress | undefined): boolean {
  return !!progress && progress.box >= 4;
}

/** Mastery score 0..1 for a set of cards (box/5 weighted; unseen = 0). */
export function masteryScore(progressList: (CardProgress | undefined)[]): number {
  if (progressList.length === 0) return 0;
  const sum = progressList.reduce((acc, p) => acc + (p ? (p.box - 1) / (MAX_BOX - 1) : 0), 0);
  return sum / progressList.length;
}

/** Local calendar day key (YYYY-MM-DD) used for streaks. */
export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Number of consecutive days (ending today or yesterday) with at least one review. */
export function studyStreak(reviewDates: string[], now: Date = new Date()): number {
  const days = new Set(reviewDates.map((iso) => dayKey(new Date(iso))));
  if (days.size === 0) return 0;
  let cursor = new Date(now);
  // A streak is still alive if the last study day was yesterday.
  if (!days.has(dayKey(cursor))) {
    cursor = new Date(cursor.getTime() - DAY_MS);
    if (!days.has(dayKey(cursor))) return 0;
  }
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor = new Date(cursor.getTime() - DAY_MS);
  }
  return streak;
}

/** Order cards for review: lowest box first (unseen counts as box 1), then the longest-overdue; unseen cards after overdue ones. */
export function sortDueFirst<T extends { id: string }>(cards: T[], progress: Record<string, CardProgress>): T[] {
  return [...cards].sort((a, b) => {
    const pa = progress[a.id];
    const pb = progress[b.id];
    const ba = pa?.box ?? 1;
    const bb = pb?.box ?? 1;
    if (ba !== bb) return ba - bb;
    const da = pa ? new Date(pa.due).getTime() : Number.POSITIVE_INFINITY;
    const db = pb ? new Date(pb.due).getTime() : Number.POSITIVE_INFINITY;
    return da - db;
  });
}
