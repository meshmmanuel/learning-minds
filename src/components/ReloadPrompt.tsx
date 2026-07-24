import { useEffect, useState, type CSSProperties } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import {
  canPromptInstall,
  isAppInstalled,
  isIosDevice,
  promptInstall,
  subscribeInstallAvailability,
} from '../pwa/installPrompt';

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // hourly
const DISMISS_KEY = 'kids-app-v2-install-dismissed';

const bannerStyle: CSSProperties = {
  position: 'fixed',
  zIndex: 9999,
  left: 16,
  right: 16,
  bottom: 20,
  maxWidth: 420,
  margin: '0 auto',
  padding: '14px 16px',
  borderRadius: 16,
  background: '#1F2937',
  color: '#fff',
  boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
  fontFamily: "'Nunito', sans-serif",
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const primaryBtn: CSSProperties = {
  padding: '8px 14px',
  borderRadius: 999,
  background: '#FF6F61',
  color: '#fff',
  fontWeight: 800,
  fontSize: 14,
};

const secondaryBtn: CSSProperties = {
  padding: '8px 14px',
  borderRadius: 999,
  background: 'rgba(255,255,255,0.12)',
  color: '#fff',
  fontWeight: 700,
  fontSize: 14,
};

export default function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      setInterval(() => {
        void registration.update();
      }, CHECK_INTERVAL_MS);
    },
  });

  const [canInstall, setCanInstall] = useState(canPromptInstall);
  const [showIosHint, setShowIosHint] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1');

  useEffect(() => {
    return subscribeInstallAvailability(() => setCanInstall(canPromptInstall()));
  }, []);

  useEffect(() => {
    if (isAppInstalled()) return;
    if (!dismissed && isIosDevice()) {
      setShowIosHint(true);
    }
  }, [dismissed]);

  const dismissInstall = () => {
    setShowIosHint(false);
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, '1');
  };

  const handleInstall = async () => {
    setInstalling(true);
    try {
      await promptInstall();
    } finally {
      setInstalling(false);
    }
  };

  if (needRefresh) {
    return (
      <div role="alert" style={bannerStyle}>
        <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.35 }}>
          A new version of Explorer Kids is ready.
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => void updateServiceWorker(true)} style={primaryBtn}>
            Update
          </button>
          <button type="button" onClick={() => setNeedRefresh(false)} style={secondaryBtn}>
            Later
          </button>
        </div>
      </div>
    );
  }

  // Banner only when not dismissed — Settings always has Install.
  if (canInstall && !dismissed) {
    return (
      <div role="alert" style={bannerStyle}>
        <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.35 }}>
          Install Explorer Kids for offline play from your home screen.
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => void handleInstall()} style={primaryBtn} disabled={installing}>
            {installing ? 'Installing…' : 'Install'}
          </button>
          <button type="button" onClick={dismissInstall} style={secondaryBtn}>
            Not now
          </button>
        </div>
      </div>
    );
  }

  if (showIosHint) {
    return (
      <div role="alert" style={bannerStyle}>
        <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.35 }}>
          Install on iPhone/iPad: tap{' '}
          <i className="fa-solid fa-arrow-up-from-bracket" aria-hidden /> Share, then{' '}
          <strong>Add to Home Screen</strong>.
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={dismissInstall} style={secondaryBtn}>
            Got it
          </button>
        </div>
      </div>
    );
  }

  return null;
}
