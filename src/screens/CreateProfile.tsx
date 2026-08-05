import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { themes } from '../theme';
import { avatarOptions } from '../data/subjects';
import FloatingShapes from '../components/FloatingShapes';
import { playTap } from '../utils/sound';

export default function CreateProfile() {
  const { theme, addKid, kids } = useApp();
  const palette = themes[theme];
  const navigate = useNavigate();
  const location = useLocation();
  const canCancel = kids.length > 0;
  // Set when a parent adds a child from the dashboard, so they land back there.
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? null;

  const [selected, setSelected] = useState(0);
  const [name, setName] = useState('');

  const canGo = name.trim().length > 0;

  const handleGo = () => {
    if (!canGo) return;
    playTap();
    addKid({
      name: name.trim(),
      avatarIcon: avatarOptions[selected].icon,
      avatarColor: avatarOptions[selected].color,
    });
    navigate(returnTo ?? '/home', { replace: true });
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
          maxWidth: 460,
          background: palette.cardBg,
          borderRadius: 28,
          boxShadow: '0 20px 50px rgba(0,0,0,0.18)',
          padding: '44px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 28,
        }}
      >
        {canCancel && (
          <button
            onClick={() => {
              playTap();
              navigate(returnTo ?? '/who');
            }}
            aria-label="Cancel"
            title="Cancel"
            style={{
              position: 'absolute',
              top: 18,
              right: 18,
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: palette.chipBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
            }}
          >
            <i className="fa-solid fa-xmark" style={{ fontSize: 18, color: palette.textMuted }} />
          </button>
        )}
        <div
          style={{
            fontFamily: "'Baloo 2', sans-serif",
            fontWeight: 800,
            fontSize: 28,
            color: palette.accent,
            textAlign: 'center',
          }}
        >
          Pick your explorer buddy!
        </div>
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: avatarOptions[selected].color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '6px solid #fff',
            boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
          }}
        >
          <i className={avatarOptions[selected].icon} style={{ fontSize: 64, color: '#fff' }} />
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
          {avatarOptions.map((a, i) => (
            <button
              key={a.icon}
              onClick={() => {
                playTap();
                setSelected(i);
              }}
              className="tile"
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: a.color,
                border: i === selected ? '4px solid #fff' : '4px solid transparent',
                outline: i === selected ? `2px solid ${palette.accent}` : 'none',
                boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <i className={a.icon} style={{ fontSize: 26, color: '#fff' }} />
            </button>
          ))}
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Type your name"
          maxLength={20}
          style={{
            background: '#fff',
            borderRadius: 20,
            padding: '18px 28px',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 800,
            color: palette.textMuted,
            fontSize: 20,
            width: '100%',
            maxWidth: 360,
            textAlign: 'center',
            border: 'none',
            outline: 'none',
          }}
        />
        <button
          onClick={handleGo}
          disabled={!canGo}
          className="tile"
          style={{
            background: canGo ? palette.accent : '#C7BFA9',
            borderRadius: 999,
            padding: '18px 48px',
            fontFamily: "'Baloo 2', sans-serif",
            fontWeight: 800,
            color: '#fff',
            fontSize: 22,
            boxShadow: canGo ? `0 10px 24px ${palette.accent}66` : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            opacity: canGo ? 1 : 0.7,
          }}
        >
          Let's Go! <i className="fa-solid fa-rocket" />
        </button>
      </div>
    </div>
  );
}
