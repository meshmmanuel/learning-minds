import type { Difficulty } from '../types';

export interface MathQuestion {
  type: 'add' | 'sub';
  a: number;
  b: number;
  ans: number;
}

const ADDITION_RANGES: Record<Difficulty, { min: number; max: number }> = {
  easy: { min: 1, max: 5 },
  normal: { min: 1, max: 9 },
  hard: { min: 1, max: 12 },
};

const SUBTRACTION_RANGES: Record<Difficulty, { minA: number; maxA: number }> = {
  easy: { minA: 3, maxA: 8 },
  normal: { minA: 3, maxA: 12 },
  hard: { minA: 4, maxA: 15 },
};

const NUMBER_LINE_CAPS: Record<Difficulty, number> = {
  easy: 10,
  normal: 20,
  hard: 100,
};

function rnd(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function genMathQuestion(type: 'add' | 'sub', difficulty: Difficulty): MathQuestion {
  if (type === 'add') {
    const { min, max } = ADDITION_RANGES[difficulty];
    const a = rnd(min, max);
    const b = rnd(min, max);
    return { type, a, b, ans: a + b };
  }
  const { minA, maxA } = SUBTRACTION_RANGES[difficulty];
  const a = rnd(minA, maxA);
  const b = rnd(1, a - 1);
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

export function getNumberLineWindow(q: MathQuestion, difficulty: Difficulty): NumberLineWindow {
  const isAdd = q.type === 'add';
  const start = q.a;
  const jumps = q.b;
  const end = isAdd ? start + jumps : start - jumps;
  const pad = difficulty === 'easy' ? 2 : 1;
  let min = Math.max(0, Math.min(start, end) - pad);
  let max = Math.max(start, end) + pad;
  const baseCap = NUMBER_LINE_CAPS[difficulty] ?? NUMBER_LINE_CAPS.normal;
  const requiredSpan = Math.abs(end - start) + pad * 2 + 1;
  const cap = Math.max(baseCap, requiredSpan);
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
