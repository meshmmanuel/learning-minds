import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { themes } from '../theme';
import FloatingShapes from '../components/FloatingShapes';

export default function WhoIsPlaying() {
  const { theme, kids, setActiveKid } = useApp();
  const palette = themes[theme];
  const navigate = useNavigate();

  const choose = (id: string) => {
    setActiveKid(id);
    navigate('/home', { replace: true });
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
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 44,
        }}
      >
        <div
          style={{
            fontFamily: "'Baloo 2', sans-serif",
            fontWeight: 800,
            fontSize: 'clamp(30px, 6vw, 44px)',
            color: palette.accent,
            textAlign: 'center',
          }}
        >
          Who's playing today?
        </div>
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-end', flexWrap: 'wrap', justifyContent: 'center' }}>
          {kids.map((kid) => (
            <button
              key={kid.id}
              onClick={() => choose(kid.id)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
            >
              <div
                className="tile"
                style={{
                  width: 130,
                  height: 130,
                  borderRadius: '50%',
                  background: kid.avatarColor,
                  border: '6px solid #fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
                }}
              >
                <i className={kid.avatarIcon} style={{ fontSize: 52, color: '#fff' }} />
              </div>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 20, color: palette.textDark }}>
                {kid.name}
              </div>
            </button>
          ))}
          <button
            onClick={() => navigate('/gate', { state: { next: '/create-profile' } })}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
          >
            <div
              className="tile"
              style={{
                width: 130,
                height: 130,
                borderRadius: '50%',
                border: `6px dashed ${palette.dashed}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: palette.chipBg,
              }}
            >
              <i className="fa-solid fa-plus" style={{ fontSize: 38, color: palette.dashed }} />
            </div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 18, color: palette.textMuted }}>
              Add Kid
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
