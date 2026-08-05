import type { DailyRecord, KidSettings, PlanItem } from '../types';
import { findActivity, findSubject, findTopic } from '../data/subjects';
import { todayWeekday } from './date';
import { activityKey } from './progress';

export const WEEKDAYS: { id: string; short: string; long: string }[] = [
  { id: 'mon', short: 'Mon', long: 'Monday' },
  { id: 'tue', short: 'Tue', long: 'Tuesday' },
  { id: 'wed', short: 'Wed', long: 'Wednesday' },
  { id: 'thu', short: 'Thu', long: 'Thursday' },
  { id: 'fri', short: 'Fri', long: 'Friday' },
  { id: 'sat', short: 'Sat', long: 'Saturday' },
  { id: 'sun', short: 'Sun', long: 'Sunday' },
];

/** Timed items first in clock order, untimed ones after in author order. */
export function sortPlanItems(items: PlanItem[]): PlanItem[] {
  return [...items].sort((a, b) => {
    if (a.time && b.time) return a.time.localeCompare(b.time);
    if (a.time) return -1;
    if (b.time) return 1;
    return 0;
  });
}

export function planForToday(settings: KidSettings): PlanItem[] {
  return sortPlanItems(settings.plan?.[todayWeekday()] ?? []);
}

export const DURATION_OPTIONS = [5, 10, 15, 20, 30, 45, 60];

/** Minutes past midnight for a timed item, or null when it has no slot. */
export function slotStart(item: PlanItem): number | null {
  if (!item.time) return null;
  const [h, m] = item.time.split(':').map(Number);
  return Number.isNaN(h) || Number.isNaN(m) ? null : h * 60 + m;
}

export function slotEnd(item: PlanItem): number | null {
  const start = slotStart(item);
  return start === null ? null : start + (item.durationMin ?? 0);
}

export function minutesToHHMM(total: number): string {
  const wrapped = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(wrapped / 60)).padStart(2, '0')}:${String(wrapped % 60).padStart(2, '0')}`;
}

/**
 * Lays a set of activities out back to back from a start time. Adding several
 * at once should build a run through the afternoon, not stack them all on the
 * same minute.
 */
export function cascadeSlots(count: number, startTime: string, eachMinutes: number): string[] {
  const [h, m] = startTime.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return [];
  const base = h * 60 + m;
  return Array.from({ length: count }, (_, i) => minutesToHHMM(base + i * eachMinutes));
}

/** Ids of items whose slots collide — surfaced rather than silently allowed. */
export function overlappingIds(items: PlanItem[]): Set<string> {
  const timed = items
    .map((i) => ({ item: i, start: slotStart(i), end: slotEnd(i) }))
    .filter((x): x is { item: PlanItem; start: number; end: number } => x.start !== null)
    .sort((a, b) => a.start - b.start);

  const clashing = new Set<string>();
  for (let i = 1; i < timed.length; i++) {
    const prev = timed[i - 1];
    const cur = timed[i];
    // Zero-length slots still clash when they share a start time.
    if (cur.start < prev.end || (cur.start === prev.start && prev.end === prev.start)) {
      clashing.add(prev.item.id);
      clashing.add(cur.item.id);
    }
  }
  return clashing;
}

/** Idle minutes between one item ending and the next starting. */
export function gapBefore(items: PlanItem[], index: number): number | null {
  if (index <= 0) return null;
  const prevEnd = slotEnd(items[index - 1]);
  const start = slotStart(items[index]);
  if (prevEnd === null || start === null) return null;
  const gap = start - prevEnd;
  return gap > 0 ? gap : null;
}

export function formatGap(minutes: number): string {
  if (minutes < 60) return `${minutes} min gap`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} hr gap` : `${h} hr ${m} min gap`;
}

