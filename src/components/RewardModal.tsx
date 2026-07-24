import { useEffect, useState, type CSSProperties } from 'react';
import { useApp } from '../context/AppContext';
import { themes } from '../theme';
import type { Kid, KidSettings, Reward } from '../types';
import { fireConfetti } from '../utils/confetti';
import { playSound, playTap } from '../utils/sound';
import SpinWheel from './SpinWheel';

interface RewardModalProps {
  kid: Kid;
  settings: KidSettings;
}

const REWARD_SOUND = 'bong_001';

export default function RewardModal({ kid, settings }: RewardModalProps) {
  const { theme, claimReward } = useApp();
  const palette = themes[theme];
  const [landedReward, setLandedReward] = useState<Reward | null>(null);

  useEffect(() => {
    fireConfetti({ big: true });
    playSound(REWARD_SOUND);
  }, []);

  const handleClaim = () => {
    playTap();
    claimReward(kid.id);
  };

  const hasRewards = settings.rewards.length > 0;
  const singleReward = settings.rewards.length === 1 ? settings.rewards[0] : null;
  const revealed = singleReward ?? landedReward;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: palette.cardBg,
          borderRadius: 28,
          boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
          padding: '36px 28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          textAlign: 'center',
          animation: 'popIn 0.4s ease-out',
        }}
      >
        <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 'clamp(24px, 6vw, 32px)', color: palette.accent }}>
          <i className="fa-solid fa-trophy" style={{ marginRight: 10 }} />
          You reached your goal!
        </div>
        <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 17, color: palette.textDark }}>
          Amazing work, {kid.name}!
        </div>

        {!hasRewards && (
          <>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 15, color: palette.textMuted }}>
              Ask a grown-up to add rewards in Settings!
            </div>
            <button onClick={handleClaim} className="tile" style={claimButtonStyle(palette.accent)}>
              Yay! <i className="fa-solid fa-face-smile" style={{ marginLeft: 8 }} />
            </button>
          </>
        )}

        {hasRewards && !revealed && singleReward === null && (
          <SpinWheel rewards={settings.rewards} colors={palette.tileColors} onLand={(reward) => setLandedReward(reward)} />
        )}

        {hasRewards && revealed && (
          <>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                animation: 'popIn 0.4s ease-out',
              }}
            >
              <div style={{ fontSize: 56 }}>{revealed.emoji}</div>
              <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 20, color: palette.textDark }}>
                You won: {revealed.label}!
              </div>
            </div>
            <button onClick={handleClaim} className="tile" style={claimButtonStyle(palette.accent)}>
              Claim! <i className="fa-solid fa-gift" style={{ marginLeft: 8 }} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function claimButtonStyle(accent: string): CSSProperties {
  return {
    background: accent,
    borderRadius: 999,
    padding: '14px 36px',
    fontFamily: "'Baloo 2', sans-serif",
    fontWeight: 800,
    fontSize: 17,
    color: '#fff',
    boxShadow: `0 8px 18px ${accent}66`,
  };
}
