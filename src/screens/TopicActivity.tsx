import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { themes } from '../theme';
import { subjects, topicsBySubject } from '../data/subjects';
import { fireConfetti } from '../utils/confetti';

const PRAISE = ['Great job!', 'Awesome!', 'You did it!', 'Super work!', 'Nicely done!'];
const TRY_AGAIN = ['Nice try!', "Let's keep going!", 'Almost!', 'Good effort!'];
const FEEDBACK_DELAY = 1100;

function speak(text: string) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.pitch = 1.3;
    utter.rate = 0.95;
    window.speechSynthesis.speak(utter);
  }
}

type Phase = 'question' | 'feedback' | 'finished';

export default function TopicActivity() {
  const { subjectId, topicId } = useParams();
  const { theme, kids, activeKidId, getKidSettings, recordTopicProgress, completeTopicSession } =
    useApp();
  const palette = themes[theme];
  const navigate = useNavigate();

  const kid = kids.find((k) => k.id === activeKidId);
  const subjectIndex = subjects.findIndex((s) => s.id === subjectId);
  const subject = subjects[subjectIndex];
  const topic = subjectId ? topicsBySubject[subjectId]?.find((t) => t.id === topicId) : undefined;
  const color = palette.tileColors[subjectIndex % palette.tileColors.length];

  const settings = kid ? getKidSettings(kid.id) : null;
  const totalQuestions = settings?.questionsPerTopic ?? 10;

  const [questionIndex, setQuestionIndex] = useState(0);
  const [correctIndex, setCorrectIndex] = useState(() => Math.floor(Math.random() * 3));
  const [answeredCount, setAnsweredCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [phase, setPhase] = useState<Phase>('question');
  const [lastCorrect, setLastCorrect] = useState(false);
  const [praise, setPraise] = useState('');
  const [finishResult, setFinishResult] = useState<{ starsEarnedThisRun: number; goalJustReached: boolean } | null>(
    null,
  );

  useEffect(() => {
    if (!kid || !subject || !topic) navigate('/home', { replace: true });
  }, [kid, subject, topic, navigate]);

  const resetRun = () => {
    setQuestionIndex(0);
    setCorrectIndex(Math.floor(Math.random() * 3));
    setAnsweredCount(0);
    setCorrectCount(0);
    setPhase('question');
    setFinishResult(null);
  };

  if (!kid || !subject || !topic || !settings) return null;

  const handleTap = (idx: number) => {
    if (phase !== 'question') return;
    const isCorrect = idx === correctIndex;
    const line = isCorrect ? PRAISE[Math.floor(Math.random() * PRAISE.length)] : TRY_AGAIN[Math.floor(Math.random() * TRY_AGAIN.length)];
    setLastCorrect(isCorrect);
    setPraise(line);
    setPhase('feedback');
    speak(line);

    const nextAnswered = answeredCount + 1;
    const nextCorrect = correctCount + (isCorrect ? 1 : 0);
    setAnsweredCount(nextAnswered);
    setCorrectCount(nextCorrect);
    recordTopicProgress(kid.id, subject.id, topic.id, nextAnswered, nextCorrect);

    setTimeout(() => {
      if (nextAnswered >= totalQuestions) {
        const result = completeTopicSession(kid.id, subject.id, topic.id, nextCorrect, totalQuestions);
        fireConfetti({ big: result.goalJustReached });
        setFinishResult(result);
        setPhase('finished');
      } else {
        setQuestionIndex((i) => i + 1);
        setCorrectIndex(Math.floor(Math.random() * 3));
        setPhase('question');
      }
    }, FEEDBACK_DELAY);
  };

  if (phase === 'finished' && finishResult) {
    const starsThisRun = finishResult.starsEarnedThisRun;
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          gap: 24,
          textAlign: 'center',
        }}
      >
        <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 'clamp(26px, 6vw, 38px)', color: palette.accent }}>
          You finished! <i className="fa-solid fa-champagne-glasses" />
        </div>
        <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 18, color: palette.textDark }}>
          Great work on {topic.label}!
        </div>

        {settings.rewardsEnabled && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                fontFamily: "'Baloo 2', sans-serif",
                fontWeight: 800,
                fontSize: 22,
                color: palette.textDark,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <i className="fa-solid fa-star" style={{ color: palette.starColor }} />
              {starsThisRun > 0 ? `You earned ${starsThisRun} star${starsThisRun > 1 ? 's' : ''}!` : 'Great practice!'}
            </div>
            {finishResult.goalJustReached && (
              <div
                style={{
                  fontFamily: "'Baloo 2', sans-serif",
                  fontWeight: 800,
                  fontSize: 18,
                  color: '#fff',
                  background: palette.accent,
                  padding: '10px 20px',
                  borderRadius: 999,
                  animation: 'popIn 0.4s ease-out',
                }}
              >
                You hit your star goal! <i className="fa-solid fa-trophy" />
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={resetRun}
            className="tile"
            style={{
              background: '#3DDC97',
              borderRadius: 999,
              padding: '14px 28px',
              fontFamily: "'Baloo 2', sans-serif",
              fontWeight: 800,
              fontSize: 16,
              color: '#fff',
              boxShadow: '0 8px 18px rgba(61,220,151,0.4)',
            }}
          >
            <i className="fa-solid fa-rotate-right" style={{ marginRight: 8 }} />
            Play again
          </button>
          <button
            onClick={() => navigate(`/subject/${subject.id}`)}
            className="tile"
            style={{
              background: '#fff',
              borderRadius: 999,
              padding: '14px 28px',
              fontFamily: "'Baloo 2', sans-serif",
              fontWeight: 800,
              fontSize: 16,
              color: palette.accent,
              boxShadow: '0 6px 14px rgba(0,0,0,0.1)',
            }}
          >
            Back to topics
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        gap: 28,
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

      <div
        style={{
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 800,
          fontSize: 15,
          color: palette.textMuted,
          background: palette.chipBg,
          padding: '6px 16px',
          borderRadius: 999,
        }}
      >
        Question {Math.min(questionIndex + 1, totalQuestions)} of {totalQuestions}
      </div>

      <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 'clamp(22px, 5vw, 32px)', color: palette.textDark, textAlign: 'center' }}>
        Let's practice {topic.label}!
      </div>
      <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 16, color: palette.textMuted, textAlign: 'center' }}>
        Tap the card to answer!
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[0, 1, 2].map((i) => {
          const isHint = settings.difficulty === 'easy' && phase === 'question' && i === correctIndex;
          return (
            <button
              key={i}
              onClick={() => handleTap(i)}
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
                boxShadow: isHint ? `0 0 0 6px ${palette.starColor}88, 0 10px 24px rgba(0,0,0,0.18)` : '0 10px 24px rgba(0,0,0,0.18)',
                animation: isHint ? 'pulseSoft 1.1s ease-in-out infinite' : phase === 'feedback' ? 'popIn 0.4s ease-out' : undefined,
              }}
            >
              <i className={topic.icon} style={{ fontSize: 48, color: '#fff' }} />
            </button>
          );
        })}
      </div>

      {phase === 'feedback' && (
        <div
          style={{
            fontFamily: "'Baloo 2', sans-serif",
            fontWeight: 800,
            fontSize: 28,
            color: lastCorrect ? palette.accent : palette.textMuted,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            animation: 'popIn 0.3s ease-out',
          }}
        >
          {lastCorrect && <i className="fa-solid fa-star" style={{ color: palette.starColor }} />}
          {praise}
          {lastCorrect && <i className="fa-solid fa-star" style={{ color: palette.starColor }} />}
        </div>
      )}
    </div>
  );
}