function toMinutes(time: string): number | null {
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function fromMinutes(total: number): string {
  const wrapped = ((total % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  const suffix = h < 12 ? 'AM' : 'PM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** "14:30" -> "2:30 PM". Returns null for untimed items. */
export function formatTime(time?: string): string | null {
  if (!time) return null;
  const mins = toMinutes(time);
  return mins === null ? null : fromMinutes(mins);
}

/** "2:30 – 2:50 PM" when a duration is set, otherwise just the start. */
export function formatSlot(item: PlanItem): string | null {
  if (!item.time) return null;
  const start = toMinutes(item.time);
  if (start === null) return null;
  if (!item.durationMin) return fromMinutes(start);
  return `${fromMinutes(start)} – ${fromMinutes(start + item.durationMin)}`;
}

function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

/**
 * The item to nudge the kid toward, in priority order: one whose slot contains
 * right now, else the most recent one whose start has passed, else the first
 * unfinished. Only ever a highlight — nothing is hidden or disabled.
 */
export function currentPlanItemId(items: PlanItem[], record: DailyRecord): string | null {
  const pending = items.filter((i) => !isPlanItemDone(i, record));
  if (pending.length === 0) return null;
  const now = nowMinutes();

  const inSlot = pending.find((i) => {
    if (!i.time) return false;
    const start = toMinutes(i.time);
    if (start === null) return false;
    return now >= start && now < start + (i.durationMin ?? 0);
  });
  if (inSlot) return inSlot.id;

  const started = pending.filter((i) => {
    const start = i.time ? toMinutes(i.time) : null;
    return start !== null && start <= now;
  });
  return (started.length > 0 ? started[started.length - 1] : pending[0]).id;
}

/** An app item completes itself; an offline item is ticked by hand. */
export function isPlanItemDone(item: PlanItem, record: DailyRecord): boolean {
  if (item.kind === 'offline') return record.offlineDone.includes(item.id);
  if (!item.subjectId || !item.topicId || !item.activityId) return false;
  return Boolean(record.topics[activityKey(item.subjectId, item.topicId, item.activityId)]?.completed);
}

export function planProgress(items: PlanItem[], record: DailyRecord) {
  const done = items.filter((i) => isPlanItemDone(i, record)).length;
  return { done, total: items.length, allDone: items.length > 0 && done === items.length };
}

/** Next unfinished in-app item — what the Play button should open. */
export function nextAppItem(items: PlanItem[], record: DailyRecord): PlanItem | undefined {
  return items.find((i) => i.kind === 'app' && !isPlanItemDone(i, record));
}

export function planItemPath(item: PlanItem): string | null {
  if (item.kind !== 'app' || !item.subjectId || !item.topicId || !item.activityId) return null;
  const base = `/subject/${item.subjectId}/topic/${item.topicId}/activity/${item.activityId}`;
  // A scheduled slot governs how long the session runs, instead of a question count.
  return item.durationMin ? `${base}?mins=${item.durationMin}` : base;
}

export function planItemLabel(item: PlanItem): string {
  if (item.kind === 'offline') return item.label ?? 'Task';
  const activity = findActivity(findTopic(findSubject(item.subjectId), item.topicId), item.activityId);
  return activity?.label ?? item.activityId ?? 'Activity';
}

export function planItemIcon(item: PlanItem): string {
  if (item.kind === 'offline') return item.icon ?? 'fa-solid fa-star';
  const activity = findActivity(findTopic(findSubject(item.subjectId), item.topicId), item.activityId);
  return activity?.icon ?? 'fa-solid fa-play';
}

/**
 * Whether the kid may roam outside today's plan. A plan-only day with nothing
 * scheduled still allows free play — otherwise the app would be empty.
 */
export function freePlayAllowed(settings: KidSettings, record: DailyRecord): boolean {
  if (!settings.planOnly) return true;
  const items = planForToday(settings).filter(isPlanItemValid);
  if (items.length === 0) return true;
  if (!settings.freePlayAfterPlan) return false;
  return planProgress(items, record).allDone;
}

/** Guards direct navigation to an activity that isn't on today's plan. */
export function activityAllowed(
  settings: KidSettings,
  record: DailyRecord,
  subjectId?: string,
  topicId?: string,
  activityId?: string,
): boolean {
  if (freePlayAllowed(settings, record)) return true;
  return planForToday(settings).some(
    (i) =>
      i.kind === 'app' &&
      i.subjectId === subjectId &&
      i.topicId === topicId &&
      i.activityId === activityId,
  );
}

/** Drops plan entries whose activity no longer exists in the catalogue. */
export function isPlanItemValid(item: PlanItem): boolean {
  if (item.kind === 'offline') return Boolean(item.label);
  return Boolean(findActivity(findTopic(findSubject(item.subjectId), item.topicId), item.activityId));
}
