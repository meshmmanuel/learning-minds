import { useRegisterSW } from 'virtual:pwa-register/react';

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // hourly

export default function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
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

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div
      role="alert"
      style={{
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
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.35 }}>
        {needRefresh
          ? 'A new version of Explorer Kids is ready.'
          : 'Ready to use offline — you can install it to your home screen.'}
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        {needRefresh ? (
          <button
            type="button"
            onClick={() => void updateServiceWorker(true)}
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              background: '#FF6F61',
              color: '#fff',
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            Update
          </button>
        ) : null}
        <button
          type="button"
          onClick={close}
          style={{
            padding: '8px 14px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.12)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
