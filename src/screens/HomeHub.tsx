import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { themes } from '../theme';
import { subjects, topicsBySubject } from '../data/subjects';
import FloatingShapes from '../components/FloatingShapes';

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
  const { theme, kids, activeKidId, gateEnabled, progress } = useApp();
  const palette = themes[theme];
  const navigate = useNavigate();

  const kid = kids.find((k) => k.id === activeKidId);

  useEffect(() => {
    if (!kid) navigate('/who', { replace: true });
  }, [kid, navigate]);

  if (!kid) return null;

  const kidProgress = progress[kid.id] ?? {};

  const handleLock = () => {
    if (gateEnabled) {
      navigate('/gate', { state: { next: '/dashboard' } });
    } else {
      navigate('/dashboard');
    }
  };

  const handlePlay = () => {
    const leastDone = [...subjects].sort((a, b) => (kidProgress[a.id] ?? 0) - (kidProgress[b.id] ?? 0))[0];
    const firstTopic = topicsBySubject[leastDone.id]?.[0];
    if (firstTopic) navigate(`/subject/${leastDone.id}/topic/${firstTopic.id}`);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
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
        <button
          onClick={handleLock}
          className="navBtn"
          aria-label="Parent settings"
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <i className="fa-solid fa-lock" style={{ fontSize: 16, color: palette.headerText }} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 28px 16px', position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate('/who')}
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
            Ready for today's adventure?
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
              onClick={handlePlay}
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

      <div style={{ padding: '0 28px 8px', position: 'relative', zIndex: 1 }}>
        <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: 15, color: palette.textMuted }}>
          Or explore on your own
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 16,
          padding: '0 28px 32px',
          alignContent: 'start',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {subjects.map((s, i) => (
          <button
            key={s.id}
            onClick={() => navigate(`/subject/${s.id}`)}
            className="tile"
            style={{
              position: 'relative',
              background: palette.tileColors[i % palette.tileColors.length],
              borderRadius: 22,
              padding: 0,
              height: 184,
              border: '4px solid #fff',
              overflow: 'hidden',
              textAlign: 'left',
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
                padding: '20px 12px 10px',
                background: 'linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0))',
              }}
            >
              <div
                style={{
                  fontFamily: "'Baloo 2', sans-serif",
                  fontWeight: 800,
                  fontSize: 16,
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
