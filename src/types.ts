export type ThemeName = 'calm' | 'playful' | 'adventure';

export interface Kid {
  id: string;
  name: string;
  avatarIcon: string;
  avatarColor: string;
}

export interface Subject {
  id: string;
  label: string;
  icon: string;
  image?: string;
  locked?: boolean;
}

export interface Topic {
  id: string;
  label: string;
  icon: string;
  locked?: boolean;
}

export type Difficulty = 'easy' | 'normal' | 'hard';
export type QuestionsPerTopic = 1 | 10 | 20 | 30;

export interface Reward {
  emoji: string;
  label: string;
}

export interface KidSettings {
  questionsPerTopic: QuestionsPerTopic;
  difficulty: Difficulty;
  rewardsEnabled: boolean;
  dailyStarTarget: number;
  rewards: Reward[];
}

export interface TopicSessionRecord {
  subjectId: string;
  topicId: string;
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
}
