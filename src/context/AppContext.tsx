import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { DailyRecord, Kid, KidSettings, ThemeName, TopicSessionRecord } from '../types';
import { todayStr } from '../utils/date';
import { computeStars } from '../utils/rewards';

const DEFAULT_SETTINGS: KidSettings = {
  questionsPerTopic: 10,
  difficulty: 'normal',
  rewardsEnabled: true,
  dailyStarTarget: 10,
  rewards: [],
};

function emptyDailyRecord(): DailyRecord {
  return { date: todayStr(), topics: {}, starsToday: 0, rewardPending: false };
}

interface PersistedState {
  kids: Kid[];
  activeKidId: string | null;
  theme: ThemeName;
  gateEnabled: boolean;
  kidSettings: Record<string, KidSettings>;
  dailyRecords: Record<string, DailyRecord>;
  lastPlayDate: Record<string, string>;
}

interface CompleteResult {
  starsEarnedThisRun: number;
  rewardReady: boolean;
}

interface AppState extends PersistedState {
  addKid: (kid: Omit<Kid, 'id'>) => Kid;
  setActiveKid: (id: string) => void;
  setTheme: (t: ThemeName) => void;
  setGateEnabled: (v: boolean) => void;
  getKidSettings: (kidId: string) => KidSettings;
  updateKidSettings: (kidId: string, partial: Partial<KidSettings>) => void;
  getTodayRecord: (kidId: string) => DailyRecord;
  recordTopicProgress: (kidId: string, subjectId: string, topicId: string, answered: number, correct: number) => void;
  completeTopicSession: (
    kidId: string,
    subjectId: string,
    topicId: string,
    correct: number,
    answered: number,
    planned: number,
    passed: boolean,
  ) => CompleteResult;
  claimReward: (kidId: string) => void;
  resetTodayForKid: (kidId: string) => void;
  resetAllProgressForKid: (kidId: string) => void;
}

const STORAGE_KEY = 'kids-app-v2-state';

const AppContext = createContext<AppState | null>(null);

function loadState(): Partial<PersistedState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* corrupt or unavailable storage — start fresh */
  }
  return {};
}

