import type { ReactNode } from 'react';

interface ConfirmDialogProps {
  title: string;
  body: ReactNode;
  /** Names the consequence, e.g. "Delete Sam" — never "OK". */
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
  /** Shown for child-specific actions, so the wrong profile is hard to pick. */
  avatar?: { icon: string; color: string; name: string };
}

export default function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  destructive = false,
  avatar,
}: ConfirmDialogProps) {
  const accent = destructive ? '#D64545' : '#2EC4B6';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(30,28,24,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 130,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#F7F5F0',
          borderRadius: 22,
          padding: '26px 24px 20px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          textAlign: 'center',
          alignItems: 'center',
        }}
      >
        {avatar ? (
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: avatar.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <i className={avatar.icon} style={{ fontSize: 26, color: '#fff' }} />
          </div>
        ) : (
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: destructive ? '#FDECEC' : '#E8F8F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <i
              className={destructive ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-question'}
              style={{ fontSize: 22, color: accent }}
            />
          </div>
        )}

        <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 20, color: '#2E2B26' }}>
          {title}
        </div>

        <div
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 600,
            fontSize: 14,
            lineHeight: 1.5,
            color: '#6B6355',
          }}
        >
          {body}
        </div>

        {/* Cancel sits first and is autofocused: the safe option wins a reflex tap. */}
        <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 4 }}>
          <button
            autoFocus
            onClick={onCancel}
            className="tile"
            style={{
              flex: 1,
              padding: '13px 18px',
              borderRadius: 14,
              background: '#fff',
              border: '1px solid #E5E1D6',
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 800,
              fontSize: 14,
              color: '#5B4A1E',
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="tile"
            style={{
              flex: 1,
              padding: '13px 18px',
              borderRadius: 14,
              background: destructive ? '#FDECEC' : accent,
              border: destructive ? `2px solid ${accent}` : 'none',
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 800,
              fontSize: 14,
              color: destructive ? accent : '#fff',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
