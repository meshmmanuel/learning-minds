import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { themes } from '../theme';
import { subjects, topicsBySubject } from '../data/subjects';
import { subjectTodayPercent } from '../utils/progress';

export default function SubjectTopics() {
  const { subjectId } = useParams();
  const { theme, activeKidId, getTodayRecord } = useApp();
  const palette = themes[theme];
  const navigate = useNavigate();

  const subjectIndex = subjects.findIndex((s) => s.id === subjectId);
  const subject = subjects[subjectIndex];
  const topics = subjectId ? topicsBySubject[subjectId] ?? [] : [];
  const color = palette.tileColors[subjectIndex % palette.tileColors.length];
  const todayRecord = activeKidId ? getTodayRecord(activeKidId) : null;
  const pct = subjectId && todayRecord ? subjectTodayPercent(subjectId, todayRecord) : 0;

  useEffect(() => {
    if (!subject) navigate('/home', { replace: true });
  }, [subject, navigate]);

  if (!subject) return null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '22px 28px', flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate('/home')}
          className="navBtn"
          aria-label="Home"
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
          <i className="fa-solid fa-house" style={{ fontSize: 22, color: palette.accent }} />
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
          <i className={subject.icon} style={{ fontSize: 20, color: '#fff' }} />
        </div>
        <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 24, color: palette.textDark }}>
          {subject.label}
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
        {topics.map((t) => (
          <button
            key={t.id}
            onClick={() => navigate(`/subject/${subject.id}/topic/${t.id}`)}
            className="tile"
            style={{
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
              <i className={t.icon} style={{ fontSize: 21, color: '#fff' }} />
            </div>
            <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 17, color: '#fff' }}>{t.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
