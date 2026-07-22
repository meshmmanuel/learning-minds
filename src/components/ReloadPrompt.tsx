import { useEffect, useState, type CSSProperties } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // hourly
const DISMISS_KEY = 'kids-app-v2-install-dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

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
    // Offline caching still runs — we just don't show a toast for it.
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      setInterval(() => {
        void registration.update();
      }, CHECK_INTERVAL_MS);
    },
  });

  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    const dismissed = localStorage.getItem(DISMISS_KEY) === '1';

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    // iOS never fires beforeinstallprompt — show Share → Add to Home Screen tip once.
    if (!dismissed && isIos()) {
      setShowIosHint(true);
    }

    const onInstalled = () => {
      setInstallEvent(null);
      setShowIosHint(false);
    };
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismissInstall = () => {
    setInstallEvent(null);
    setShowIosHint(false);
    localStorage.setItem(DISMISS_KEY, '1');
  };

  const handleInstall = async () => {
    if (!installEvent) return;
    setInstalling(true);
    try {
      await installEvent.prompt();
      await installEvent.userChoice;
      setInstallEvent(null);
    } finally {
      setInstalling(false);
    }
  };

  // Prefer update over install when both could show.
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

  if (installEvent) {
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
