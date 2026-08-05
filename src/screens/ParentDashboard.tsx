import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { themes } from '../theme';
import { avatarOptions, findActivity, findSubject, findTopic, visibleSubjects } from '../data/subjects';
import type { Difficulty, KidSettings, PlanItem, QuestionsPerTopic, ThemeName, WeekPlan } from '../types';
import { daysSince, todayWeekday } from '../utils/date';
import {
  DURATION_OPTIONS,
  WEEKDAYS,
  formatGap,
  formatMinutesSpent,
  formatSlot,
  formatTime,
  gapBefore,
  isPlanItemDone,
  overlappingIds,
  planItemIcon,
  planItemLabel,
  planItemRecord,
  sortPlanItems,
} from '../utils/plan';
import PlanAddSheet from '../components/PlanAddSheet';
import TimePicker from '../components/TimePicker';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import { subjectTodayPercent } from '../utils/progress';
import {
  canPromptInstall,
  isAppInstalled,
  isIosDevice,
  promptInstall,
  subscribeInstallAvailability,
} from '../pwa/installPrompt';
import { checkForUpdate, formatBuildTime, type UpdateCheckResult } from '../pwa/updates';

const THEME_ORDER: ThemeName[] = ['calm', 'playful', 'adventure'];
const QUESTIONS_OPTIONS: QuestionsPerTopic[] = [1, 10, 20, 30];
const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'normal', label: 'Normal' },
  { value: 'hard', label: 'Hard' },
];
const STAR_TARGET_OPTIONS = [1, 5, 10, 15, 20];
const REWARD_EMOJI_OPTIONS = ['🍦', '🎬', '📺', '🍪', '🎨', '🎈', '🧸', '🍕', '🎮', '📚', '🚲', '🦄', '🎁', '⭐', '🍩'];
const MAX_REWARDS = 8;

type Section = 'overview' | 'timetable' | 'play' | 'rewards' | 'profile' | 'danger' | 'device';


interface NavItem {
  id: Section;
  label: string;
  icon: string;
  danger?: boolean;
}

/** Pending edits across every section — committed as one by the Save button. */
interface Draft {
  theme: ThemeName;
  gateEnabled: boolean;
  tapSoundsEnabled: boolean;
  gameSoundsEnabled: boolean;
  name: string;
  avatarIcon: string;
  avatarColor: string;
  settings: KidSettings;
}

const KID_NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: 'fa-solid fa-chart-simple' },
  { id: 'timetable', label: 'Timetable', icon: 'fa-solid fa-calendar-days' },
  { id: 'play', label: 'Play settings', icon: 'fa-solid fa-sliders' },
  { id: 'rewards', label: 'Rewards', icon: 'fa-solid fa-gift' },
  { id: 'profile', label: 'Profile', icon: 'fa-solid fa-id-badge' },
  { id: 'danger', label: 'Danger zone', icon: 'fa-solid fa-triangle-exclamation', danger: true },
];

const DEVICE_NAV_ITEM: NavItem = { id: 'device', label: 'Device', icon: 'fa-solid fa-mobile-screen-button' };

const sectionLabel: CSSProperties = {
  fontFamily: "'Baloo 2', sans-serif",
  fontWeight: 700,
  fontSize: 15,
  color: '#2E2B26',
};

const fieldLabel: CSSProperties = {
  fontFamily: "'Nunito', sans-serif",
  fontWeight: 700,
  fontSize: 13,
  color: '#5B4A1E',
};

