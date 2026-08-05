export type ThemeName = 'calm' | 'playful' | 'adventure';

export interface Kid {
  id: string;
  name: string;
  avatarIcon: string;
  avatarColor: string;
}

/** Curriculum band an activity belongs to. Stored now, not enforced yet. */
export type Band = 'k' | 'g1' | 'g2';

/** Step within a band. Stored now, not enforced yet. */
export type Tier = 1 | 2 | 3;

/** The smallest playable unit — one K5 worksheet set. */
export interface Activity {
  id: string;
  label: string;
  icon: string;
  band: Band;
  tier: Tier;
  op: 'add' | 'sub';
  /** Ceiling: largest sum for `add`, largest minuend for `sub`. */
  max: number;
  /** Show the interactive number line as a manipulative. */
  numberLine?: boolean;
}

export interface Topic {
  id: string;
  label: string;
  icon: string;
  activities: Activity[];
}

export interface Subject {
  id: string;
  label: string;
  icon: string;
  image?: string;
  topics: Topic[];
}

export type Difficulty = 'easy' | 'normal' | 'hard';
export type QuestionsPerTopic = 1 | 10 | 20 | 30;

export interface Reward {
  emoji: string;
  label: string;
}

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

/**
 * One line on the day's plan. `app` items point at an activity and complete
 * themselves; `offline` items are things away from the screen and get ticked
 * by hand. A plan is an ordered checklist, deliberately not a clock — a kid
 * who opens the app late shouldn't find their day already expired.
 */
export interface PlanItem {
  id: string;
  kind: 'app' | 'offline';
  /**
   * Optional "HH:MM" slot start, with an optional length in minutes. Both are
   * shown and used for ordering and for the "now" marker, but never enforced —
   * a kid who opens the app after the slot still finds everything available.
   */
  time?: string;
  durationMin?: number;
  /** `app` only */
  subjectId?: string;
  topicId?: string;
  activityId?: string;
  /** `offline` only */
  label?: string;
  icon?: string;
}

export type WeekPlan = Partial<Record<Weekday, PlanItem[]>>;

export interface KidSettings {
  questionsPerTopic: QuestionsPerTopic;
  difficulty: Difficulty;
  rewardsEnabled: boolean;
  dailyStarTarget: number;
  rewards: Reward[];
  plan: WeekPlan;
  /** Restrict the kid to today's plan; free play is hidden. */
  planOnly: boolean;
  /** With planOnly on, hand free play back once the plan is finished. */
  freePlayAfterPlan: boolean;
}

export interface TopicSessionRecord {
  subjectId: string;
  topicId: string;
  activityId: string;
  questionsPlanned: number;
  answered: number;
  correct: number;
  completed: boolean;
  gradePercent: number | null;
  starsEarned: number;
  starsAwarded: boolean;
  completedAt: string | null;
}

export interface DailyRecord {
  date: string;
  topics: Record<string, TopicSessionRecord>;
  starsToday: number;
  rewardPending: boolean;
  /** PlanItem ids for offline tasks ticked off today. */
  offlineDone: string[];
}
