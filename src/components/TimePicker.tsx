import type { CSSProperties } from 'react';

/** Minute granularity — 5 minutes is fine for a child's timetable. */
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const DEFAULT_TIME = '16:00';

interface TimePickerProps {
  /** "HH:MM" in 24-hour form. Empty or undefined means no time set. */
  value?: string;
  onChange: (value: string) => void;
  compact?: boolean;
  label?: string;
}

function parse(value: string) {
  const [h, m] = value.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return { hour12: h % 12 === 0 ? 12 : h % 12, minute: m, pm: h >= 12 };
}

function compose(hour12: number, minute: number, pm: boolean): string {
  const h24 = pm ? (hour12 === 12 ? 12 : hour12 + 12) : hour12 === 12 ? 0 : hour12;
  return `${String(h24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export default function TimePicker({ value, onChange, compact, label }: TimePickerProps) {
  const parts = value ? parse(value) : null;

  const fieldHeight = compact ? 30 : 38;
  const fontSize = compact ? 12 : 13;

  const selectStyle: CSSProperties = {
    height: fieldHeight,
    background: '#fff',
    border: '1px solid #E5E1D6',
    borderRadius: 9,
    padding: compact ? '0 4px' : '0 8px',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 800,
    fontSize,
    color: '#3E3B34',
    outline: 'none',
    cursor: 'pointer',
  };

  if (!parts) {
    return (
      <button
        onClick={() => onChange(DEFAULT_TIME)}
        style={{
          height: fieldHeight,
          padding: compact ? '0 10px' : '0 14px',
          borderRadius: 9,
          border: '1px dashed #D8D3C6',
          background: '#fff',
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 700,
          fontSize,
          color: '#8F887A',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          whiteSpace: 'nowrap',
        }}
      >
        <i className="fa-regular fa-clock" style={{ fontSize: fontSize - 1 }} />
        {label ?? 'Set time'}
      </button>
    );
  }

  const { hour12, minute, pm } = parts;
  // Keep an off-grid minute (e.g. a legacy 4:20) selectable rather than snapping it.
  const minuteOptions = MINUTES.includes(minute) ? MINUTES : [...MINUTES, minute].sort((a, b) => a - b);

  const meridiemButton = (isPm: boolean) => (
    <button
      key={String(isPm)}
      onClick={() => onChange(compose(hour12, minute, isPm))}
      aria-pressed={pm === isPm}
      style={{
        height: fieldHeight - 6,
        padding: compact ? '0 8px' : '0 11px',
        borderRadius: 7,
        border: 'none',
        background: pm === isPm ? '#2EC4B6' : 'transparent',
        color: pm === isPm ? '#fff' : '#8F887A',
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 800,
        fontSize: fontSize - 1,
      }}
    >
      {isPm ? 'PM' : 'AM'}
    </button>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <select
        value={hour12}
        onChange={(e) => onChange(compose(Number(e.target.value), minute, pm))}
        aria-label="Hour"
        style={selectStyle}
      >
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>

      <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize, color: '#A9A294' }}>:</span>

      <select
        value={minute}
        onChange={(e) => onChange(compose(hour12, Number(e.target.value), pm))}
        aria-label="Minutes"
        style={selectStyle}
      >
        {minuteOptions.map((m) => (
          <option key={m} value={m}>
            {String(m).padStart(2, '0')}
          </option>
        ))}
      </select>

      <div
        style={{
          display: 'flex',
          gap: 2,
          padding: 3,
          borderRadius: 9,
          background: '#F2F0E9',
          border: '1px solid #E5E1D6',
        }}
      >
        {meridiemButton(false)}
        {meridiemButton(true)}
      </div>

      <button
        onClick={() => onChange('')}
        aria-label="Clear time"
        style={{ color: '#C9C2B4', padding: 4, marginLeft: 2 }}
      >
        <i className="fa-solid fa-xmark" style={{ fontSize: fontSize }} />
      </button>
    </div>
  );
}
