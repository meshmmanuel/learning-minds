import numbersImg from '../assets/illustrations/elephant-shapes.png';
import mathImg from '../assets/illustrations/dinosaur-math.png';
import type { Activity, Subject, Topic } from '../types';

/**
 * Kindergarten curriculum, mirroring the K5 Learning structure:
 *   Subject -> Topic -> Activity
 *
 * Topics are listed as K5 groups them. An activity only appears here once the
 * question engine can actually serve it — an empty topic is hidden rather than
 * shown as "coming soon".
 */
export const subjects: Subject[] = [
  {
    id: 'numbers',
    label: 'Numbers & Counting',
    icon: 'fa-solid fa-1',
    image: numbersImg,
    topics: [
      { id: 'learning-numbers', label: 'Learning Numbers', icon: 'fa-solid fa-1', activities: [] },
      { id: 'counting', label: 'Counting', icon: 'fa-solid fa-list-ol', activities: [] },
      { id: 'odd-even', label: 'Odd / Even', icon: 'fa-solid fa-scale-balanced', activities: [] },
      { id: 'ordinal-numbers', label: 'Ordinal Numbers', icon: 'fa-solid fa-ranking-star', activities: [] },
      { id: 'more-less', label: 'More / Less', icon: 'fa-solid fa-arrow-up-wide-short', activities: [] },
    ],
  },
  {
    id: 'math',
    label: 'Simple Math',
    icon: 'fa-solid fa-calculator',
    image: mathImg,
    topics: [
      { id: 'patterns', label: 'Patterns', icon: 'fa-solid fa-repeat', activities: [] },
      { id: 'measurement', label: 'Measurement', icon: 'fa-solid fa-ruler', activities: [] },
      { id: 'money', label: 'Money', icon: 'fa-solid fa-coins', activities: [] },
      { id: 'graphing', label: 'Graphing', icon: 'fa-solid fa-chart-simple', activities: [] },
      {
        id: 'addition',
        label: 'Addition',
        icon: 'fa-solid fa-plus',
        activities: [
          { id: 'sums-to-5', label: 'Sums to 5', icon: 'fa-solid fa-5', band: 'k', tier: 1, op: 'add', max: 5 },
          { id: 'sums-to-10', label: 'Sums to 10', icon: 'fa-solid fa-hand', band: 'k', tier: 2, op: 'add', max: 10 },
          { id: 'sums-to-20', label: 'Sums to 20', icon: 'fa-solid fa-hashtag', band: 'k', tier: 3, op: 'add', max: 20 },
          {
            id: 'number-lines',
            label: 'Add with Number Lines',
            icon: 'fa-solid fa-arrows-left-right',
            band: 'k',
            tier: 2,
            op: 'add',
            max: 10,
            numberLine: true,
          },
        ],
      },
      {
        id: 'subtraction',
        label: 'Subtraction',
        icon: 'fa-solid fa-minus',
        activities: [
          { id: 'within-5', label: 'Subtract within 5', icon: 'fa-solid fa-5', band: 'k', tier: 1, op: 'sub', max: 5 },
          { id: 'within-10', label: 'Subtract within 10', icon: 'fa-solid fa-hand', band: 'k', tier: 2, op: 'sub', max: 10 },
          { id: 'within-20', label: 'Subtract within 20', icon: 'fa-solid fa-hashtag', band: 'k', tier: 3, op: 'sub', max: 20 },
          {
            id: 'number-lines',
            label: 'Subtract with Number Lines',
            icon: 'fa-solid fa-arrows-left-right',
            band: 'k',
            tier: 2,
            op: 'sub',
            max: 10,
            numberLine: true,
          },
        ],
      },
    ],
  },
];

/** Topics that have at least one playable activity. */
export function visibleTopics(subject: Subject): Topic[] {
  return subject.topics.filter((t) => t.activities.length > 0);
}

/** Subjects that have at least one playable activity. */
export function visibleSubjects(): Subject[] {
  return subjects.filter((s) => visibleTopics(s).length > 0);
}

export interface ActivityRef {
  subject: Subject;
  topic: Topic;
  activity: Activity;
}

/** Flat view of every playable activity — used for search. */
export function allActivities(): ActivityRef[] {
  return visibleSubjects().flatMap((subject) =>
    visibleTopics(subject).flatMap((topic) =>
      topic.activities.map((activity) => ({ subject, topic, activity })),
    ),
  );
}

export function findSubject(subjectId?: string): Subject | undefined {
  return subjects.find((s) => s.id === subjectId);
}

export function findTopic(subject: Subject | undefined, topicId?: string): Topic | undefined {
  return subject?.topics.find((t) => t.id === topicId);
}

export function findActivity(topic: Topic | undefined, activityId?: string): Activity | undefined {
  return topic?.activities.find((a) => a.id === activityId);
}

/**
 * Where tapping a subject should land. A subject with a single playable topic
 * skips the topic screen — that screen would show one tile, which is a wasted
 * tap. This is also what lets flat K5 subjects (Shapes, Letters, Colors) slot
 * in later as a single topic without changing the data shape.
 */
export function subjectEntryPath(subject: Subject): string {
  const topics = visibleTopics(subject);
  if (topics.length === 1) return `/subject/${subject.id}/topic/${topics[0].id}`;
  return `/subject/${subject.id}`;
}

/** Where the back button on the activity list should go. */
export function topicBackPath(subject: Subject): string {
  return visibleTopics(subject).length === 1 ? '/home' : `/subject/${subject.id}`;
}

export const avatarOptions = [
  { icon: 'fa-solid fa-cat', color: '#FF6F61' },
  { icon: 'fa-solid fa-dog', color: '#2EC4B6' },
  { icon: 'fa-solid fa-dragon', color: '#8E7CFF' },
  { icon: 'fa-solid fa-frog', color: '#3DDC97' },
  { icon: 'fa-solid fa-fish', color: '#4CC3FF' },
  { icon: 'fa-solid fa-hippo', color: '#FF6FA5' },
];
