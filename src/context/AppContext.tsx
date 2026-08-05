import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { DailyHistory, DailyRecord, Kid, KidSettings, ThemeName, TopicSessionRecord } from '../types';
import { todayStr } from '../utils/date';
import { computeStars } from '../utils/rewards';
import { activityKey } from '../utils/progress';
import { setSoundPreferences } from '../utils/sound';

const DEFAULT_SETTINGS: KidSettings = {
  questionsPerTopic: 10,
  difficulty: 'normal',
  rewardsEnabled: true,
  dailyStarTarget: 10,
  rewards: [],
  plan: {},
  planOnly: false,
  freePlayAfterPlan: true,
};

/**
 * How many days of records we keep per kid. Long enough for a parent to see a
 * term's worth of trend, short enough that localStorage stays small.
 */
const HISTORY_DAYS = 90;

function emptyDailyRecord(date = todayStr()): DailyRecord {
  return { date, topics: {}, starsToday: 0, rewardPending: false, offlineDone: [] };
}

/** Fills in fields added after a record was written. */
function normaliseRecord(rec: Partial<DailyRecord> & { date: string }): DailyRecord {
  const topics = Object.fromEntries(
    Object.entries((rec.topics ?? {}) as Record<string, Partial<TopicSessionRecord>>).map(([key, entry]) => [
      key,
      { ...entry, secondsSpent: entry.secondsSpent ?? 0 } as TopicSessionRecord,
    ]),
  );
  return { ...emptyDailyRecord(rec.date), ...rec, topics };
}

function looksLikeRecord(value: unknown): value is DailyRecord {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as DailyRecord).date === 'string' &&
    typeof (value as DailyRecord).topics === 'object'
  );
}

/** Newest `HISTORY_DAYS` days. ISO dates sort correctly as strings. */
function pruneHistory(history: DailyHistory): DailyHistory {
  const dates = Object.keys(history).sort();
  if (dates.length <= HISTORY_DAYS) return history;
  return Object.fromEntries(dates.slice(-HISTORY_DAYS).map((d) => [d, history[d]]));
}

/**
 * Earlier builds stored one record per kid and threw it away at midnight, so an
 * upgrading profile has exactly one day of work in the old shape. Fold it in as
 * that day rather than discarding it, and leave anything unrecognisable alone
 * instead of clearing it.
 */
function migrateDailyRecords(raw: unknown): Record<string, DailyHistory> {
  if (typeof raw !== 'object' || raw === null) return {};
  const out: Record<string, DailyHistory> = {};

  for (const [kidId, value] of Object.entries(raw as Record<string, unknown>)) {
    if (looksLikeRecord(value)) {
      out[kidId] = { [value.date]: normaliseRecord(value) };
      continue;
    }
    if (typeof value !== 'object' || value === null) continue;

    const days: DailyHistory = {};
    for (const [date, rec] of Object.entries(value as Record<string, unknown>)) {
      if (looksLikeRecord(rec)) days[date] = normaliseRecord(rec);
    }
    out[kidId] = pruneHistory(days);
  }

  return out;
}

interface PersistedState {
  kids: Kid[];
  activeKidId: string | null;
  theme: ThemeName;
  gateEnabled: boolean;
  /** Device-wide, not per kid — the tablet is shared. */
  tapSoundsEnabled: boolean;
  gameSoundsEnabled: boolean;
  kidSettings: Record<string, KidSettings>;
  /** kidId -> date -> that day's record. See `HISTORY_DAYS`. */
  dailyRecords: Record<string, DailyHistory>;
  lastPlayDate: Record<string, string>;
}

interface CompleteResult {
  starsEarnedThisRun: number;
  rewardReady: boolean;
}

export interface CompleteSessionInput {
  kidId: string;
  subjectId: string;
  topicId: string;
  activityId: string;
  correct: number;
  answered: number;
  planned: number;
  passed: boolean;
  /** Length of this run, added to any time already spent on the activity today. */
  secondsSpent: number;
}

