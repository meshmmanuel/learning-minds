import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { themes } from '../theme';
import { subjects } from '../data/subjects';
import type { ThemeName } from '../types';
import {
  canPromptInstall,
  isAppInstalled,
  isIosDevice,
  promptInstall,
  subscribeInstallAvailability,
} from '../pwa/installPrompt';

const THEME_ORDER: ThemeName[] = ['calm', 'playful', 'adventure'];

export default function ParentDashboard() {
  const { theme, setTheme, kids, activeKidId, progress, gateEnabled, setGateEnabled } = useApp();
  const palette = themes[theme];
  const navigate = useNavigate();

  const kid = kids.find((k) => k.id === activeKidId);
  const kidProgress = activeKidId ? progress[activeKidId] ?? {} : {};

  const [installed, setInstalled] = useState(isAppInstalled);
  const [canInstall, setCanInstall] = useState(canPromptInstall);
  const [installing, setInstalling] = useState(false);
  const [showIosSteps, setShowIosSteps] = useState(false);

  useEffect(() => {
    return subscribeInstallAvailability(() => {
      setInstalled(isAppInstalled());
      setCanInstall(canPromptInstall());
    });
  }, []);

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

  return (
    <div style={{ minHeight: '100vh', background: '#F7F5F0', display: 'flex', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 640, display: 'flex', flexDirection: 'column' }}>
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
            onClick={() => navigate('/home')}
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

        <div style={{ padding: '22px 8px', display: 'flex', flexDirection: 'column', gap: 10, borderBottom: '1px solid #E5E1D6' }}>
          <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: 15, color: '#2E2B26' }}>App theme</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {THEME_ORDER.map((name) => {
              const p = themes[name];
              const isSelected = name === theme;
              return (
                <button
                  key={name}
                  onClick={() => setTheme(name)}
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

        <div style={{ padding: '20px 8px', display: 'flex', flexDirection: 'column', gap: 14, borderBottom: '1px solid #E5E1D6' }}>
          <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: 15, color: '#2E2B26' }}>
            {kid ? `${kid.name}'s progress` : 'Progress'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {subjects.map((s, i) => {
              const pct = kidProgress[s.id] ?? 0;
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

        <div style={{ padding: '20px 8px', display: 'flex', flexDirection: 'column', gap: 12, borderBottom: '1px solid #E5E1D6' }}>
          <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: 15, color: '#2E2B26' }}>Install app</div>
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
                <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 13, color: '#5B4A1E' }}>
                  Installed — works offline from your home screen.
                </span>
              </div>
            ) : (
              <>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 13, color: '#5B4A1E' }}>
                  Add Explorer Kids to your device for offline play.
                </span>
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

        <div style={{ padding: '20px 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: 15, color: '#2E2B26' }}>Grown-up gate</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: 16, padding: '14px 18px' }}>
            <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 13, color: '#5B4A1E' }}>
              Require a math question to enter Settings
            </span>
            <button
              onClick={() => setGateEnabled(!gateEnabled)}
              aria-label="Toggle grown-up gate"
              style={{
                width: 52,
                height: 30,
                borderRadius: 999,
                background: gateEnabled ? '#3DDC97' : '#D8D3C4',
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
                  left: gateEnabled ? 25 : 3,
                  transition: 'left 0.2s',
                }}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
