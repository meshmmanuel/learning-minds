import type { DailyRecord } from '../types';
import { topicsBySubject } from '../data/subjects';

function topicKey(subjectId: string, topicId: string) {
  return `${subjectId}:${topicId}`;
}

/** Share of this subject's topics finished today (0–100). */
export function subjectTodayPercent(subjectId: string, todayRecord: DailyRecord): number {
  const topics = topicsBySubject[subjectId] ?? [];
  if (topics.length === 0) return 0;
  const completed = topics.filter((t) => todayRecord.topics[topicKey(subjectId, t.id)]?.completed).length;
  return Math.round((100 * completed) / topics.length);
}

export function subjectTopicsCompletedToday(subjectId: string, todayRecord: DailyRecord): number {
  const topics = topicsBySubject[subjectId] ?? [];
  return topics.filter((t) => todayRecord.topics[topicKey(subjectId, t.id)]?.completed).length;
}
