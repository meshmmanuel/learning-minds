import { useEffect } from 'react';

const VISIBLE_MS = 2000;

interface ToastProps {
  message: string;
  onDone: () => void;
}

export default function Toast({ message, onDone }: ToastProps) {
  useEffect(() => {
    const id = setTimeout(onDone, VISIBLE_MS);
    return () => clearTimeout(id);
  }, [message, onDone]);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 28,
        transform: 'translateX(-50%)',
        zIndex: 120,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: '#2E2B26',
        color: '#fff',
        borderRadius: 999,
        padding: '12px 22px',
        boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 800,
        fontSize: 14,
        animation: 'popIn 0.25s ease-out',
      }}
    >
      <i className="fa-solid fa-circle-check" style={{ color: '#3DDC97' }} />
      {message}
    </div>
  );
}
