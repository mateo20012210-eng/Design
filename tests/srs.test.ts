import { describe, expect, it } from 'vitest';
import { applyGrade, isDue, isMastered, masteryScore, nextBox, sortDueFirst, studyStreak, DAY_MS } from '../src/lib/srs';

const now = new Date('2026-10-01T10:00:00Z');

describe('Leitner spaced repetition', () => {
  it('moves up a box on "got it" and caps at box 5', () => {
    expect(nextBox(1, 'got')).toBe(2);
    expect(nextBox(5, 'got')).toBe(5);
  });
  it('resets to box 1 on "missed"', () => {
    expect(nextBox(4, 'missed')).toBe(1);
  });
  it('keeps the box on "shaky" but never above 3', () => {
    expect(nextBox(2, 'shaky')).toBe(2);
    expect(nextBox(5, 'shaky')).toBe(3);
  });
  it('schedules a new card graded "got" for 3 days (box 2)', () => {
    const p = applyGrade(undefined, 'got', now);
    expect(p.box).toBe(2);
    expect(new Date(p.due).getTime() - now.getTime()).toBe(3 * DAY_MS);
    expect(p.reviews).toBe(1);
    expect(p.lapses).toBe(0);
  });
  it('schedules a missed card for tomorrow and counts a lapse', () => {
    const prev = applyGrade(undefined, 'got', now);
    const p = applyGrade(prev, 'missed', now);
    expect(p.box).toBe(1);
    expect(new Date(p.due).getTime() - now.getTime()).toBe(DAY_MS);
    expect(p.lapses).toBe(1);
    expect(p.reviews).toBe(2);
  });
  it('shaky halves the interval (box 3 → ~4 days)', () => {
    const p3 = { box: 3, due: now.toISOString(), lastReviewed: now.toISOString(), reviews: 3, lapses: 0 };
    const p = applyGrade(p3, 'shaky', now);
    expect(p.box).toBe(3);
    expect(Math.round((new Date(p.due).getTime() - now.getTime()) / DAY_MS)).toBe(4);
  });
  it('box 5 waits 30 days', () => {
    const p4 = { box: 4, due: now.toISOString(), lastReviewed: now.toISOString(), reviews: 4, lapses: 0 };
    const p = applyGrade(p4, 'got', now);
    expect(p.box).toBe(5);
    expect((new Date(p.due).getTime() - now.getTime()) / DAY_MS).toBe(30);
  });
  it('unseen cards are due; future-dated cards are not', () => {
    expect(isDue(undefined, now)).toBe(true);
    const p = applyGrade(undefined, 'got', now);
    expect(isDue(p, now)).toBe(false);
    expect(isDue(p, new Date(now.getTime() + 4 * DAY_MS))).toBe(true);
  });
  it('mastery: box 4+ is mastered, score is box-weighted', () => {
    expect(isMastered({ box: 4, due: '', lastReviewed: '', reviews: 1, lapses: 0 })).toBe(true);
    expect(isMastered({ box: 3, due: '', lastReviewed: '', reviews: 1, lapses: 0 })).toBe(false);
    expect(masteryScore([undefined, { box: 5, due: '', lastReviewed: '', reviews: 1, lapses: 0 }])).toBe(0.5);
    expect(masteryScore([])).toBe(0);
  });
  it('sorts weakest (lowest box) cards first', () => {
    const cards = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const progress = { a: { box: 3, due: now.toISOString(), lastReviewed: '', reviews: 1, lapses: 0 }, b: { box: 1, due: now.toISOString(), lastReviewed: '', reviews: 1, lapses: 0 } };
    expect(sortDueFirst(cards, progress).map((c) => c.id)).toEqual(['b', 'c', 'a']);
  });
});

describe('study streak', () => {
  const d = (daysAgo: number) => new Date(now.getTime() - daysAgo * DAY_MS).toISOString();
  it('is 0 with no reviews', () => expect(studyStreak([], now)).toBe(0));
  it('counts consecutive days including today', () => expect(studyStreak([d(0), d(1), d(2)], now)).toBe(3));
  it('survives when the last study day was yesterday', () => expect(studyStreak([d(1), d(2)], now)).toBe(2));
  it('breaks on a gap', () => expect(studyStreak([d(0), d(2), d(3)], now)).toBe(1));
  it('is 0 if the last review was two days ago', () => expect(studyStreak([d(2), d(3)], now)).toBe(0));
});
