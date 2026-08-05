import { useMemo, useState } from 'react';
import type { PlanItem } from '../types';
import { allActivities, visibleSubjects, visibleTopics } from '../data/subjects';
import { DURATION_OPTIONS, cascadeSlots, formatTime } from '../utils/plan';
import TimePicker from './TimePicker';

const OFFLINE_ICON_OPTIONS = [
  'fa-solid fa-book',
  'fa-solid fa-pencil',
  'fa-solid fa-palette',
  'fa-solid fa-music',
  'fa-solid fa-bicycle',
  'fa-solid fa-broom',
  'fa-solid fa-tooth',
  'fa-solid fa-bed',
];

interface PlanAddSheetProps {
  dayLabel: string;
  onClose: () => void;
  onAdd: (items: PlanItem[]) => void;
}

type View = { kind: 'root' } | { kind: 'topic'; subjectId: string; topicId: string } | { kind: 'offline' };

const label: React.CSSProperties = {
  fontFamily: "'Nunito', sans-serif",
  fontWeight: 700,
  fontSize: 13,
  color: '#5B4A1E',
};

export default function PlanAddSheet({ dayLabel, onClose, onAdd }: PlanAddSheetProps) {
  const [view, setView] = useState<View>({ kind: 'root' });
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(15);
  const [offlineLabel, setOfflineLabel] = useState('');
  const [offlineIcon, setOfflineIcon] = useState(OFFLINE_ICON_OPTIONS[0]);

  const refs = useMemo(() => allActivities(), []);
  const refKey = (subjectId: string, topicId: string, activityId: string) =>
    `${subjectId}:${topicId}:${activityId}`;

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return refs.filter(
      (r) =>
        r.activity.label.toLowerCase().includes(q) ||
        r.topic.label.toLowerCase().includes(q) ||
        r.subject.label.toLowerCase().includes(q),
    );
  }, [refs, search]);

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  /** Selected activities in catalogue order, not tick order. */
  const chosen = refs.filter((r) => selected.has(refKey(r.subject.id, r.topic.id, r.activity.id)));

  /** Back-to-back slots, so adding three builds a run rather than a pile-up. */
  const cascade = time ? cascadeSlots(chosen.length, time, duration) : [];

  const commitActivities = () => {
    if (chosen.length === 0) return;
    const items: PlanItem[] = chosen.map((r, i) => ({
      id: crypto.randomUUID(),
      kind: 'app' as const,
      subjectId: r.subject.id,
      topicId: r.topic.id,
      activityId: r.activity.id,
      time: cascade[i],
      durationMin: time ? duration : undefined,
    }));
    onAdd(items);
    onClose();
  };

  const commitOffline = () => {
    const text = offlineLabel.trim();
    if (!text) return;
    onAdd([
      {
        id: crypto.randomUUID(),
        kind: 'offline',
        label: text,
        icon: offlineIcon,
        time: time || undefined,
        durationMin: time ? duration : undefined,
      },
    ]);
    onClose();
  };

  const rowButton: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    background: '#fff',
    border: '1px solid #EFEBE0',
    borderRadius: 12,
    padding: '12px 14px',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 700,
    fontSize: 13,
    color: '#3E3B34',
    textAlign: 'left',
  };

  const activeTopic =
    view.kind === 'topic'
      ? visibleSubjects()
          .find((s) => s.id === view.subjectId)
          ?.topics.find((t) => t.id === view.topicId)
      : undefined;
  const activeSubject =
    view.kind === 'topic' ? visibleSubjects().find((s) => s.id === view.subjectId) : undefined;

  const timeAndDuration = (
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', paddingTop: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={label}>{view.kind === 'offline' ? 'Time' : 'Start at'}</span>
        <TimePicker value={time} onChange={setTime} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={label}>{view.kind === 'offline' || chosen.length < 2 ? 'For' : 'Each'}</span>
        <select
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          disabled={!time}
          aria-label="Duration"
          style={{
            width: 96,
            background: time ? '#fff' : '#F2F0E9',
            border: '1px solid #E5E1D6',
            borderRadius: 10,
            padding: '8px 8px',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 700,
            fontSize: 13,
            color: time ? '#3E3B34' : '#A9A294',
            outline: 'none',
          }}
        >
          {DURATION_OPTIONS.map((d) => (
            <option key={d} value={d}>
              {d} min
            </option>
          ))}
        </select>
      </div>
      {!time && (
        <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 600, fontSize: 12, color: '#A9A294' }}>
          No time? It sits at the end of the day.
        </span>
      )}
    </div>
  );

  const activityRow = (
    subjectId: string,
    topicId: string,
    activityId: string,
    activityLabel: string,
    icon: string,
    context?: string,
  ) => {
    const key = refKey(subjectId, topicId, activityId);
    const checked = selected.has(key);
    return (
      <button
        key={key}
        onClick={() => toggle(key)}
        style={{ ...rowButton, borderColor: checked ? '#2EC4B6' : '#EFEBE0', background: checked ? '#F2FBFA' : '#fff' }}
      >
        <span
          style={{
            width: 20,
            height: 20,
            borderRadius: 6,
            flexShrink: 0,
            border: checked ? 'none' : '2px solid #D8D3C6',
            background: checked ? '#2EC4B6' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {checked && <i className="fa-solid fa-check" style={{ fontSize: 11, color: '#fff' }} />}
        </span>
        <i className={icon} style={{ fontSize: 14, color: '#2EC4B6', width: 18 }} />
        <span style={{ flex: 1 }}>
          {activityLabel}
          {context && (
            <span style={{ display: 'block', fontWeight: 600, fontSize: 11, color: '#A9A294' }}>{context}</span>
          )}
        </span>
      </button>
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Add to ${dayLabel}`}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(30,28,24,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 460,
          maxHeight: '86vh',
          background: '#F7F5F0',
          borderRadius: 20,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0,0,0,0.28)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '16px 18px',
            borderBottom: '1px solid #E9E5D9',
          }}
        >
          {view.kind !== 'root' && (
            <button onClick={() => setView({ kind: 'root' })} aria-label="Back" style={{ color: '#8F887A', padding: 4 }}>
              <i className="fa-solid fa-chevron-left" style={{ fontSize: 14 }} />
            </button>
          )}
          <div style={{ flex: 1, fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: 17, color: '#2E2B26' }}>
            {view.kind === 'topic' ? activeTopic?.label : view.kind === 'offline' ? 'Offline task' : `Add to ${dayLabel}`}
          </div>
          <button onClick={onClose} aria-label="Close" style={{ color: '#8F887A', padding: 4 }}>
            <i className="fa-solid fa-xmark" style={{ fontSize: 16 }} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {view.kind === 'root' && (
            <>
              <div style={{ position: 'relative' }}>
                <i
                  className="fa-solid fa-magnifying-glass"
                  style={{ position: 'absolute', left: 14, top: 13, fontSize: 13, color: '#A9A294' }}
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search activities"
                  style={{
                    width: '100%',
                    background: '#fff',
                    border: '1px solid #E5E1D6',
                    borderRadius: 12,
                    padding: '11px 14px 11px 36px',
                    fontFamily: "'Nunito', sans-serif",
                    fontWeight: 700,
                    fontSize: 13,
                    color: '#3E3B34',
                    outline: 'none',
                  }}
                />
              </div>

              {search.trim() ? (
                searchResults.length === 0 ? (
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 600, fontSize: 13, color: '#8F887A' }}>
                    Nothing matches "{search.trim()}".
                  </div>
                ) : (
                  searchResults.map((r) =>
                    activityRow(
                      r.subject.id,
                      r.topic.id,
                      r.activity.id,
                      r.activity.label,
                      r.activity.icon,
                      `${r.subject.label} · ${r.topic.label}`,
                    ),
                  )
                )
              ) : (
                <>
                  {visibleSubjects().map((s) => (
                    <div key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div
                        style={{
                          fontFamily: "'Nunito', sans-serif",
                          fontWeight: 800,
                          fontSize: 11,
                          letterSpacing: 0.6,
                          textTransform: 'uppercase',
                          color: '#A9A294',
                          marginTop: 4,
                        }}
                      >
                        {s.label}
                      </div>
                      {visibleTopics(s).map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setView({ kind: 'topic', subjectId: s.id, topicId: t.id })}
                          style={rowButton}
                        >
                          <i className={t.icon} style={{ fontSize: 14, color: '#2EC4B6', width: 18 }} />
                          <span style={{ flex: 1 }}>{t.label}</span>
                          <span style={{ fontWeight: 800, fontSize: 12, color: '#A9A294' }}>{t.activities.length}</span>
                          <i className="fa-solid fa-chevron-right" style={{ fontSize: 11, color: '#C9C2B4' }} />
                        </button>
                      ))}
                    </div>
                  ))}
                  <button
                    onClick={() => setView({ kind: 'offline' })}
                    style={{ ...rowButton, marginTop: 6, borderStyle: 'dashed' }}
                  >
                    <i className="fa-solid fa-house" style={{ fontSize: 14, color: '#C89B3C', width: 18 }} />
                    <span style={{ flex: 1 }}>Add an offline task</span>
                    <i className="fa-solid fa-chevron-right" style={{ fontSize: 11, color: '#C9C2B4' }} />
                  </button>
                </>
              )}
            </>
          )}

          {view.kind === 'topic' && activeTopic && activeSubject && (
            <>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 600, fontSize: 12, color: '#A9A294' }}>
                {activeSubject.label} · pick one or more
              </div>
              {activeTopic.activities.map((a) =>
                activityRow(activeSubject.id, activeTopic.id, a.id, a.label, a.icon),
              )}
            </>
          )}

          {view.kind === 'offline' && (
            <>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {OFFLINE_ICON_OPTIONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setOfflineIcon(icon)}
                    aria-label={icon}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: offlineIcon === icon ? '#2EC4B6' : '#fff',
                      color: offlineIcon === icon ? '#fff' : '#8F887A',
                      border: '1px solid #E5E1D6',
                    }}
                  >
                    <i className={icon} style={{ fontSize: 13 }} />
                  </button>
                ))}
              </div>
              <input
                value={offlineLabel}
                onChange={(e) => setOfflineLabel(e.target.value)}
                placeholder="e.g. Read a book"
                maxLength={40}
                style={{
                  background: '#fff',
                  border: '1px solid #E5E1D6',
                  borderRadius: 12,
                  padding: '11px 14px',
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 700,
                  fontSize: 13,
                  color: '#3E3B34',
                  outline: 'none',
                }}
              />
            </>
          )}
        </div>

        <div style={{ padding: '14px 18px', borderTop: '1px solid #E9E5D9', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {timeAndDuration}

          {/* Show the resulting run before committing — no surprise overlaps. */}
          {view.kind !== 'offline' && chosen.length > 0 && time && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, background: '#fff', borderRadius: 12, padding: '10px 12px' }}>
              {chosen.map((r, i) => (
                <div
                  key={refKey(r.subject.id, r.topic.id, r.activity.id)}
                  style={{ display: 'flex', gap: 10, alignItems: 'center', fontFamily: "'Nunito', sans-serif", fontSize: 12 }}
                >
                  <span style={{ fontWeight: 800, color: '#2EC4B6', width: 74, flexShrink: 0 }}>
                    {formatTime(cascade[i])}
                  </span>
                  <span style={{ fontWeight: 700, color: '#3E3B34', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.activity.label}
                  </span>
                </div>
              ))}
            </div>
          )}
          {view.kind === 'offline' ? (
            <button
              onClick={commitOffline}
              disabled={!offlineLabel.trim()}
              style={{
                borderRadius: 12,
                padding: '12px 18px',
                background: offlineLabel.trim() ? '#2EC4B6' : '#D8D3C6',
                color: '#fff',
                fontFamily: "'Baloo 2', sans-serif",
                fontWeight: 800,
                fontSize: 15,
              }}
            >
              Add to {dayLabel}
            </button>
          ) : (
            <button
              onClick={commitActivities}
              disabled={selected.size === 0}
              style={{
                borderRadius: 12,
                padding: '12px 18px',
                background: selected.size > 0 ? '#2EC4B6' : '#D8D3C6',
                color: '#fff',
                fontFamily: "'Baloo 2', sans-serif",
                fontWeight: 800,
                fontSize: 15,
              }}
            >
              {selected.size > 0 ? `Add ${selected.size} to ${dayLabel}` : `Add to ${dayLabel}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
