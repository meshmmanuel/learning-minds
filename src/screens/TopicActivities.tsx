import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { themes } from '../theme';
import { findSubject, findTopic, subjects, topicBackPath } from '../data/subjects';
import { activityKey, topicTodayPercent } from '../utils/progress';
import { freePlayAllowed } from '../utils/plan';
import { playTap } from '../utils/sound';

export default function TopicActivities() {
  const { subjectId, topicId } = useParams();
  const { theme, activeKidId, getTodayRecord, getKidSettings } = useApp();
  const palette = themes[theme];
  const navigate = useNavigate();

  const subjectIndex = subjects.findIndex((s) => s.id === subjectId);
  const subject = findSubject(subjectId);
  const topic = findTopic(subject, topicId);
  const color = palette.tileColors[subjectIndex % palette.tileColors.length];
  const todayRecord = activeKidId ? getTodayRecord(activeKidId) : null;
  const pct = subjectId && topicId && todayRecord ? topicTodayPercent(subjectId, topicId, todayRecord) : 0;

  // Plan-only mode: the kid is sent straight to a planned activity, never here.
  const canFreePlay =
    activeKidId && todayRecord ? freePlayAllowed(getKidSettings(activeKidId), todayRecord) : true;

  useEffect(() => {
    if (!subject || !topic || topic.activities.length === 0 || !canFreePlay) {
      navigate('/home', { replace: true });
    }
  }, [subject, topic, canFreePlay, navigate]);

  if (!subject || !topic || topic.activities.length === 0 || !canFreePlay) return null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '22px 28px', flexWrap: 'wrap' }}>
        <button
          onClick={() => {
            playTap();
            navigate(topicBackPath(subject));
          }}
          className="navBtn"
          aria-label="Back"
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 14px rgba(0,0,0,0.1)',
            flexShrink: 0,
          }}
        >
          <i className="fa-solid fa-arrow-left" style={{ fontSize: 20, color: palette.accent }} />
        </button>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <i className={topic.icon} style={{ fontSize: 20, color: '#fff' }} />
        </div>
        <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 24, color: palette.textDark }}>
          {topic.label}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 120, height: 10, background: palette.chipBg, borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999, transition: 'width 0.4s' }} />
          </div>
          <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 13, color: palette.textMuted }}>{pct}%</span>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 18,
          padding: '0 28px 32px',
          alignContent: 'start',
        }}
      >
        {topic.activities.map((a) => {
          const done = todayRecord?.topics[activityKey(subject.id, topic.id, a.id)]?.completed;
          return (
            <button
              key={a.id}
              onClick={() => {
                playTap();
                navigate(`/subject/${subject.id}/topic/${topic.id}/activity/${a.id}`);
              }}
              className="tile"
              style={{
                position: 'relative',
                background: color,
                borderRadius: 22,
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                height: 140,
                justifyContent: 'space-between',
                border: '4px solid #fff',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <i className={a.icon} style={{ fontSize: 21, color: '#fff' }} />
              </div>
              <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 17, color: '#fff' }}>{a.label}</div>
              {done && (
                <div
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <i className="fa-solid fa-check" style={{ fontSize: 12, color: color }} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
