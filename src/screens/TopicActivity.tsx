import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { themes } from '../theme';
import { findActivity, findSubject, findTopic } from '../data/subjects';
import { fireConfetti } from '../utils/confetti';
import { playSound } from '../utils/sound';
import { genMathQuestion, getNumberLineWindow, buildAnswerChoices, type MathQuestion } from '../utils/mathQuestions';
import NumberLine from '../components/NumberLine';
import { activityAllowed } from '../utils/plan';

const PRAISE = ['Great job!', 'Awesome!', 'You did it!', 'Super work!', 'Nicely done!'];
const TRY_AGAIN = ['Nice try!', "Let's keep going!", 'Almost!', 'Good effort!'];
const FEEDBACK_DELAY = 1100;
const CORRECT_SOUND = 'confirmation_001';
const WRONG_SOUND = 'error_002';
const FINISH_SOUND = 'bong_001';

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
  const { subjectId, topicId, activityId } = useParams();
  const [searchParams] = useSearchParams();
  const { theme, kids, activeKidId, getKidSettings, getTodayRecord, recordTopicProgress, completeTopicSession } =
    useApp();
  const palette = themes[theme];
  const navigate = useNavigate();

  const kid = kids.find((k) => k.id === activeKidId);
  const subject = findSubject(subjectId);
  const topic = findTopic(subject, topicId);
  const activity = findActivity(topic, activityId);

  const settings = kid ? getKidSettings(kid.id) : null;
  const totalQuestions = settings?.questionsPerTopic ?? 10;
  const difficulty = settings?.difficulty ?? 'normal';
  const showNumberLine = activity?.numberLine ?? false;
  const mathType: 'add' | 'sub' = activity?.op ?? 'add';
  const activityMax = activity?.max ?? 10;

  // Scheduled sessions run for their slot; free play runs a question count.
  const scheduledMins = Number(searchParams.get('mins')) || 0;
  const isTimed = scheduledMins > 0;
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [elapsedMs, setElapsedMs] = useState(0);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [mathQ, setMathQ] = useState<MathQuestion>(() => genMathQuestion(mathType, activityMax, difficulty));
  const [answerChoices, setAnswerChoices] = useState<number[]>(() => buildAnswerChoices(mathQ.ans));
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [attemptsOnCurrent, setAttemptsOnCurrent] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [phase, setPhase] = useState<Phase>('question');
  const [finishResult, setFinishResult] = useState<{ starsEarnedThisRun: number } | null>(null);

  const numberLineWindow = useMemo(
    () => getNumberLineWindow(mathQ, activityMax, difficulty),
    [mathQ, activityMax, difficulty],
  );

  // Plan-only mode still lets planned activities through — only off-plan ones bounce.
  const allowed =
    kid && settings ? activityAllowed(settings, getTodayRecord(kid.id), subjectId, topicId, activityId) : true;

  useEffect(() => {
    if (!kid || !subject || !topic || !activity || !allowed) navigate('/home', { replace: true });
  }, [kid, subject, topic, activity, allowed, navigate]);

  // Drives the slot progress bar. The session only ends between questions.
  useEffect(() => {
    if (!isTimed) return;
    const id = setInterval(() => setElapsedMs(Date.now() - startedAt), 1000);
    return () => clearInterval(id);
  }, [isTimed, startedAt]);

  const nextMathQuestion = () => {
    const q = genMathQuestion(mathType, activityMax, difficulty);
    setMathQ(q);
    setAnswerChoices(buildAnswerChoices(q.ans));
    setSelectedAnswer(null);
  };

  /** A run ends when the slot is up, or at the question count when untimed. */
  const runIsOver = (answered: number) =>
    isTimed ? Date.now() - startedAt >= scheduledMins * 60_000 : answered >= totalQuestions;

  const resetRun = () => {
    setQuestionIndex(0);
    setStartedAt(Date.now());
    setElapsedMs(0);
    nextMathQuestion();
    setAnsweredCount(0);
    setCorrectCount(0);
    setAttemptsOnCurrent(0);
    setStrikes(0);
    setPhase('question');
    setFinishResult(null);
  };

  if (!kid || !subject || !topic || !activity || !settings || !allowed) return null;

  const finishSession = (correct: number, answered: number, passed: boolean) => {
    const result = completeTopicSession(
      kid.id,
      subject.id,
      topic.id,
      activity.id,
      correct,
      answered,
      totalQuestions,
      passed,
    );
    playSound(FINISH_SOUND);
    if (result.rewardReady) {
      navigate('/home');
      return;
    }
    if (passed) fireConfetti();
    setFinishResult(result);
    setPhase('finished');
  };

  const advanceQuestion = () => {
    setQuestionIndex((i) => i + 1);
    nextMathQuestion();
    setAttemptsOnCurrent(0);
    setPhase('question');
  };

  const commitAnswer = (isCorrect: boolean) => {
    const line = isCorrect ? PRAISE[Math.floor(Math.random() * PRAISE.length)] : TRY_AGAIN[Math.floor(Math.random() * TRY_AGAIN.length)];
    setPhase('feedback');
    playSound(isCorrect ? CORRECT_SOUND : WRONG_SOUND);
    if (isCorrect) fireConfetti();
    speak(line);

    if (isCorrect) {
      const nextAnswered = answeredCount + 1;
      const nextCorrect = correctCount + 1;
      setAnsweredCount(nextAnswered);
      setCorrectCount(nextCorrect);
      recordTopicProgress(kid.id, subject.id, topic.id, activity.id, nextAnswered, nextCorrect);

      setTimeout(() => {
        if (runIsOver(nextAnswered)) {
          finishSession(nextCorrect, nextAnswered, true);
        } else {
          advanceQuestion();
        }
      }, FEEDBACK_DELAY);
      return;
    }

    if (attemptsOnCurrent === 0) {
      // First miss on this question — free retry, no strike yet.
      setAttemptsOnCurrent(1);
      setTimeout(() => {
        setSelectedAnswer(null);
        setPhase('question');
      }, FEEDBACK_DELAY);
      return;
    }

    // Second miss on this question — counts as a strike.
    const nextStrikes = strikes + 1;
    const nextAnswered = answeredCount + 1;
    setStrikes(nextStrikes);
    setAnsweredCount(nextAnswered);
    recordTopicProgress(kid.id, subject.id, topic.id, activity.id, nextAnswered, correctCount);

    setTimeout(() => {
      if (nextStrikes >= 2) {
        finishSession(correctCount, nextAnswered, false);
      } else if (runIsOver(nextAnswered)) {
        finishSession(correctCount, nextAnswered, true);
      } else {
        advanceQuestion();
      }
    }, FEEDBACK_DELAY);
  };

  const handleSubmitMathAnswer = () => {
    if (phase !== 'question' || selectedAnswer === null) return;
    commitAnswer(selectedAnswer === mathQ.ans);
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
          Great work on {activity.label}!
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
            onClick={() => navigate(`/subject/${subject.id}/topic/${topic.id}`)}
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
            Back to {topic.label}
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
        onClick={() => navigate(`/subject/${subject.id}/topic/${topic.id}`)}
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

      {isTimed ? (
        // No countdown — a ticking clock is pressure at this age. Just a bar.
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
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
            Question {questionIndex + 1}
          </div>
          <div style={{ width: 180, height: 8, background: palette.chipBg, borderRadius: 999, overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(100, (elapsedMs / (scheduledMins * 60_000)) * 100)}%`,
                height: '100%',
                background: palette.accent,
                borderRadius: 999,
                transition: 'width 1s linear',
              }}
            />
          </div>
        </div>
      ) : (
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
      )}

      <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 'clamp(22px, 5vw, 32px)', color: palette.textDark, textAlign: 'center' }}>
        Let's practice {activity.label}!
      </div>
      <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 16, color: palette.textMuted, textAlign: 'center' }}>
        {showNumberLine ? 'Use − and + to count, then pick your answer!' : 'Pick your answer!'}
      </div>

      <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              fontFamily: "'Baloo 2', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(32px, 8vw, 46px)',
              color: palette.textDark,
            }}
          >
            <span>{mathQ.a}</span>
            <span style={{ color: palette.accent }}>{mathQ.type === 'add' ? '+' : '−'}</span>
            <span>{mathQ.b}</span>
            <span style={{ color: palette.textMuted }}>=</span>
            <span style={{ color: palette.textMuted }}>?</span>
          </div>

          {showNumberLine && (
            <div
              style={{
                width: '100%',
                maxWidth: 480,
                background: '#fff',
                borderRadius: 20,
                padding: '18px 14px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <NumberLine key={`${activity.id}-${questionIndex}`} win={numberLineWindow} disabled={phase !== 'question'} />
            </div>
          )}

          <div
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              color: palette.textMuted,
            }}
          >
            My answer is...
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 420 }}>
            {answerChoices.map((n) => (
              <button
                key={n}
                onClick={() => phase === 'question' && setSelectedAnswer(n)}
                disabled={phase !== 'question'}
                className="tile"
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  background: selectedAnswer === n ? palette.accent : '#fff',
                  color: selectedAnswer === n ? '#fff' : palette.textDark,
                  fontFamily: "'Baloo 2', sans-serif",
                  fontWeight: 800,
                  fontSize: 20,
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                }}
              >
                {n}
              </button>
            ))}
          </div>

          <button
            onClick={handleSubmitMathAnswer}
            disabled={phase !== 'question' || selectedAnswer === null}
            className="tile"
            style={{
              background: selectedAnswer === null ? '#C7BFA9' : palette.accent,
              borderRadius: 999,
              padding: '14px 34px',
              fontFamily: "'Baloo 2', sans-serif",
              fontWeight: 800,
              fontSize: 16,
              color: '#fff',
              boxShadow: selectedAnswer === null ? 'none' : `0 8px 18px ${palette.accent}66`,
              opacity: selectedAnswer === null ? 0.7 : 1,
            }}
          >
            That's my answer! <i className="fa-solid fa-check" />
          </button>
      </>
    </div>
  );
}
