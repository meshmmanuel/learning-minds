export function computeStars(correct: number, planned: number): number {
  if (planned <= 0) return 1;
  const pct = correct / planned;
  return 1 + (pct >= 0.8 ? 1 : 0) + (pct >= 1 ? 1 : 0);
}