interface AppState extends PersistedState {
  addKid: (kid: Omit<Kid, 'id'>) => Kid;
  updateKid: (kidId: string, partial: Partial<Omit<Kid, 'id'>>) => void;
  removeKid: (kidId: string) => void;
  setActiveKid: (id: string) => void;
  setTheme: (t: ThemeName) => void;
  setGateEnabled: (v: boolean) => void;
  setTapSoundsEnabled: (v: boolean) => void;
  setGameSoundsEnabled: (v: boolean) => void;
  /** Wipes every profile, setting and record on this device. */
  resetApp: () => void;
  getKidSettings: (kidId: string) => KidSettings;
  updateKidSettings: (kidId: string, partial: Partial<KidSettings>) => void;
  getTodayRecord: (kidId: string) => DailyRecord;
  /** Every stored day for a kid, newest first. */
  getHistory: (kidId: string) => DailyRecord[];
  recordTopicProgress: (
    kidId: string,
    subjectId: string,
    topicId: string,
    activityId: string,
    answered: number,
    correct: number,
  ) => void;
  completeTopicSession: (input: CompleteSessionInput) => CompleteResult;
  toggleOfflinePlanItem: (kidId: string, itemId: string) => void;
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


export function AppProvider({ children }: { children: ReactNode }) {
  const initial = loadState();
  const [kids, setKids] = useState<Kid[]>(initial.kids ?? []);
  const [activeKidId, setActiveKidId] = useState<string | null>(initial.activeKidId ?? null);
  const [theme, setThemeState] = useState<ThemeName>(initial.theme ?? 'playful');
  const [gateEnabled, setGateEnabledState] = useState<boolean>(initial.gateEnabled ?? true);
  const [tapSoundsEnabled, setTapSoundsEnabledState] = useState<boolean>(initial.tapSoundsEnabled ?? true);
  const [gameSoundsEnabled, setGameSoundsEnabledState] = useState<boolean>(initial.gameSoundsEnabled ?? true);
  const [kidSettings, setKidSettings] = useState<Record<string, KidSettings>>(initial.kidSettings ?? {});
  const [dailyRecords, setDailyRecords] = useState<Record<string, DailyHistory>>(() =>
    migrateDailyRecords(initial.dailyRecords),
  );
  const [lastPlayDate, setLastPlayDate] = useState<Record<string, string>>(initial.lastPlayDate ?? {});

  useEffect(() => {
    const toSave: PersistedState = {
      kids,
      activeKidId,
      theme,
      gateEnabled,
      tapSoundsEnabled,
      gameSoundsEnabled,
      kidSettings,
      dailyRecords,
      lastPlayDate,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }, [kids, activeKidId, theme, gateEnabled, tapSoundsEnabled, gameSoundsEnabled, kidSettings, dailyRecords, lastPlayDate]);

  // The audio module can't read context, so push preferences down to it.
  useEffect(() => {
    setSoundPreferences({ tap: tapSoundsEnabled, game: gameSoundsEnabled });
  }, [tapSoundsEnabled, gameSoundsEnabled]);

  const addKid: AppState['addKid'] = (kid) => {
    const newKid: Kid = { ...kid, id: crypto.randomUUID() };
    setKids((prev) => [...prev, newKid]);
    setActiveKidId(newKid.id);
    setKidSettings((prev) => ({ ...prev, [newKid.id]: { ...DEFAULT_SETTINGS } }));
    return newKid;
  };

  const updateKid: AppState['updateKid'] = (kidId, partial) => {
    setKids((prev) => prev.map((k) => (k.id === kidId ? { ...k, ...partial } : k)));
  };

  /** Removes the profile and everything keyed to it, then re-points the active kid. */
  const removeKid: AppState['removeKid'] = (kidId) => {
    setKids((prev) => {
      const next = prev.filter((k) => k.id !== kidId);
      setActiveKidId((current) => (current === kidId ? (next[0]?.id ?? null) : current));
      return next;
    });
    setKidSettings((prev) => {
      const next = { ...prev };
      delete next[kidId];
      return next;
    });
    setDailyRecords((prev) => {
      const next = { ...prev };
      delete next[kidId];
      return next;
    });
    setLastPlayDate((prev) => {
      const next = { ...prev };
      delete next[kidId];
      return next;
    });
  };

  const setActiveKid = (id: string) => setActiveKidId(id);
  const setTheme = (t: ThemeName) => setThemeState(t);
  const setGateEnabled = (v: boolean) => setGateEnabledState(v);
  const setTapSoundsEnabled = (v: boolean) => setTapSoundsEnabledState(v);
  const setGameSoundsEnabled = (v: boolean) => setGameSoundsEnabledState(v);

  /** Back to a first-run app: no profiles, no settings, no history. */
  const resetApp: AppState['resetApp'] = () => {
    setKids([]);
    setActiveKidId(null);
    setKidSettings({});
    setDailyRecords({});
    setLastPlayDate({});
    setThemeState('playful');
    setGateEnabledState(true);
    setTapSoundsEnabledState(true);
    setGameSoundsEnabledState(true);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage unavailable — in-memory reset above still applies */
    }
  };

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
    const record = dailyRecords[kidId]?.[todayStr()];
    return record ? normaliseRecord(record) : emptyDailyRecord();
  };

  const getHistory: AppState['getHistory'] = (kidId) => {
    const history = dailyRecords[kidId] ?? {};
    return Object.keys(history)
      .sort()
      .reverse()
      .map((date) => normaliseRecord(history[date]));
  };

  function withTodayRecord(
    kidId: string,
    updater: (record: DailyRecord) => DailyRecord,
  ) {
    setDailyRecords((prev) => {
      const today = todayStr();
      const history = prev[kidId] ?? {};
      const base = history[today] ? normaliseRecord(history[today]) : emptyDailyRecord();
      return { ...prev, [kidId]: pruneHistory({ ...history, [today]: updater(base) }) };
    });
  }

