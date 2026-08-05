import type { Difficulty } from '../types';

export interface MathQuestion {
  type: 'add' | 'sub';
  a: number;
  b: number;
  ans: number;
}

/**
 * The activity owns the ceiling (K5's "sums to 5 / 10 / 20"); difficulty only
 * softens within it. `normal` uses the activity's stated ceiling so the label
 * stays honest — "Sums to 5" really can produce 5.
 */
const DIFFICULTY_SCALE: Record<Difficulty, number> = {
  easy: 0.6,
  normal: 1,
  hard: 1,
};

/** `hard` skips the trivial 1 + n cases rather than raising the ceiling. */
const MIN_OPERAND: Record<Difficulty, number> = {
  easy: 1,
  normal: 1,
  hard: 2,
};

function rnd(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function effectiveMax(max: number, difficulty: Difficulty): number {
  return Math.max(2, Math.round(max * DIFFICULTY_SCALE[difficulty]));
}

export function genMathQuestion(type: 'add' | 'sub', max: number, difficulty: Difficulty): MathQuestion {
  const cap = effectiveMax(max, difficulty);
  // Both operands need room, so the floor can never exceed half the ceiling.
  const floor = Math.min(MIN_OPERAND[difficulty], Math.floor(cap / 2));
  const lo = Math.max(1, floor);

  if (type === 'add') {
    const a = rnd(lo, Math.max(lo, cap - lo));
    const b = rnd(lo, Math.max(lo, cap - a));
    return { type, a, b, ans: a + b };
  }
  const a = rnd(Math.max(2, lo + 1), cap);
  const b = rnd(lo, a - 1);
  return { type, a, b, ans: a - b };
}

export interface NumberLineWindow {
  min: number;
  max: number;
  start: number;
  end: number;
  jumps: number;
  isAdd: boolean;
}

export function getNumberLineWindow(
  q: MathQuestion,
  activityMax: number,
  difficulty: Difficulty,
): NumberLineWindow {
  const isAdd = q.type === 'add';
  const start = q.a;
  const jumps = q.b;
  const end = isAdd ? start + jumps : start - jumps;
  const pad = difficulty === 'easy' ? 2 : 1;
  let min = Math.max(0, Math.min(start, end) - pad);
  let max = Math.max(start, end) + pad;

  // Never render more ticks than the activity's own ceiling needs.
  const requiredSpan = Math.abs(end - start) + pad * 2 + 1;
  const cap = Math.max(activityMax + 1, requiredSpan);
  if (max - min > cap - 1) {
    if (isAdd) {
      min = Math.max(0, end - cap + 1);
      max = min + cap - 1;
    } else {
      min = Math.max(0, start - cap + 1);
      max = min + cap - 1;
    }
  }
  return { min, max, start, end, jumps, isAdd };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildAnswerChoices(ans: number, count = 6): number[] {
  const choices = new Set<number>([ans]);
  let guard = 0;
  while (choices.size < count && guard < 50) {
    const delta = rnd(-4, 4);
    const candidate = ans + delta;
    if (candidate >= 0 && candidate !== ans) choices.add(candidate);
    guard++;
  }
  return shuffle([...choices]);
}
