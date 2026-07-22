import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { themes } from '../theme';
import { subjects, topicsBySubject } from '../data/subjects';

const PRAISE = ['Great job!', 'Awesome!', 'You did it!', 'Super work!', 'Nicely done!'];

function speak(text: string) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.pitch = 1.3;
    utter.rate = 0.95;
    window.speechSynthesis.speak(utter);
  }
}

export default function TopicActivity() {
  const { subjectId, topicId } = useParams();
  const { theme, bumpProgress } = useApp();
  const palette = themes[theme];
  const navigate = useNavigate();

  const subjectIndex = subjects.findIndex((s) => s.id === subjectId);
  const subject = subjects[subjectIndex];
  const topic = subjectId ? topicsBySubject[subjectId]?.find((t) => t.id === topicId) : undefined;
  const color = palette.tileColors[subjectIndex % palette.tileColors.length];

  const [answered, setAnswered] = useState(false);
  const [praise, setPraise] = useState('');

  useEffect(() => {
    if (!subject || !topic) navigate('/home', { replace: true });
  }, [subject, topic, navigate]);

  useEffect(() => {
    if (!answered) return;
    const timer = setTimeout(() => {
      if (subjectId) navigate(`/subject/${subjectId}`, { replace: true });
    }, 1400);
    return () => clearTimeout(timer);
  }, [answered, subjectId, navigate]);

  if (!subject || !topic) return null;

  const handleTap = () => {
    if (answered) return;
    const line = PRAISE[Math.floor(Math.random() * PRAISE.length)];
    setPraise(line);
    setAnswered(true);
    speak(line);
    bumpProgress(subject.id);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        gap: 36,
      }}
    >
      <button
        onClick={() => navigate(`/subject/${subject.id}`)}
        className="navBtn"
        aria-label="Back"
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 14px rgba(0,0,0,0.1)',
        }}
      >
        <i className="fa-solid fa-arrow-left" style={{ fontSize: 20, color: palette.accent }} />
      </button>

      <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 'clamp(22px, 5vw, 32px)', color: palette.textDark, textAlign: 'center' }}>
        Let's practice {topic.label}!
      </div>
      <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 16, color: palette.textMuted, textAlign: 'center' }}>
        Tap any card to answer!
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            onClick={handleTap}
            className="tile"
            style={{
              width: 130,
              height: 130,
              borderRadius: 28,
              background: color,
              opacity: 1 - i * 0.12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '5px solid #fff',
              boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
              animation: answered ? 'popIn 0.4s ease-out' : undefined,
            }}
          >
            <i className={topic.icon} style={{ fontSize: 48, color: '#fff' }} />
          </button>
        ))}
      </div>

      {answered && (
        <div
          style={{
            fontFamily: "'Baloo 2', sans-serif",
            fontWeight: 800,
            fontSize: 28,
            color: palette.accent,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            animation: 'popIn 0.3s ease-out',
          }}
        >
          <i className="fa-solid fa-star" style={{ color: palette.starColor }} />
          {praise}
          <i className="fa-solid fa-star" style={{ color: palette.starColor }} />
        </div>
      )}
    </div>
  );
}
