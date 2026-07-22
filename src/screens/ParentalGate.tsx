import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { themes } from '../theme';
import FloatingShapes from '../components/FloatingShapes';

const OPTION_COLORS = ['#8E7CFF', '#2EC4B6', '#FF6F61'];

export default function ParentalGate() {
  const { theme } = useApp();
  const palette = themes[theme];
  const navigate = useNavigate();
  const location = useLocation();
  const next = (location.state as { next?: string } | null)?.next ?? '/home';

  const [a, b] = useMemo(() => [2 + Math.floor(Math.random() * 6), 2 + Math.floor(Math.random() * 6)], []);
  const correct = a + b;
  const options = useMemo(() => {
    const wrong = new Set<number>();
    while (wrong.size < 2) {
      const delta = Math.floor(Math.random() * 5) + 1;
      const candidate = Math.random() > 0.5 ? correct + delta : Math.max(1, correct - delta);
      if (candidate !== correct) wrong.add(candidate);
    }
    return [correct, ...wrong].sort(() => Math.random() - 0.5);
  }, [correct]);

  const [wrongTap, setWrongTap] = useState(false);

  const handleTap = (value: number) => {
    if (value === correct) {
      navigate(next, { replace: true });
    } else {
      setWrongTap(true);
      setTimeout(() => setWrongTap(false), 500);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <FloatingShapes theme={theme} />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 420,
          background: palette.cardBg,
          borderRadius: 28,
          boxShadow: '0 20px 50px rgba(0,0,0,0.18)',
          padding: '48px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 28,
        }}
      >
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: '50%',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
          }}
        >
          <i className="fa-solid fa-lock" style={{ fontSize: 38, color: palette.accent }} />
        </div>
        <div
          style={{
            fontFamily: "'Baloo 2', sans-serif",
            fontWeight: 800,
            fontSize: 26,
            color: palette.textDark,
            textAlign: 'center',
          }}
        >
          Grown-ups only!
          <br />
          Tap the answer to continue.
        </div>
        <div
          style={{
            fontFamily: "'Baloo 2', sans-serif",
            fontWeight: 800,
            fontSize: 36,
            color: palette.accent,
            animation: wrongTap ? 'wiggle 0.4s ease-in-out' : undefined,
          }}
        >
          What is {a} + {b}?
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {options.map((opt, i) => (
            <button
              key={opt}
              onClick={() => handleTap(opt)}
              className="tile"
              style={{
                width: 92,
                height: 92,
                borderRadius: 20,
                background: OPTION_COLORS[i % OPTION_COLORS.length],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Baloo 2', sans-serif",
                fontWeight: 800,
                fontSize: 34,
                color: '#fff',
                border: '4px solid #fff',
                boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
              }}
            >
              {opt}
            </button>
          ))}
        </div>
        {wrongTap && (
          <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: palette.textMuted }}>
            Try again!
          </div>
        )}
      </div>
    </div>
  );
}
