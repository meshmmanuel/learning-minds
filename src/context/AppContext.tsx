import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Kid, ThemeName } from '../types';

interface Progress {
  [kidId: string]: { [subjectId: string]: number };
}

interface PersistedState {
  kids: Kid[];
  activeKidId: string | null;
  theme: ThemeName;
  gateEnabled: boolean;
  progress: Progress;
}

interface AppState extends PersistedState {
  addKid: (kid: Omit<Kid, 'id'>) => Kid;
  setActiveKid: (id: string) => void;
  setTheme: (t: ThemeName) => void;
  setGateEnabled: (v: boolean) => void;
  bumpProgress: (subjectId: string, amount?: number) => void;
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
  const [progress, setProgress] = useState<Progress>(initial.progress ?? {});

  useEffect(() => {
    const toSave: PersistedState = { kids, activeKidId, theme, gateEnabled, progress };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }, [kids, activeKidId, theme, gateEnabled, progress]);

  const addKid: AppState['addKid'] = (kid) => {
    const newKid: Kid = { ...kid, id: crypto.randomUUID() };
    setKids((prev) => [...prev, newKid]);
    setActiveKidId(newKid.id);
    return newKid;
  };

  const setActiveKid = (id: string) => setActiveKidId(id);
  const setTheme = (t: ThemeName) => setThemeState(t);
  const setGateEnabled = (v: boolean) => setGateEnabledState(v);

  const bumpProgress: AppState['bumpProgress'] = (subjectId, amount = 12) => {
    if (!activeKidId) return;
    setProgress((prev) => {
      const kidProgress = prev[activeKidId] ?? {};
      const current = kidProgress[subjectId] ?? 0;
      const next = Math.min(100, current + amount);
      return { ...prev, [activeKidId]: { ...kidProgress, [subjectId]: next } };
    });
  };

  return (
    <AppContext.Provider
      value={{
        kids,
        activeKidId,
        theme,
        gateEnabled,
        progress,
        addKid,
        setActiveKid,
        setTheme,
        setGateEnabled,
        bumpProgress,
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
