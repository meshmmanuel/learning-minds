export function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const WEEKDAY_IDS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

export type WeekdayId = (typeof WEEKDAY_IDS)[number];

export function todayWeekday(): WeekdayId {
  return WEEKDAY_IDS[new Date().getDay()];
}

export function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  const then = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = today.getTime() - then.getTime();
  return Math.max(0, Math.round(diffMs / 86_400_000));
}