  const recordTopicProgress: AppState['recordTopicProgress'] = (
    kidId,
    subjectId,
    topicId,
    activityId,
    answered,
    correct,
  ) => {
    const settings = getKidSettings(kidId);
    const key = activityKey(subjectId, topicId, activityId);
    withTodayRecord(kidId, (record) => {
      const existing = record.topics[key];
      const entry: TopicSessionRecord = existing
        ? { ...existing, answered, correct }
        : {
            subjectId,
            topicId,
            activityId,
            questionsPlanned: settings.questionsPerTopic,
            answered,
            correct,
            completed: false,
            gradePercent: null,
            starsEarned: 0,
            secondsSpent: 0,
            completedAt: null,
          };
      return { ...record, topics: { ...record.topics, [key]: entry } };
    });
    setLastPlayDate((prev) => ({ ...prev, [kidId]: todayStr() }));
  };

  const completeTopicSession: AppState['completeTopicSession'] = ({
    kidId,
    subjectId,
    topicId,
    activityId,
    correct,
    answered,
    planned,
    passed,
    secondsSpent,
  }) => {
    const settings = getKidSettings(kidId);
    const key = activityKey(subjectId, topicId, activityId);
    const stored = dailyRecords[kidId]?.[todayStr()];
    const record = stored ? normaliseRecord(stored) : emptyDailyRecord();

    const existing = record.topics[key];
    const runGrade = answered > 0 ? Math.round((100 * correct) / answered) : 0;
    const gradePercent = existing?.gradePercent != null ? Math.max(existing.gradePercent, runGrade) : runGrade;

    // A star for every finish, not just the first time on an activity — going
    // back to something a second time is practice, and practice should count.
    const starsEarnedThisRun = settings.rewardsEnabled && passed ? computeStars() : 0;
    const starsEarned = (existing?.starsEarned ?? 0) + starsEarnedThisRun;
    const starsToday = record.starsToday + starsEarnedThisRun;

    const crossed = settings.rewardsEnabled && !record.rewardPending && starsToday >= settings.dailyStarTarget;

    const entry: TopicSessionRecord = {
      subjectId,
      topicId,
      activityId,
      questionsPlanned: planned,
      answered,
      correct,
      completed: true,
      gradePercent,
      starsEarned,
      secondsSpent: (existing?.secondsSpent ?? 0) + Math.max(0, Math.round(secondsSpent)),
      completedAt: new Date().toISOString(),
    };

    setDailyRecords((prev) => {
      const history = prev[kidId] ?? {};
      return {
        ...prev,
        [kidId]: pruneHistory({
          ...history,
          [todayStr()]: {
            ...record,
            topics: { ...record.topics, [key]: entry },
            starsToday,
            rewardPending: crossed || record.rewardPending,
          },
        }),
      };
    });
    setLastPlayDate((prev) => ({ ...prev, [kidId]: todayStr() }));

    return { starsEarnedThisRun, rewardReady: crossed };
  };

  const toggleOfflinePlanItem: AppState['toggleOfflinePlanItem'] = (kidId, itemId) => {
    withTodayRecord(kidId, (record) => {
      const done = record.offlineDone.includes(itemId)
        ? record.offlineDone.filter((id) => id !== itemId)
        : [...record.offlineDone, itemId];
      return { ...record, offlineDone: done };
    });
  };

  /**
   * Claiming spends the stars but not the record of earning them — `starsToday`
   * is progress toward the next reward, while each activity's `starsEarned`
   * stays put as history.
   */
  const claimReward: AppState['claimReward'] = (kidId) => {
    withTodayRecord(kidId, (record) => ({ ...record, starsToday: 0, rewardPending: false }));
  };

  /** Clears today only — earlier days are the parent's record and survive. */
  const resetTodayForKid: AppState['resetTodayForKid'] = (kidId) => {
    setDailyRecords((prev) => ({ ...prev, [kidId]: { ...prev[kidId], [todayStr()]: emptyDailyRecord() } }));
  };

  const resetAllProgressForKid: AppState['resetAllProgressForKid'] = (kidId) => {
    setDailyRecords((prev) => ({ ...prev, [kidId]: {} }));
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
        tapSoundsEnabled,
        gameSoundsEnabled,
        kidSettings,
        dailyRecords,
        lastPlayDate,
        addKid,
        updateKid,
        removeKid,
        setActiveKid,
        setTheme,
        setGateEnabled,
        setTapSoundsEnabled,
        setGameSoundsEnabled,
        resetApp,
        getKidSettings,
        updateKidSettings,
        getTodayRecord,
        getHistory,
        recordTopicProgress,
        completeTopicSession,
        toggleOfflinePlanItem,
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
