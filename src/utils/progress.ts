import type { DailyRecord, Subject } from '../types';
import { findSubject, visibleTopics } from '../data/subjects';

/** Progress is tracked per activity, so the key needs all three ids. */
export function activityKey(subjectId: string, topicId: string, activityId: string) {
  return `${subjectId}:${topicId}:${activityId}`;
}

function countActivities(subject: Subject) {
  return visibleTopics(subject).reduce((n, t) => n + t.activities.length, 0);
}

function countCompleted(subject: Subject, todayRecord: DailyRecord) {
  return visibleTopics(subject).reduce(
    (n, t) =>
      n +
      t.activities.filter((a) => todayRecord.topics[activityKey(subject.id, t.id, a.id)]?.completed).length,
    0,
  );
}

/** Share of this subject's activities finished today (0–100). */
export function subjectTodayPercent(subjectId: string, todayRecord: DailyRecord): number {
  const subject = findSubject(subjectId);
  if (!subject) return 0;
  const total = countActivities(subject);
  if (total === 0) return 0;
  return Math.round((100 * countCompleted(subject, todayRecord)) / total);
}

export function subjectActivitiesCompletedToday(subjectId: string, todayRecord: DailyRecord): number {
  const subject = findSubject(subjectId);
  if (!subject) return 0;
  return countCompleted(subject, todayRecord);
}

/** Share of one topic's activities finished today (0–100). */
export function topicTodayPercent(
  subjectId: string,
  topicId: string,
  todayRecord: DailyRecord,
): number {
  const subject = findSubject(subjectId);
  const topic = subject?.topics.find((t) => t.id === topicId);
  if (!topic || topic.activities.length === 0) return 0;
  const done = topic.activities.filter(
    (a) => todayRecord.topics[activityKey(subjectId, topicId, a.id)]?.completed,
  ).length;
  return Math.round((100 * done) / topic.activities.length);
}