export default function ParentDashboard() {
  const {
    theme,
    setTheme,
    kids,
    activeKidId,
    setActiveKid,
    updateKid,
    removeKid,
    gateEnabled,
    setGateEnabled,
    tapSoundsEnabled,
    setTapSoundsEnabled,
    gameSoundsEnabled,
    setGameSoundsEnabled,
    resetApp,
    getKidSettings,
    updateKidSettings,
    getTodayRecord,
    lastPlayDate,
    resetTodayForKid,
    resetAllProgressForKid,
  } = useApp();
  const palette = themes[theme];
  const navigate = useNavigate();

  const [section, setSection] = useState<Section>('overview');
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const kid = kids.find((k) => k.id === activeKidId);
  const settings = kid ? getKidSettings(kid.id) : null;

  /**
   * Everything the dashboard edits lives here until Save. Destructive actions
   * (resets, deletes) deliberately bypass it — they're commands, not settings.
   */
  const committed: Draft | null = kid && settings
    ? {
        theme,
        gateEnabled,
        tapSoundsEnabled,
        gameSoundsEnabled,
        name: kid.name,
        avatarIcon: kid.avatarIcon,
        avatarColor: kid.avatarColor,
        settings,
      }
    : null;

  const [draft, setDraft] = useState<Draft | null>(committed);

  // Re-seed when the active profile changes, or after a reset wipes the source.
  const draftKeyRef = useRef<string | null>(kid?.id ?? null);
  useEffect(() => {
    if (draftKeyRef.current !== (kid?.id ?? null)) {
      draftKeyRef.current = kid?.id ?? null;
      setDraft(committed);
    } else if (!kid) {
      setDraft(null);
    }
  }, [kid, committed]);

  const isDirty = Boolean(draft && committed && JSON.stringify(draft) !== JSON.stringify(committed));

  const patch = (p: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...p } : d));
  const patchSettings = (p: Partial<KidSettings>) =>
    setDraft((d) => (d ? { ...d, settings: { ...d.settings, ...p } } : d));

  const [toast, setToast] = useState<string | null>(null);

  const handleSave = () => {
    if (!kid || !draft) return;
    setTheme(draft.theme);
    setGateEnabled(draft.gateEnabled);
    setTapSoundsEnabled(draft.tapSoundsEnabled);
    setGameSoundsEnabled(draft.gameSoundsEnabled);
    updateKid(kid.id, {
      name: draft.name.trim() || kid.name,
      avatarIcon: draft.avatarIcon,
      avatarColor: draft.avatarColor,
    });
    updateKidSettings(kid.id, draft.settings);
    setToast('Settings saved');
  };

  const handleDiscard = () => {
    setDraft(committed);
    setToast('Changes discarded');
  };

  const todayRecord = kid ? getTodayRecord(kid.id) : null;
  const daysAway = kid ? daysSince(lastPlayDate[kid.id] ?? null) : null;

  const todayEntries = todayRecord ? Object.values(todayRecord.topics) : [];
  const topicsFinishedToday = todayEntries.filter((e) => e.completed).length;
  const totalQuestionsToday = todayEntries.reduce((sum, e) => sum + e.answered, 0);

  /**
   * Destructive actions and the leave-with-unsaved-changes prompt all route
   * through one dialog rather than three native `window.confirm` calls.
   */
  type PendingAction =
    | { kind: 'resetAll' }
    | { kind: 'removeKid'; kidId: string; name: string; avatarIcon: string; avatarColor: string }
    | { kind: 'resetApp' }
    | { kind: 'switchKid'; kidId: string; name: string }
    | { kind: 'exit' };

  const [pending, setPending] = useState<PendingAction | null>(null);

  const handleResetToday = () => {
    if (!kid) return;
    resetTodayForKid(kid.id);
    setToast(`${kid.name}'s day reset`);
  };

  const [installed, setInstalled] = useState(isAppInstalled);
  const [canInstall, setCanInstall] = useState(canPromptInstall);
  const [installing, setInstalling] = useState(false);
  const [showIosSteps, setShowIosSteps] = useState(false);
  const [newRewardEmoji, setNewRewardEmoji] = useState(REWARD_EMOJI_OPTIONS[0]);
  const [newRewardLabel, setNewRewardLabel] = useState('');

  const handleAddReward = () => {
    if (!draft) return;
    const label = newRewardLabel.trim();
    if (!label || draft.settings.rewards.length >= MAX_REWARDS) return;
    patchSettings({ rewards: [...draft.settings.rewards, { emoji: newRewardEmoji, label }] });
    setNewRewardLabel('');
  };

  const handleRemoveReward = (index: number) => {
    if (!draft) return;
    patchSettings({ rewards: draft.settings.rewards.filter((_, i) => i !== index) });
  };

  const [planDay, setPlanDay] = useState<string>(WEEKDAYS[0].id);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [copyTargets, setCopyTargets] = useState<Set<string>>(new Set());

  const dayItems: PlanItem[] = sortPlanItems(draft?.settings.plan?.[planDay as keyof WeekPlan] ?? []);
  const dayClashes = overlappingIds(dayItems);
  /** Other weekdays have nothing to report yet — only today has a record. */
  const showsProgress = planDay === todayWeekday();

  const setDayItems = (items: PlanItem[]) => {
    if (!draft) return;
    patchSettings({ plan: { ...draft.settings.plan, [planDay]: items } });
  };

  const handleAddPlanItems = (items: PlanItem[]) => {
    setDayItems([...dayItems, ...items]);
  };

  const handleSetItemTime = (itemId: string, time: string) => {
    setDayItems(
      dayItems.map((i) =>
        i.id === itemId
          ? {
              ...i,
              time: time || undefined,
              // A slot without a start has nothing to measure from.
              durationMin: time ? (i.durationMin ?? 15) : undefined,
            }
          : i,
      ),
    );
  };

  const handleSetItemDuration = (itemId: string, minutes: number) => {
    setDayItems(dayItems.map((i) => (i.id === itemId ? { ...i, durationMin: minutes } : i)));
  };

  const handleRemovePlanItem = (itemId: string) => {
    setDayItems(dayItems.filter((i) => i.id !== itemId));
  };

  /** Replaces each target day with a fresh copy of this day's items. */
  const handleCopyDay = () => {
    if (!draft || copyTargets.size === 0) return;
    const nextPlan: WeekPlan = { ...draft.settings.plan };
    for (const day of copyTargets) {
      nextPlan[day as keyof WeekPlan] = dayItems.map((i) => ({ ...i, id: crypto.randomUUID() }));
    }
    patchSettings({ plan: nextPlan });
    setCopyTargets(new Set());
    setCopyOpen(false);
  };

  const toggleCopyTarget = (day: string) => {
    setCopyTargets((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  useEffect(() => {
    return subscribeInstallAvailability(() => {
      setInstalled(isAppInstalled());
      setCanInstall(canPromptInstall());
    });
  }, []);

  const [updateState, setUpdateState] = useState<'idle' | 'checking' | UpdateCheckResult>('idle');

  const handleCheckForUpdate = async () => {
    setUpdateState('checking');
    setUpdateState(await checkForUpdate());
  };

  const runPendingAction = () => {
    if (!pending) return;
    switch (pending.kind) {
      case 'resetAll':
        if (kid) {
          resetAllProgressForKid(kid.id);
          setToast(`${kid.name}'s progress cleared`);
        }
        break;
      case 'removeKid':
        removeKid(pending.kidId);
        setToast(`${pending.name} removed`);
        break;
      case 'resetApp':
        resetApp();
        navigate('/', { replace: true });
        return;
      case 'switchKid':
        setActiveKid(pending.kidId);
        setSwitcherOpen(false);
        break;
      case 'exit':
        navigate('/home');
        return;
    }
    setPending(null);
  };

  /** Switching profile or leaving would drop pending edits — ask first. */
  const requestSwitchKid = (kidId: string, name: string) => {
    if (isDirty) {
      setPending({ kind: 'switchKid', kidId, name });
      return;
    }
    setActiveKid(kidId);
    setSwitcherOpen(false);
  };

  const requestExit = () => {
    if (isDirty) {
      setPending({ kind: 'exit' });
      return;
    }
    navigate('/home');
  };

  const handleInstall = async () => {
    if (isIosDevice()) {
      setShowIosSteps(true);
      return;
    }
    if (!canInstall) return;
    setInstalling(true);
    try {
      await promptInstall();
      setInstalled(isAppInstalled());
      setCanInstall(canPromptInstall());
    } finally {
      setInstalling(false);
    }
  };

  const navButtonStyle = (active: boolean, danger?: boolean): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    // Explicit, so a nav button is the same width wherever it sits — the Device
    // one lives outside the flex list and would otherwise shrink to its label.
    width: '100%',
    padding: '10px 14px',
    borderRadius: 14,
    background: active ? (danger ? '#FDECEC' : '#FFF0EC') : 'transparent',
    border: `2px solid ${active ? (danger ? '#D64545' : palette.swatch) : 'transparent'}`,
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 800,
    fontSize: 13,
    color: danger ? '#D64545' : active ? '#3E3B34' : '#8F887A',
    textAlign: 'left',
    flexShrink: 0,
    whiteSpace: 'nowrap',
  });

  const renderNavButton = (item: NavItem) => (
    <button
      key={item.id}
      onClick={() => setSection(item.id)}
      className="tile"
      style={navButtonStyle(section === item.id, item.danger)}
    >
      <i className={item.icon} style={{ fontSize: 14, width: 16, textAlign: 'center' }} />
      {item.label}
    </button>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F7F5F0', display: 'flex', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 960, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 8px',
            borderBottom: '1px solid #E5E1D6',
          }}
        >
          <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: 22, color: '#2E2B26' }}>
            Parent Dashboard
          </div>
          <button
            onClick={requestExit}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 700,
              fontSize: 14,
              color: '#8F887A',
            }}
          >
            <i className="fa-solid fa-xmark" />
            Exit to app
          </button>
        </div>

        <div className="dashboardRail" style={{ display: 'flex', gap: 28, marginTop: 22, alignItems: 'flex-start' }}>
          <div className="dashboardNav" style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Who am I editing? Previously nothing here said so. */}
            {kid && (
              <div style={{ background: '#fff', borderRadius: 16, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={() => setSwitcherOpen((v) => !v)}
                  aria-expanded={switcherOpen}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left' }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: kid.avatarColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <i className={kid.avatarIcon} style={{ fontSize: 19, color: '#fff' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 16, color: '#2E2B26', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {kid.name}
                    </div>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 11, color: '#A9A294' }}>
                      {kids.length > 1 ? 'Tap to switch child' : 'Kindergarten'}
                    </div>
                  </div>
                  <i
                    className="fa-solid fa-chevron-down"
                    style={{ fontSize: 11, color: '#A9A294', transform: switcherOpen ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }}
                  />
                </button>

                {switcherOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, borderTop: '1px solid #EFEBE0', paddingTop: 8 }}>
                    {kids.map((k) => (
                      <button
                        key={k.id}
                        onClick={() => requestSwitchKid(k.id, k.name)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '7px 8px',
                          borderRadius: 10,
                          background: k.id === kid.id ? '#F2FBFA' : 'transparent',
                          textAlign: 'left',
                        }}
                      >
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            background: k.avatarColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <i className={k.avatarIcon} style={{ fontSize: 12, color: '#fff' }} />
                        </div>
                        <span style={{ flex: 1, fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 13, color: '#3E3B34' }}>
                          {k.name}
                        </span>
                        {k.id === kid.id && <i className="fa-solid fa-check" style={{ fontSize: 11, color: '#2EC4B6' }} />}
                      </button>
                    ))}
                    <button
                      onClick={() => navigate('/create-profile', { state: { returnTo: '/dashboard' } })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '7px 8px',
                        borderRadius: 10,
                        textAlign: 'left',
                        fontFamily: "'Nunito', sans-serif",
                        fontWeight: 700,
                        fontSize: 13,
                        color: '#2EC4B6',
                      }}
                    >
                      <span style={{ width: 26, display: 'flex', justifyContent: 'center' }}>
                        <i className="fa-solid fa-plus" style={{ fontSize: 12 }} />
                      </span>
                      Add a child
                    </button>
                  </div>
                )}

                {settings && todayRecord && settings.rewardsEnabled && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid #EFEBE0', paddingTop: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 13, color: '#5B4A1E' }}>
                      <i className="fa-solid fa-star" style={{ color: palette.starColor }} />
                      {Math.min(todayRecord.starsToday, settings.dailyStarTarget)}/{settings.dailyStarTarget} today
                    </div>
                    <div style={{ height: 8, background: '#E9E5D9', borderRadius: 999, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(100, (todayRecord.starsToday / settings.dailyStarTarget) * 100)}%`,
                          height: '100%',
                          background: palette.starColor,
                          borderRadius: 999,
                          transition: 'width 0.4s',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="dashboardNavList" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {KID_NAV_ITEMS.map(renderNavButton)}
            </div>

            <div className="dashboardNavDivider" style={{ height: 1, background: '#E5E1D6' }} />

            <div>
              {renderNavButton(DEVICE_NAV_ITEM)}
              <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 600, fontSize: 11, color: '#8F887A', padding: '4px 14px 0' }}>
                Applies to all kids
              </div>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {section === 'overview' && kid && settings && draft && todayRecord && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={sectionLabel}>{kid.name}'s work today</div>
                  {todayEntries.length === 0 ? (
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 600, fontSize: 13, color: '#8F887A' }}>
                      No topics played yet today.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {todayEntries.map((entry) => {
                        const subj = findSubject(entry.subjectId);
                        const top = findTopic(subj, entry.topicId);
                        const act = findActivity(top, entry.activityId);
                        return (
                          <div
                            key={`${entry.subjectId}:${entry.topicId}:${entry.activityId}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: '#fff',
                              borderRadius: 14,
                              padding: '10px 14px',
                              gap: 12,
                            }}
                          >
                            <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 13, color: '#3E3B34' }}>
                              {top?.label ?? entry.topicId} · {act?.label ?? entry.activityId}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                              <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 12, color: '#8F887A' }}>
                                {entry.completed
                                  ? `${entry.correct}/${entry.answered} correct (${entry.gradePercent}%)`
                                  : `In progress ${entry.answered}/${entry.questionsPlanned}`}
                              </span>
                              {settings.rewardsEnabled && entry.starsEarned > 0 && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <i className="fa-solid fa-star" style={{ fontSize: 12, color: palette.starColor }} />
                                  <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 12, color: '#8F887A' }}>
                                    {entry.starsEarned}
                                  </span>
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 14,
                      background: '#fff',
                      borderRadius: 14,
                      padding: '12px 16px',
                      fontFamily: "'Nunito', sans-serif",
                      fontWeight: 700,
                      fontSize: 12,
                      color: '#5B4A1E',
                    }}
                  >
                    <span>Topics finished: {topicsFinishedToday}</span>
                    <span>Questions today: {totalQuestionsToday}</span>
                    {settings.rewardsEnabled && (
                      <span>
                        Stars: {Math.min(todayRecord.starsToday, settings.dailyStarTarget)}/{settings.dailyStarTarget}
                        {todayRecord.rewardPending ? ' — Reward ready!' : ''}
                      </span>
                    )}
                    <span>
                      {daysAway === null ? 'Not started yet' : daysAway === 0 ? 'Played today' : `Away ${daysAway} day${daysAway > 1 ? 's' : ''}`}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={sectionLabel}>{kid.name}'s subjects today</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {visibleSubjects().map((s, i) => {
                      const pct = subjectTodayPercent(s.id, todayRecord);
                      const color = palette.tileColors[i % palette.tileColors.length];
                      return (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 10,
                              background: color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <i className={s.icon} style={{ fontSize: 13, color: '#fff' }} />
                          </div>
                          <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 13, color: '#3E3B34', width: 150, flexShrink: 0 }}>
                            {s.label}
                          </span>
                          <div style={{ flex: 1, height: 12, background: '#E9E5D9', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999, transition: 'width 0.4s' }} />
                          </div>
                          <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 12, color: '#8F887A', width: 36, textAlign: 'right' }}>
                            {pct}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {section === 'timetable' && kid && settings && draft && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={sectionLabel}>{kid.name}'s timetable</div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 600, fontSize: 13, color: '#8F887A' }}>
                  Set what {kid.name} works on each day — in the app or away from it. Times are a
                  guide, not a limit: the current slot is highlighted, but nothing disappears if
                  {' '}{kid.name} starts late.
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {WEEKDAYS.map((d) => {
                    const count = (settings.plan?.[d.id as keyof WeekPlan] ?? []).length;
                    const active = planDay === d.id;
                    return (
                      <button
                        key={d.id}
                        onClick={() => setPlanDay(d.id)}
                        className="tile"
                        style={{
                          borderRadius: 12,
                          padding: '8px 14px',
                          background: active ? '#2EC4B6' : '#fff',
                          color: active ? '#fff' : '#5B4A1E',
                          fontFamily: "'Nunito', sans-serif",
                          fontWeight: 800,
                          fontSize: 13,
                          border: '1px solid #E5E1D6',
                        }}
                      >
                        {d.short}
                        {count > 0 && (
                          <span style={{ marginLeft: 6, opacity: 0.75, fontSize: 11 }}>{count}</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={fieldLabel}>{WEEKDAYS.find((d) => d.id === planDay)?.long} plan</span>
                  {dayItems.length === 0 ? (
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 600, fontSize: 13, color: '#8F887A' }}>
                      Nothing planned — {kid.name} can still explore freely.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {dayItems.map((item, i) => {
                        const gap = gapBefore(dayItems, i);
                        const clashes = dayClashes.has(item.id);
                        const isLast = i === dayItems.length - 1;
                        // Only today's plan can report back — other days are still just a plan.
                        const done = showsProgress && todayRecord ? isPlanItemDone(item, todayRecord) : false;
                        const entry = showsProgress && todayRecord ? planItemRecord(item, todayRecord) : undefined;
                        return (
                          <div key={item.id}>
                            {gap !== null && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 4 }}>
                                <span style={{ width: 72, flexShrink: 0 }} />
                                <span style={{ width: 11, display: 'flex', justifyContent: 'center' }}>
                                  <span style={{ width: 2, height: 22, background: 'repeating-linear-gradient(#D8D3C6 0 3px, transparent 3px 6px)' }} />
                                </span>
                                <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 11, color: '#A9A294' }}>
                                  {formatGap(gap)}
                                </span>
                              </div>
                            )}

                            <div style={{ display: 'flex', alignItems: 'stretch', gap: 12 }}>
                              {/* Time rail — the day reads top to bottom at a glance. */}
                              <span
                                style={{
                                  width: 72,
                                  flexShrink: 0,
                                  paddingTop: 14,
                                  textAlign: 'right',
                                  fontFamily: "'Nunito', sans-serif",
                                  fontWeight: 800,
                                  fontSize: 12,
                                  color: item.time ? '#5B4A1E' : '#C9C2B4',
                                }}
                              >
                                {item.time ? formatTime(item.time) : 'Anytime'}
                              </span>

                              <span style={{ width: 11, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span
                                  style={{
                                    width: 11,
                                    height: 11,
                                    borderRadius: '50%',
                                    marginTop: 17,
                                    background: clashes ? '#D64545' : item.kind === 'app' ? '#2EC4B6' : '#C89B3C',
                                  }}
                                />
                                {!isLast && <span style={{ flex: 1, width: 2, background: '#E9E5D9' }} />}
                              </span>

                              <div
                                style={{
                                  flex: 1,
                                  minWidth: 0,
                                  marginBottom: 8,
                                  background: '#fff',
                                  border: clashes ? '1px solid #F0B4B4' : '1px solid transparent',
                                  borderRadius: 14,
                                  padding: '10px 14px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 8,
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <i className={planItemIcon(item)} style={{ fontSize: 15, color: item.kind === 'app' ? '#2EC4B6' : '#C89B3C', width: 18 }} />
                                  <span style={{ flex: 1, minWidth: 0, fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 13, color: '#3E3B34' }}>
                                    {planItemLabel(item)}
                                    {formatSlot(item) && (
                                      <span style={{ display: 'block', fontWeight: 600, fontSize: 11, color: '#A9A294' }}>
                                        {formatSlot(item)}
                                      </span>
                                    )}
                                  </span>
                                  <span
                                    style={{
                                      fontFamily: "'Nunito', sans-serif",
                                      fontWeight: 800,
                                      fontSize: 10,
                                      textTransform: 'uppercase',
                                      letterSpacing: 0.5,
                                      color: item.kind === 'app' ? '#2EC4B6' : '#C89B3C',
                                    }}
                                  >
                                    {item.kind === 'app' ? 'In app' : 'Offline'}
                                  </span>
                                  <button onClick={() => handleRemovePlanItem(item.id)} aria-label={`Remove ${planItemLabel(item)}`} style={{ color: '#D96459', padding: 4 }}>
                                    <i className="fa-solid fa-xmark" style={{ fontSize: 13 }} />
                                  </button>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                  <TimePicker
                                    value={item.time}
                                    onChange={(v) => handleSetItemTime(item.id, v)}
                                    compact
                                    label="Add time"
                                  />
                                  <select
                                    value={item.durationMin ?? ''}
                                    onChange={(e) => handleSetItemDuration(item.id, Number(e.target.value))}
                                    disabled={!item.time}
                                    aria-label={`Duration for ${planItemLabel(item)}`}
                                    style={{
                                      width: 78,
                                      background: item.time ? '#F2FBFA' : '#F7F5F0',
                                      border: '1px solid #E5E1D6',
                                      borderRadius: 8,
                                      padding: '5px 6px',
                                      fontFamily: "'Nunito', sans-serif",
                                      fontWeight: 700,
                                      fontSize: 12,
                                      color: item.time ? '#2E2B26' : '#A9A294',
                                      outline: 'none',
                                    }}
                                  >
                                    <option value="">—</option>
                                    {DURATION_OPTIONS.map((d) => (
                                      <option key={d} value={d}>
                                        {d} min
                                      </option>
                                    ))}
                                  </select>
                                  {clashes && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 11, color: '#D64545' }}>
                                      <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 11 }} />
                                      Overlaps another slot
                                    </span>
                                  )}
                                </div>

                                {/* How the plan actually went. Today only. */}
                                {showsProgress && (
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 8,
                                      flexWrap: 'wrap',
                                      borderTop: '1px dashed #ECE8DC',
                                      paddingTop: 8,
                                      fontFamily: "'Nunito', sans-serif",
                                      fontWeight: 800,
                                      fontSize: 11,
                                    }}
                                  >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: done ? '#2E9E70' : '#A9A294' }}>
                                      <i
                                        className={done ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'}
                                        style={{ fontSize: 11 }}
                                      />
                                      {done ? 'Done' : 'Not done yet'}
                                    </span>

                                    {entry && entry.answered > 0 && (
                                      <span style={{ color: '#8F887A' }}>
                                        {entry.correct}/{entry.answered} correct
                                        {entry.gradePercent !== null && ` (${entry.gradePercent}%)`}
                                      </span>
                                    )}

                                    {entry && entry.secondsSpent > 0 && (
                                      <span style={{ color: '#8F887A' }}>
                                        {item.durationMin
                                          ? `${item.durationMin} min planned · ${formatMinutesSpent(entry.secondsSpent)} done`
                                          : `${formatMinutesSpent(entry.secondsSpent)} spent`}
                                      </span>
                                    )}

                                    {entry && entry.starsEarned > 0 && settings.rewardsEnabled && (
                                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#8F887A' }}>
                                        <i className="fa-solid fa-star" style={{ fontSize: 10, color: palette.starColor }} />
                                        {entry.starsEarned}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    onClick={() => setAddSheetOpen(true)}
                    className="tile"
                    style={{
                      borderRadius: 12,
                      padding: '12px 20px',
                      background: '#2EC4B6',
                      color: '#fff',
                      fontFamily: "'Baloo 2', sans-serif",
                      fontWeight: 800,
                      fontSize: 15,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <i className="fa-solid fa-plus" style={{ fontSize: 13 }} />
                    Add to {WEEKDAYS.find((d) => d.id === planDay)?.long}
                  </button>

                  {dayItems.length > 0 && (
                    <button
                      onClick={() => setCopyOpen((v) => !v)}
                      className="tile"
                      style={{
                        borderRadius: 12,
                        padding: '12px 18px',
                        background: '#fff',
                        border: '1px solid #E5E1D6',
                        color: '#5B4A1E',
                        fontFamily: "'Nunito', sans-serif",
                        fontWeight: 800,
                        fontSize: 13,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <i className="fa-solid fa-copy" style={{ fontSize: 12 }} />
                      Copy to…
                    </button>
                  )}
                </div>

                {copyOpen && dayItems.length > 0 && (
                  <div style={{ background: '#fff', borderRadius: 16, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <span style={fieldLabel}>
                      Copy {WEEKDAYS.find((d) => d.id === planDay)?.long}'s {dayItems.length}{' '}
                      {dayItems.length === 1 ? 'item' : 'items'} to:
                    </span>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {WEEKDAYS.filter((d) => d.id !== planDay).map((d) => {
                        const on = copyTargets.has(d.id);
                        return (
                          <button
                            key={d.id}
                            onClick={() => toggleCopyTarget(d.id)}
                            aria-pressed={on}
                            style={{
                              borderRadius: 10,
                              padding: '8px 14px',
                              background: on ? '#2EC4B6' : '#fff',
                              color: on ? '#fff' : '#5B4A1E',
                              border: '1px solid #E5E1D6',
                              fontFamily: "'Nunito', sans-serif",
                              fontWeight: 800,
                              fontSize: 13,
                            }}
                          >
                            {d.short}
                          </button>
                        );
                      })}
                    </div>
                    <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 600, fontSize: 12, color: '#A9A294' }}>
                      This replaces whatever is already on those days.
                    </span>
                    <button
                      onClick={handleCopyDay}
                      disabled={copyTargets.size === 0}
                      style={{
                        alignSelf: 'flex-start',
                        borderRadius: 10,
                        padding: '10px 18px',
                        background: copyTargets.size > 0 ? '#2EC4B6' : '#D8D3C6',
                        color: '#fff',
                        fontFamily: "'Nunito', sans-serif",
                        fontWeight: 800,
                        fontSize: 13,
                      }}
                    >
                      {copyTargets.size > 0 ? `Copy to ${copyTargets.size} ${copyTargets.size === 1 ? 'day' : 'days'}` : 'Copy'}
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: 16, padding: '14px 18px', gap: 16 }}>
                    <div>
                      <div style={fieldLabel}>Plan only</div>
                      <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 600, fontSize: 12, color: '#A9A294', marginTop: 2 }}>
                        {kid.name} can only do what's on today's plan.
                      </div>
                    </div>
                    <button
                      onClick={() => patchSettings({ planOnly: !draft.settings.planOnly })}
                      aria-label="Toggle plan only mode"
                      style={{
                        width: 52,
                        height: 30,
                        borderRadius: 999,
                        background: draft.settings.planOnly ? '#3DDC97' : '#D8D3C4',
                        position: 'relative',
                        transition: 'background 0.2s',
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: '#fff',
                          position: 'absolute',
                          top: 3,
                          left: draft.settings.planOnly ? 25 : 3,
                          transition: 'left 0.2s',
                        }}
                      />
                    </button>
                  </div>

                  {draft.settings.planOnly && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: 16, padding: '14px 18px', gap: 16 }}>
                      <div>
                        <div style={fieldLabel}>Unlock free play when the plan is done</div>
                        <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 600, fontSize: 12, color: '#A9A294', marginTop: 2 }}>
                          Turns the lock into a reward instead of a wall.
                        </div>
                      </div>
                      <button
                        onClick={() => patchSettings({ freePlayAfterPlan: !draft.settings.freePlayAfterPlan })}
                        aria-label="Toggle free play after plan"
                        style={{
                          width: 52,
                          height: 30,
                          borderRadius: 999,
                          background: draft.settings.freePlayAfterPlan ? '#3DDC97' : '#D8D3C4',
                          position: 'relative',
                          transition: 'background 0.2s',
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: '#fff',
                            position: 'absolute',
                            top: 3,
                            left: draft.settings.freePlayAfterPlan ? 25 : 3,
                            transition: 'left 0.2s',
                          }}
                        />
                      </button>
                    </div>
                  )}
                </div>

                {addSheetOpen && (
                  <PlanAddSheet
                    dayLabel={WEEKDAYS.find((d) => d.id === planDay)?.long ?? 'day'}
                    onClose={() => setAddSheetOpen(false)}
                    onAdd={handleAddPlanItems}
                  />
                )}
              </div>
            )}

            {section === 'play' && kid && settings && draft && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={sectionLabel}>{kid.name}'s play settings</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={fieldLabel}>Questions per topic</span>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {QUESTIONS_OPTIONS.map((n) => {
                      const isSelected = draft.settings.questionsPerTopic === n;
                      return (
                        <button
                          key={n}
                          onClick={() => patchSettings({ questionsPerTopic: n })}
                          className="tile"
                          style={{
                            flex: '1 1 90px',
                            borderRadius: 14,
                            padding: '10px 14px',
                            background: isSelected ? '#FFF0EC' : '#F7F5F0',
                            border: `2px solid ${isSelected ? palette.swatch : '#DDD8C8'}`,
                            fontFamily: "'Nunito', sans-serif",
                            fontWeight: 800,
                            fontSize: 14,
                            color: '#3E3B34',
                          }}
                        >
                          {n}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={fieldLabel}>Difficulty</span>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {DIFFICULTY_OPTIONS.map(({ value, label }) => {
                      const isSelected = draft.settings.difficulty === value;
                      return (
                        <button
                          key={value}
                          onClick={() => patchSettings({ difficulty: value })}
                          className="tile"
                          style={{
                            flex: '1 1 90px',
                            borderRadius: 14,
                            padding: '10px 14px',
                            background: isSelected ? '#FFF0EC' : '#F7F5F0',
                            border: `2px solid ${isSelected ? palette.swatch : '#DDD8C8'}`,
                            fontFamily: "'Nunito', sans-serif",
                            fontWeight: 800,
                            fontSize: 14,
                            color: '#3E3B34',
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {section === 'rewards' && kid && settings && draft && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={sectionLabel}>{kid.name}'s rewards</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: 16, padding: '14px 18px' }}>
                  <span style={fieldLabel}>Stars &amp; daily goal</span>
                  <button
                    onClick={() => patchSettings({ rewardsEnabled: !draft.settings.rewardsEnabled })}
                    aria-label="Toggle rewards"
                    style={{
                      width: 52,
                      height: 30,
                      borderRadius: 999,
                      background: draft.settings.rewardsEnabled ? '#3DDC97' : '#D8D3C4',
                      position: 'relative',
                      transition: 'background 0.2s',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: '#fff',
                        position: 'absolute',
                        top: 3,
                        left: draft.settings.rewardsEnabled ? 25 : 3,
                        transition: 'left 0.2s',
                      }}
                    />
                  </button>
                </div>
                {draft.settings.rewardsEnabled && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={fieldLabel}>Daily star target</span>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {STAR_TARGET_OPTIONS.map((n) => {
                        const isSelected = draft.settings.dailyStarTarget === n;
                        return (
                          <button
                            key={n}
                            onClick={() => updateKidSettings(kid.id, { dailyStarTarget: n })}
                            className="tile"
                            style={{
                              flex: '1 1 70px',
                              borderRadius: 14,
                              padding: '10px 14px',
                              background: isSelected ? '#FFF0EC' : '#F7F5F0',
                              border: `2px solid ${isSelected ? palette.swatch : '#DDD8C8'}`,
                              fontFamily: "'Nunito', sans-serif",
                              fontWeight: 800,
                              fontSize: 14,
                              color: '#3E3B34',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                            }}
                          >
                            <i className="fa-solid fa-star" style={{ fontSize: 12, color: palette.starColor }} />
                            {n}
                          </button>
                        );
                      })}
                    </div>

                    <span style={fieldLabel}>Possible rewards</span>
                    {draft.settings.rewards.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {draft.settings.rewards.map((r, i) => (
                          <div
                            key={i}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: '#fff',
                              borderRadius: 14,
                              padding: '10px 14px',
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "'Nunito', sans-serif",
                                fontWeight: 700,
                                fontSize: 14,
                                color: '#3E3B34',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                              }}
                            >
                              <span style={{ fontSize: 18 }}>{r.emoji}</span>
                              {r.label}
                            </span>
                            <button
                              onClick={() => handleRemoveReward(i)}
                              aria-label={`Remove ${r.label}`}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                background: '#F7F5F0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <i className="fa-solid fa-xmark" style={{ fontSize: 13, color: '#8C8474' }} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {draft.settings.rewards.length < MAX_REWARDS ? (
                      <div style={{ background: '#fff', borderRadius: 16, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {REWARD_EMOJI_OPTIONS.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => setNewRewardEmoji(emoji)}
                              className="tile"
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: '50%',
                                fontSize: 17,
                                background: newRewardEmoji === emoji ? '#FFF0EC' : '#F7F5F0',
                                border: `2px solid ${newRewardEmoji === emoji ? palette.swatch : 'transparent'}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            value={newRewardLabel}
                            onChange={(e) => setNewRewardLabel(e.target.value)}
                            placeholder="Reward name (e.g. Ice cream)"
                            maxLength={24}
                            style={{
                              flex: 1,
                              background: '#F7F5F0',
                              borderRadius: 12,
                              padding: '10px 14px',
                              fontFamily: "'Nunito', sans-serif",
                              fontWeight: 700,
                              fontSize: 13,
                              color: '#3E3B34',
                              border: 'none',
                              outline: 'none',
                            }}
                          />
                          <button
                            onClick={handleAddReward}
                            disabled={!newRewardLabel.trim()}
                            className="tile"
                            style={{
                              borderRadius: 12,
                              padding: '10px 18px',
                              background: newRewardLabel.trim() ? palette.accent : '#D8D3C4',
                              fontFamily: "'Baloo 2', sans-serif",
                              fontWeight: 800,
                              fontSize: 13,
                              color: '#fff',
                              flexShrink: 0,
                            }}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 600, fontSize: 12, color: '#8C8474' }}>
                        Max {MAX_REWARDS} rewards — remove one to add another.
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {section === 'profile' && kid && draft && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={sectionLabel}>{kid.name}'s profile</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={fieldLabel}>Name</span>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <input
                      value={draft.name}
                      onChange={(e) => patch({ name: e.target.value })}
                      maxLength={20}
                      aria-label="Child's name"
                      style={{
                        flex: 1,
                        minWidth: 180,
                        background: '#fff',
                        border: '1px solid #E5E1D6',
                        borderRadius: 12,
                        padding: '11px 14px',
                        fontFamily: "'Nunito', sans-serif",
                        fontWeight: 700,
                        fontSize: 14,
                        color: '#3E3B34',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={fieldLabel}>Buddy</span>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {avatarOptions.map((a) => {
                      const isSelected = draft.avatarIcon === a.icon && draft.avatarColor === a.color;
                      return (
                        <button
                          key={a.icon}
                          onClick={() => patch({ avatarIcon: a.icon, avatarColor: a.color })}
                          aria-label={a.icon}
                          className="tile"
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            background: a.color,
                            border: isSelected ? '3px solid #fff' : '3px solid transparent',
                            outline: isSelected ? '2px solid #2EC4B6' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <i className={a.icon} style={{ fontSize: 20, color: '#fff' }} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={fieldLabel}>Children</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {kids.map((k) => (
                      <div
                        key={k.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          background: '#fff',
                          borderRadius: 14,
                          padding: '10px 14px',
                        }}
                      >
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            background: k.avatarColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <i className={k.avatarIcon} style={{ fontSize: 14, color: '#fff' }} />
                        </div>
                        <span style={{ flex: 1, fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 13, color: '#3E3B34' }}>
                          {k.name}
                          {k.id === kid.id && (
                            <span style={{ marginLeft: 8, fontWeight: 800, fontSize: 11, color: '#2EC4B6' }}>Editing</span>
                          )}
                        </span>
                        {kids.length > 1 && (
                          <button
                            onClick={() =>
                              setPending({
                                kind: 'removeKid',
                                kidId: k.id,
                                name: k.name,
                                avatarIcon: k.avatarIcon,
                                avatarColor: k.avatarColor,
                              })
                            }
                            aria-label={`Remove ${k.name}`}
                            style={{ color: '#D64545', padding: 6 }}
                          >
                            <i className="fa-solid fa-trash" style={{ fontSize: 13 }} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => navigate('/create-profile', { state: { returnTo: '/dashboard' } })}
                    style={{
                      alignSelf: 'flex-start',
                      borderRadius: 12,
                      padding: '10px 18px',
                      background: '#fff',
                      border: '1px solid #E5E1D6',
                      fontFamily: "'Nunito', sans-serif",
                      fontWeight: 800,
                      fontSize: 13,
                      color: '#2EC4B6',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <i className="fa-solid fa-plus" style={{ fontSize: 12 }} />
                    Add a child
                  </button>
                </div>
              </div>
            )}

            {section === 'danger' && kid && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ ...sectionLabel, color: '#D64545' }}>Danger zone · {kid.name}</div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button
                    onClick={handleResetToday}
                    className="tile"
                    style={{
                      flex: '1 1 160px',
                      padding: '12px 18px',
                      borderRadius: 14,
                      background: '#fff',
                      border: '2px solid #DDD8C8',
                      fontFamily: "'Nunito', sans-serif",
                      fontWeight: 800,
                      fontSize: 13,
                      color: '#5B4A1E',
                    }}
                  >
                    <i className="fa-solid fa-arrow-rotate-left" style={{ marginRight: 8 }} />
                    Reset {kid.name}'s today
                  </button>
                  <button
                    onClick={() => setPending({ kind: 'resetAll' })}
                    className="tile"
                    style={{
                      flex: '1 1 160px',
                      padding: '12px 18px',
                      borderRadius: 14,
                      background: '#FDECEC',
                      border: '2px solid #D64545',
                      fontFamily: "'Nunito', sans-serif",
                      fontWeight: 800,
                      fontSize: 13,
                      color: '#D64545',
                    }}
                  >
                    <i className="fa-solid fa-trash" style={{ marginRight: 8 }} />
                    Reset all of {kid.name}'s progress
                  </button>
                </div>
              </div>
            )}

            {section === 'device' && draft && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={sectionLabel}>App theme</div>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 600, fontSize: 12, color: '#8F887A' }}>
                    Applies to every kid profile on this device.
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {THEME_ORDER.map((name) => {
                      const p = themes[name];
                      const isSelected = name === draft.theme;
                      return (
                        <button
                          key={name}
                          onClick={() => patch({ theme: name })}
                          className="tile"
                          style={{
                            flex: '1 1 150px',
                            borderRadius: 16,
                            padding: '12px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            background: isSelected ? '#FFF0EC' : '#F7F5F0',
                            border: `2px solid ${isSelected ? p.swatch : '#DDD8C8'}`,
                          }}
                        >
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: p.swatch, flexShrink: 0 }} />
                          <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 13, color: '#3E3B34' }}>{p.label}</span>
                          <i
                            className={isSelected ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'}
                            style={{ marginLeft: 'auto', color: '#3E3B34' }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={sectionLabel}>Sound</div>
                  {(
                    [
                      {
                        key: 'tap' as const,
                        label: 'Tap sounds',
                        hint: 'The click on every button.',
                        value: draft.tapSoundsEnabled,
                        set: (v: boolean) => patch({ tapSoundsEnabled: v }),
                      },
                      {
                        key: 'game' as const,
                        label: 'Game sounds',
                        hint: 'Answer, reward and celebration sounds.',
                        value: draft.gameSoundsEnabled,
                        set: (v: boolean) => patch({ gameSoundsEnabled: v }),
                      },
                    ]
                  ).map((row) => (
                    <div
                      key={row.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#fff',
                        borderRadius: 16,
                        padding: '14px 18px',
                        gap: 16,
                      }}
                    >
                      <div>
                        <div style={fieldLabel}>{row.label}</div>
                        <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 600, fontSize: 12, color: '#A9A294', marginTop: 2 }}>
                          {row.hint}
                        </div>
                      </div>
                      <button
                        onClick={() => row.set(!row.value)}
                        aria-label={`Toggle ${row.label.toLowerCase()}`}
                        style={{
                          width: 52,
                          height: 30,
                          borderRadius: 999,
                          background: row.value ? '#3DDC97' : '#D8D3C4',
                          position: 'relative',
                          transition: 'background 0.2s',
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: '#fff',
                            position: 'absolute',
                            top: 3,
                            left: row.value ? 25 : 3,
                            transition: 'left 0.2s',
                          }}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={sectionLabel}>Grown-up gate</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: 16, padding: '14px 18px' }}>
                    <span style={fieldLabel}>Require a math question to enter Settings</span>
                    <button
                      onClick={() => patch({ gateEnabled: !draft.gateEnabled })}
                      aria-label="Toggle grown-up gate"
                      style={{
                        width: 52,
                        height: 30,
                        borderRadius: 999,
                        background: draft.gateEnabled ? '#3DDC97' : '#D8D3C4',
                        position: 'relative',
                        transition: 'background 0.2s',
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: '#fff',
                          position: 'absolute',
                          top: 3,
                          left: draft.gateEnabled ? 25 : 3,
                          transition: 'left 0.2s',
                        }}
                      />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={sectionLabel}>Install app</div>
                  <div
                    style={{
                      background: '#fff',
                      borderRadius: 16,
                      padding: '14px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    {installed ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <i className="fa-solid fa-circle-check" style={{ color: '#3DDC97' }} />
                        <span style={fieldLabel}>Installed — works offline from your home screen.</span>
                      </div>
                    ) : (
                      <>
                        <span style={fieldLabel}>Add Explorer Kids to your device for offline play.</span>
                        {showIosSteps || (isIosDevice() && !canInstall) ? (
                          <div
                            style={{
                              fontFamily: "'Nunito', sans-serif",
                              fontWeight: 600,
                              fontSize: 13,
                              color: '#8F887A',
                              lineHeight: 1.45,
                            }}
                          >
                            Tap <i className="fa-solid fa-arrow-up-from-bracket" aria-hidden /> Share in Safari, then choose{' '}
                            <strong style={{ color: '#5B4A1E' }}>Add to Home Screen</strong>.
                          </div>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void handleInstall()}
                          disabled={installing || (!canInstall && !isIosDevice())}
                          className="tile"
                          style={{
                            alignSelf: 'flex-start',
                            padding: '10px 16px',
                            borderRadius: 999,
                            background: canInstall || isIosDevice() ? '#FF6F61' : '#D8D3C4',
                            color: '#fff',
                            fontFamily: "'Nunito', sans-serif",
                            fontWeight: 800,
                            fontSize: 14,
                            opacity: installing ? 0.7 : 1,
                          }}
                        >
                          <i className="fa-solid fa-download" style={{ marginRight: 8 }} />
                          {installing ? 'Installing…' : isIosDevice() ? 'How to install' : canInstall ? 'Install' : 'Install unavailable'}
                        </button>
                        {!canInstall && !isIosDevice() && !installed ? (
                          <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 600, fontSize: 12, color: '#8F887A' }}>
                            Open this site in Chrome or Edge on a phone/desktop to install. Or use the browser’s Install / Add to Home Screen menu.
                          </span>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={sectionLabel}>About</div>
                  <div style={{ background: '#fff', borderRadius: 16, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 600, fontSize: 11, color: '#A9A294' }}>Version</div>
                        <div style={fieldLabel}>{__APP_VERSION__}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 600, fontSize: 11, color: '#A9A294' }}>Build</div>
                        <div style={fieldLabel}>{formatBuildTime(__BUILD_TIME__)}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={handleCheckForUpdate}
                        disabled={updateState === 'checking'}
                        className="tile"
                        style={{
                          padding: '10px 16px',
                          borderRadius: 999,
                          background: '#fff',
                          border: '1px solid #E5E1D6',
                          fontFamily: "'Nunito', sans-serif",
                          fontWeight: 800,
                          fontSize: 13,
                          color: '#5B4A1E',
                        }}
                      >
                        <i className="fa-solid fa-rotate" style={{ marginRight: 8 }} />
                        {updateState === 'checking' ? 'Checking…' : 'Check for updates'}
                      </button>
                      {updateState === 'found' && (
                        <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 12, color: '#2EC4B6' }}>
                          Update ready — reload to apply.
                        </span>
                      )}
                      {updateState === 'current' && (
                        <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 12, color: '#8F887A' }}>
                          You're on the latest version.
                        </span>
                      )}
                      {updateState === 'unsupported' && (
                        <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 12, color: '#8F887A' }}>
                          Updates apply automatically here.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ ...sectionLabel, color: '#D64545' }}>Reset this device</div>
                  <div style={{ background: '#fff', borderRadius: 16, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 600, fontSize: 13, color: '#8F887A', lineHeight: 1.45 }}>
                      Deletes every child profile, all settings, timetables and progress on this device.
                      Nothing is stored anywhere else, so this can't be undone.
                    </span>
                    <button
                      type="button"
                      onClick={() => setPending({ kind: 'resetApp' })}
                      className="tile"
                      style={{
                        alignSelf: 'flex-start',
                        padding: '10px 18px',
                        borderRadius: 14,
                        background: '#FDECEC',
                        border: '2px solid #D64545',
                        fontFamily: "'Nunito', sans-serif",
                        fontWeight: 800,
                        fontSize: 13,
                        color: '#D64545',
                      }}
                    >
                      <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 8 }} />
                      Erase everything and start over
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Leaves room for the sticky bar so it never covers the last control. */}
        {isDirty && <div style={{ height: 92 }} />}
      </div>

      {isDirty && (
        <div
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 90,
            background: '#fff',
            borderTop: '1px solid #E5E1D6',
            boxShadow: '0 -8px 24px rgba(0,0,0,0.08)',
            padding: '14px 20px',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 960,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                flex: 1,
                minWidth: 160,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 800,
                fontSize: 13,
                color: '#5B4A1E',
              }}
            >
              <i className="fa-solid fa-circle-exclamation" style={{ color: '#E0A93B' }} />
              Unsaved changes
            </span>
            <button
              onClick={handleDiscard}
              className="tile"
              style={{
                padding: '11px 20px',
                borderRadius: 12,
                background: '#fff',
                border: '1px solid #E5E1D6',
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 800,
                fontSize: 13,
                color: '#5B4A1E',
              }}
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              className="tile"
              style={{
                padding: '11px 28px',
                borderRadius: 12,
                background: '#2EC4B6',
                fontFamily: "'Baloo 2', sans-serif",
                fontWeight: 800,
                fontSize: 15,
                color: '#fff',
              }}
            >
              Save changes
            </button>
          </div>
        </div>
      )}

      {pending && (
        <ConfirmDialog
          destructive={pending.kind !== 'switchKid' && pending.kind !== 'exit'}
          avatar={
            pending.kind === 'removeKid'
              ? { icon: pending.avatarIcon, color: pending.avatarColor, name: pending.name }
              : undefined
          }
          title={
            pending.kind === 'resetAll'
              ? `Clear ${kid?.name}'s progress?`
              : pending.kind === 'removeKid'
                ? `Remove ${pending.name}?`
                : pending.kind === 'resetApp'
                  ? 'Erase everything?'
                  : pending.kind === 'switchKid'
                    ? `Switch to ${pending.name}?`
                    : 'Leave without saving?'
          }
          body={
            pending.kind === 'resetAll'
              ? `Every star and completed activity for ${kid?.name} will be deleted. Settings and the timetable are kept.`
              : pending.kind === 'removeKid'
                ? `${pending.name}'s profile, settings, timetable and all progress will be deleted. This can't be undone.`
                : pending.kind === 'resetApp'
                  ? `This deletes ${kids.length === 1 ? '1 profile' : `all ${kids.length} profiles`}, every setting, timetable and all progress on this device. Nothing is stored anywhere else, so it can't be undone.`
                  : 'You have unsaved changes. They will be lost.'
          }
          confirmLabel={
            pending.kind === 'resetAll'
              ? 'Clear progress'
              : pending.kind === 'removeKid'
                ? `Remove ${pending.name}`
                : pending.kind === 'resetApp'
                  ? 'Erase everything'
                  : pending.kind === 'switchKid'
                    ? 'Discard and switch'
                    : 'Discard and leave'
          }
          cancelLabel={pending.kind === 'switchKid' || pending.kind === 'exit' ? 'Keep editing' : 'Cancel'}
          onConfirm={runPendingAction}
          onCancel={() => setPending(null)}
        />
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
