import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { themes } from '../theme';
import { subjectEntryPath, visibleSubjects, visibleTopics } from '../data/subjects';
import FloatingShapes from '../components/FloatingShapes';
import RewardModal from '../components/RewardModal';
import { playTap } from '../utils/sound';
import { activityKey, subjectActivitiesCompletedToday } from '../utils/progress';
import {
  currentPlanItemId,
  formatSlot,
  freePlayAllowed,
  isPlanItemDone,
  isPlanItemValid,
  nextAppItem,
  planForToday,
  planItemIcon,
  planItemLabel,
  planItemPath,
  planProgress,
} from '../utils/plan';

function speak(text: string) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.pitch = 1.2;
    utter.rate = 0.95;
    window.speechSynthesis.speak(utter);
  }
}

export default function HomeHub() {
  const { theme, kids, activeKidId, gateEnabled, getKidSettings, getTodayRecord, toggleOfflinePlanItem } =
    useApp();
  const palette = themes[theme];
  const navigate = useNavigate();

  const kid = kids.find((k) => k.id === activeKidId);

  useEffect(() => {
    if (!kid) navigate('/who', { replace: true });
  }, [kid, navigate]);

  if (!kid) return null;

  const settings = getKidSettings(kid.id);
  const todayRecord = getTodayRecord(kid.id);

  const handleLock = () => {
    if (gateEnabled) {
      navigate('/gate', { state: { next: '/dashboard' } });
    } else {
      navigate('/dashboard');
    }
  };

  // Entries are dropped if their activity has since left the catalogue.
  const todayPlan = planForToday(settings).filter(isPlanItemValid);
  const progress = planProgress(todayPlan, todayRecord);
  const currentItemId = currentPlanItemId(todayPlan, todayRecord);
  const canFreePlay = freePlayAllowed(settings, todayRecord);

  /**
   * With a plan, Play opens the next unfinished in-app item. Without one it
   * falls back to the least-practised subject and the first activity there
   * that hasn't been finished today.
   */
  const handlePlay = () => {
    const planned = nextAppItem(todayPlan, todayRecord);
    const plannedPath = planned && planItemPath(planned);
    if (plannedPath) {
      navigate(plannedPath);
      return;
    }

    const leastDone = [...visibleSubjects()].sort(
      (a, b) =>
        subjectActivitiesCompletedToday(a.id, todayRecord) - subjectActivitiesCompletedToday(b.id, todayRecord),
    )[0];
    if (!leastDone) return;

    for (const topic of visibleTopics(leastDone)) {
      const next =
        topic.activities.find(
          (a) => !todayRecord.topics[activityKey(leastDone.id, topic.id, a.id)]?.completed,
        ) ?? topic.activities[0];
      if (next) {
        navigate(`/subject/${leastDone.id}/topic/${topic.id}/activity/${next.id}`);
        return;
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      {todayRecord.rewardPending && <RewardModal kid={kid} settings={settings} />}
      <FloatingShapes theme={theme} />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '22px 28px',
          background: palette.headerBg,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontFamily: "'Baloo 2', sans-serif",
            fontWeight: 800,
            fontSize: 24,
            color: palette.headerText,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <i className="fa-solid fa-star" style={{ color: palette.starColor }} />
          Hey {kid.name}!
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {settings.rewardsEnabled && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255,255,255,0.25)',
                borderRadius: 999,
                padding: '8px 16px',
                animation: todayRecord.rewardPending ? 'pulseSoft 1.4s ease-in-out infinite' : undefined,
              }}
            >
              <i className="fa-solid fa-star" style={{ color: palette.starColor }} />
              <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 15, color: palette.headerText }}>
                {Math.min(todayRecord.starsToday, settings.dailyStarTarget)} / {settings.dailyStarTarget}
              </span>
              {todayRecord.rewardPending && (
                <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 11, color: palette.headerText }}>
                  Reward unlocked!
                </span>
              )}
            </div>
          )}
          {/* Labelled, and a gear rather than a padlock — the padlock now means
              "plan only" further down the screen. */}
          <button
            onClick={handleLock}
            className="navBtn"
            aria-label="Parent settings"
            style={{
              height: 44,
              borderRadius: 999,
              background: 'rgba(255,255,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '0 18px',
            }}
          >
            <i className="fa-solid fa-gear" style={{ fontSize: 16, color: palette.headerText }} />
            <span
              style={{
                fontFamily: "'Baloo 2', sans-serif",
                fontWeight: 800,
                fontSize: 15,
                color: palette.headerText,
              }}
            >
              Parents
            </span>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 28px 16px', position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>
        <button
          onClick={() => {
            playTap();
            navigate('/who');
          }}
          aria-label="Switch profile"
          title="Switch profile"
          className="tile"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            flexShrink: 0,
          }}
        >
          <div style={{ position: 'relative', width: 96, height: 96 }}>
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                overflow: 'hidden',
                background: kid.avatarColor,
                border: '4px solid #fff',
                boxShadow: '0 8px 18px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <i className={kid.avatarIcon} style={{ fontSize: 44, color: '#fff' }} />
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: palette.accent,
                border: '3px solid #fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              }}
            >
              <i className="fa-solid fa-people-arrows" style={{ fontSize: 13, color: '#fff' }} />
            </div>
          </div>
          <span
            style={{
              fontFamily: "'Baloo 2', sans-serif",
              fontWeight: 700,
              fontSize: 12,
              color: palette.textMuted,
              background: palette.chipBg,
              padding: '2px 10px',
              borderRadius: 999,
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
            }}
          >
            Switch
          </span>
        </button>
        <div
          style={{
            flex: 1,
            minWidth: 220,
            background: palette.chipBg,
            borderRadius: 22,
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: 18, color: palette.textDark }}>
            {todayPlan.length > 0
              ? progress.allDone
                ? "Today's plan is all done!"
                : `Today's plan · ${progress.done} of ${progress.total}`
              : "Ready for today's adventure?"}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <button
              onClick={() => speak(`Hi ${kid.name}! Ready for today's adventure?`)}
              aria-label="Read aloud"
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <i className="fa-solid fa-volume-high" style={{ fontSize: 20, color: palette.accent }} />
            </button>
            <button
              onClick={() => {
                playTap();
                handlePlay();
              }}
              className="tile"
              style={{
                background: '#3DDC97',
                borderRadius: 999,
                padding: '14px 30px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: '0 8px 18px rgba(61,220,151,0.4)',
              }}
            >
              <i className="fa-solid fa-play" style={{ fontSize: 18, color: '#fff' }} />
              <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 17, color: '#fff' }}>Play</span>
            </button>
          </div>
        </div>
      </div>

      {todayPlan.length > 0 && (
        <div style={{ padding: '0 28px 24px', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 620, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 10, background: palette.chipBg, borderRadius: 999, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.round((progress.done / progress.total) * 100)}%`,
                  height: '100%',
                  background: progress.allDone ? '#3DDC97' : palette.accent,
                  borderRadius: 999,
                  transition: 'width 0.4s',
                }}
              />
            </div>
            <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 14, color: palette.textMuted, flexShrink: 0 }}>
              {progress.done} of {progress.total}
            </span>
          </div>
          <div style={{ maxWidth: 620 }}>
            {todayPlan.map((item, i) => {
              const done = isPlanItemDone(item, todayRecord);
              const path = planItemPath(item);
              const isNow = item.id === currentItemId;
              const isLast = i === todayPlan.length - 1;
              const timeLabel = formatSlot(item);
              const act = () => {
                playTap();
                if (item.kind === 'offline') toggleOfflinePlanItem(kid.id, item.id);
                else if (path) navigate(path);
              };

              return (
                <div key={item.id} style={{ display: 'flex', alignItems: 'stretch', gap: 14 }}>
                  {/* Journey rail: done behind you, now beside you, next ahead. */}
                  <div style={{ width: 28, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        marginTop: isNow ? 22 : 14,
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: done ? '#3DDC97' : isNow ? palette.accent : palette.chipBg,
                        border: !done && !isNow ? `2px solid ${palette.chipBg}` : 'none',
                      }}
                    >
                      {done && <i className="fa-solid fa-check" style={{ fontSize: 13, color: '#fff' }} />}
                      {!done && isNow && <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#fff' }} />}
                    </div>
                    {!isLast && <div style={{ flex: 1, width: 3, background: palette.chipBg, borderRadius: 999 }} />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0, paddingBottom: 12 }}>
                    {isNow ? (
                      // The one thing to do right now gets its own card and button.
                      <div
                        style={{
                          background: '#fff',
                          borderRadius: 22,
                          padding: '18px 20px',
                          boxShadow: `0 0 0 3px ${palette.accent}44, 0 10px 24px rgba(0,0,0,0.08)`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 14,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontFamily: "'Nunito', sans-serif",
                              fontWeight: 800,
                              fontSize: 10,
                              letterSpacing: 0.6,
                              textTransform: 'uppercase',
                              color: '#fff',
                              background: palette.accent,
                              borderRadius: 999,
                              padding: '4px 12px',
                            }}
                          >
                            Now
                          </span>
                          {timeLabel && (
                            <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 12, color: palette.textMuted }}>
                              {timeLabel}
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div
                            style={{
                              width: 54,
                              height: 54,
                              borderRadius: 18,
                              flexShrink: 0,
                              background: palette.chipBg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <i className={planItemIcon(item)} style={{ fontSize: 24, color: palette.accent }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 'clamp(18px, 4vw, 22px)', color: palette.textDark }}>
                              {planItemLabel(item)}
                            </div>
                            {item.durationMin && (
                              <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 13, color: palette.textMuted }}>
                                {item.durationMin} minutes
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={act}
                          className="tile"
                          style={{
                            alignSelf: 'flex-start',
                            background: item.kind === 'app' ? '#3DDC97' : palette.accent,
                            borderRadius: 999,
                            padding: '13px 30px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            boxShadow: '0 8px 18px rgba(0,0,0,0.12)',
                          }}
                        >
                          <i
                            className={item.kind === 'app' ? 'fa-solid fa-play' : 'fa-solid fa-check'}
                            style={{ fontSize: 15, color: '#fff' }}
                          />
                          <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 16, color: '#fff' }}>
                            {item.kind === 'app' ? 'Start' : 'I did it!'}
                          </span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={act}
                        className="tile"
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          background: 'transparent',
                          padding: '12px 4px',
                          textAlign: 'left',
                          opacity: done ? 0.5 : 0.85,
                        }}
                      >
                        {timeLabel && (
                          <span
                            style={{
                              width: 116,
                              flexShrink: 0,
                              fontFamily: "'Nunito', sans-serif",
                              fontWeight: 800,
                              fontSize: 12,
                              color: palette.textMuted,
                            }}
                          >
                            {timeLabel}
                          </span>
                        )}
                        <i className={planItemIcon(item)} style={{ fontSize: 17, color: palette.accent, width: 22, flexShrink: 0 }} />
                        <span
                          style={{
                            flex: 1,
                            minWidth: 0,
                            fontFamily: "'Baloo 2', sans-serif",
                            fontWeight: 700,
                            fontSize: 17,
                            color: palette.textDark,
                            textDecoration: done ? 'line-through' : 'none',
                          }}
                        >
                          {planItemLabel(item)}
                        </span>
                        {item.kind === 'offline' && !done && (
                          <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 11, color: palette.textMuted, flexShrink: 0 }}>
                            Tap when done
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!canFreePlay && (
        <div style={{ padding: '4px 28px 32px', position: 'relative', zIndex: 1 }}>
          <div
            style={{
              maxWidth: 560,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: palette.chipBg,
              borderRadius: 18,
              padding: '16px 20px',
            }}
          >
            <i className="fa-solid fa-lock" style={{ fontSize: 18, color: palette.textMuted }} />
            <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: 16, color: palette.textDark }}>
              {settings.freePlayAfterPlan
                ? 'Finish your plan to explore on your own!'
                : "Today is plan time — let's do what's on the list!"}
            </span>
          </div>
        </div>
      )}

      {canFreePlay && (
        <div style={{ padding: '0 28px 8px', position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: 15, color: palette.textMuted }}>
            Or explore on your own
          </div>
        </div>
      )}

      <div
        style={{
          flex: 1,
          display: canFreePlay ? 'grid' : 'none',
          // Capped so a single subject doesn't stretch edge to edge.
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 340px))',
          justifyContent: 'start',
          gap: 20,
          padding: '0 28px 32px',
          alignContent: 'start',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {visibleSubjects().map((s, i) => (
          <button
            key={s.id}
            onClick={() => {
              playTap();
              navigate(subjectEntryPath(s));
            }}
            className="tile"
            style={{
              position: 'relative',
              background: palette.tileColors[i % palette.tileColors.length],
              borderRadius: 26,
              padding: 0,
              height: 260,
              border: '4px solid #fff',
              overflow: 'hidden',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            {s.image ? (
              <img
                src={s.image}
                alt={s.label}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
              />
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i
                  className={s.icon}
                  style={{ fontSize: 68, color: theme === 'adventure' ? palette.tileColors[i % palette.tileColors.length] : 'rgba(255,255,255,0.9)' }}
                />
              </div>
            )}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                padding: '24px 16px 14px',
                background: 'linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0))',
              }}
            >
              <div
                style={{
                  fontFamily: "'Baloo 2', sans-serif",
                  fontWeight: 800,
                  fontSize: 20,
                  lineHeight: 1.15,
                  color: '#fff',
                  textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                }}
              >
                {s.label}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