function topicKey(subjectId: string, topicId: string) {
  return `${subjectId}:${topicId}`;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const initial = loadState();
  const [kids, setKids] = useState<Kid[]>(initial.kids ?? []);
  const [activeKidId, setActiveKidId] = useState<string | null>(initial.activeKidId ?? null);
  const [theme, setThemeState] = useState<ThemeName>(initial.theme ?? 'playful');
  const [gateEnabled, setGateEnabledState] = useState<boolean>(initial.gateEnabled ?? true);
  const [kidSettings, setKidSettings] = useState<Record<string, KidSettings>>(initial.kidSettings ?? {});
  const [dailyRecords, setDailyRecords] = useState<Record<string, DailyRecord>>(initial.dailyRecords ?? {});
  const [lastPlayDate, setLastPlayDate] = useState<Record<string, string>>(initial.lastPlayDate ?? {});

  useEffect(() => {
    const toSave: PersistedState = {
      kids,
      activeKidId,
      theme,
      gateEnabled,
      kidSettings,
      dailyRecords,
      lastPlayDate,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }, [kids, activeKidId, theme, gateEnabled, kidSettings, dailyRecords, lastPlayDate]);

  const addKid: AppState['addKid'] = (kid) => {
    const newKid: Kid = { ...kid, id: crypto.randomUUID() };
    setKids((prev) => [...prev, newKid]);
    setActiveKidId(newKid.id);
    setKidSettings((prev) => ({ ...prev, [newKid.id]: { ...DEFAULT_SETTINGS } }));
    return newKid;
  };

  const setActiveKid = (id: string) => setActiveKidId(id);
  const setTheme = (t: ThemeName) => setThemeState(t);
  const setGateEnabled = (v: boolean) => setGateEnabledState(v);

  const getKidSettings: AppState['getKidSettings'] = (kidId) => {
    const stored = kidSettings[kidId];
    return stored ? { ...DEFAULT_SETTINGS, ...stored } : DEFAULT_SETTINGS;
  };

  const updateKidSettings: AppState['updateKidSettings'] = (kidId, partial) => {
    setKidSettings((prev) => {
      const current = { ...DEFAULT_SETTINGS, ...prev[kidId] };
      const next = { ...current, ...partial };
      if (next.dailyStarTarget < 1) next.dailyStarTarget = 1;
      return { ...prev, [kidId]: next };
    });
  };

  const getTodayRecord: AppState['getTodayRecord'] = (kidId) => {
    const record = dailyRecords[kidId];
    if (record && record.date === todayStr()) return { ...emptyDailyRecord(), ...record };
    return emptyDailyRecord();
  };

  function withTodayRecord(
    kidId: string,
    updater: (record: DailyRecord) => DailyRecord,
  ) {
    setDailyRecords((prev) => {
      const existing = prev[kidId];
      const base = existing && existing.date === todayStr() ? { ...emptyDailyRecord(), ...existing } : emptyDailyRecord();
      return { ...prev, [kidId]: updater(base) };
    });
  }

  const recordTopicProgress: AppState['recordTopicProgress'] = (kidId, subjectId, topicId, answered, correct) => {
    const settings = getKidSettings(kidId);
    const key = topicKey(subjectId, topicId);
    withTodayRecord(kidId, (record) => {
      const existing = record.topics[key];
      const entry: TopicSessionRecord = existing
        ? { ...existing, answered, correct }
        : {
            subjectId,
            topicId,
            questionsPlanned: settings.questionsPerTopic,
            answered,
            correct,
            completed: false,
            gradePercent: null,
            starsEarned: 0,
            starsAwarded: false,
            completedAt: null,
          };
      return { ...record, topics: { ...record.topics, [key]: entry } };
    });
    setLastPlayDate((prev) => ({ ...prev, [kidId]: todayStr() }));
  };

  const completeTopicSession: AppState['completeTopicSession'] = (kidId, subjectId, topicId, correct, answered, planned, passed) => {
    const settings = getKidSettings(kidId);
    const key = topicKey(subjectId, topicId);
    const stored = dailyRecords[kidId];
    const record = stored && stored.date === todayStr() ? { ...emptyDailyRecord(), ...stored } : emptyDailyRecord();

    const existing = record.topics[key];
    const runGrade = answered > 0 ? Math.round((100 * correct) / answered) : 0;
    const gradePercent = existing?.gradePercent != null ? Math.max(existing.gradePercent, runGrade) : runGrade;

    let starsEarned = existing?.starsEarned ?? 0;
    let starsAwarded = existing?.starsAwarded ?? false;
    let starsToday = record.starsToday;
    let starsEarnedThisRun = 0;

    if (!starsAwarded && settings.rewardsEnabled && passed) {
      starsEarned = computeStars();
      starsAwarded = true;
      starsToday = record.starsToday + starsEarned;
      starsEarnedThisRun = starsEarned;
    }

    const crossed = settings.rewardsEnabled && !record.rewardPending && starsToday >= settings.dailyStarTarget;

    const entry: TopicSessionRecord = {
      subjectId,
      topicId,
      questionsPlanned: planned,
      answered,
      correct,
      completed: true,
      gradePercent,
      starsEarned,
      starsAwarded,
      completedAt: new Date().toISOString(),
    };

    setDailyRecords((prev) => ({
      ...prev,
      [kidId]: {
        ...record,
        topics: { ...record.topics, [key]: entry },
        starsToday,
        rewardPending: crossed || record.rewardPending,
      },
    }));
    setLastPlayDate((prev) => ({ ...prev, [kidId]: todayStr() }));

    return { starsEarnedThisRun, rewardReady: crossed };
  };

  const claimReward: AppState['claimReward'] = (kidId) => {
    withTodayRecord(kidId, (record) => {
      const topics = Object.fromEntries(
        Object.entries(record.topics).map(([key, entry]) => [key, { ...entry, starsAwarded: false }]),
      );
      return { ...record, topics, starsToday: 0, rewardPending: false };
    });
  };

  const resetTodayForKid: AppState['resetTodayForKid'] = (kidId) => {
    setDailyRecords((prev) => ({ ...prev, [kidId]: emptyDailyRecord() }));
  };

  const resetAllProgressForKid: AppState['resetAllProgressForKid'] = (kidId) => {
    setDailyRecords((prev) => ({ ...prev, [kidId]: emptyDailyRecord() }));
    setLastPlayDate((prev) => {
      const next = { ...prev };
      delete next[kidId];
      return next;
    });
  };

  return (
    <AppContext.Provider
      value={{
        kids,
        activeKidId,
        theme,
        gateEnabled,
        kidSettings,
        dailyRecords,
        lastPlayDate,
        addKid,
        setActiveKid,
        setTheme,
        setGateEnabled,
        getKidSettings,
        updateKidSettings,
        getTodayRecord,
        recordTopicProgress,
        completeTopicSession,
        claimReward,
        resetTodayForKid,
        resetAllProgressForKid,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
