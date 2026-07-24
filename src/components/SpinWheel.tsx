import { useRef, useState } from 'react';
import type { Reward } from '../types';
import { playTap } from '../utils/sound';

interface SpinWheelProps {
  rewards: Reward[];
  colors: string[];
  onLand: (reward: Reward, index: number) => void;
}

const SIZE = 260;
const CENTER = SIZE / 2;
const RADIUS = 122;
const SPIN_MS = 3200;

function polarToCartesian(angleDeg: number, radius: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CENTER + radius * Math.cos(rad), y: CENTER + radius * Math.sin(rad) };
}

function wedgePath(startAngle: number, endAngle: number) {
  const p1 = polarToCartesian(startAngle, RADIUS);
  const p2 = polarToCartesian(endAngle, RADIUS);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${CENTER} ${CENTER} L ${p1.x} ${p1.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${p2.x} ${p2.y} Z`;
}

export default function SpinWheel({ rewards, colors, onLand }: SpinWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const targetIndexRef = useRef(0);

  const n = rewards.length;
  const segment = 360 / n;

  const handleSpin = () => {
    if (spinning || hasSpun) return;
    const targetIndex = Math.floor(Math.random() * n);
    targetIndexRef.current = targetIndex;
    const wedgeCenterAngle = targetIndex * segment + segment / 2;
    const extraSpins = 5;
    const target = extraSpins * 360 + (360 - wedgeCenterAngle);

    playTap();
    setSpinning(true);
    setHasSpun(true);
    setRotation(target);
  };

  const handleTransitionEnd = () => {
    if (!spinning) return;
    setSpinning(false);
    onLand(rewards[targetIndexRef.current], targetIndexRef.current);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
      <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
        <div
          style={{
            position: 'absolute',
            top: -6,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '12px solid transparent',
            borderRight: '12px solid transparent',
            borderTop: '20px solid #dc2626',
            zIndex: 2,
            filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.25))',
          }}
        />
        <div
          onTransitionEnd={handleTransitionEnd}
          style={{
            width: SIZE,
            height: SIZE,
            borderRadius: '50%',
            boxShadow: '0 10px 26px rgba(0,0,0,0.25)',
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.17,0.67,0.12,0.99)` : 'none',
          }}
        >
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} style={{ display: 'block' }}>
            <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="#fff" />
            {rewards.map((r, i) => {
              const start = i * segment;
              const end = start + segment;
              const mid = start + segment / 2;
              const labelPos = polarToCartesian(mid, RADIUS * 0.62);
              return (
                <g key={i}>
                  <path d={wedgePath(start, end)} fill={colors[i % colors.length]} stroke="#fff" strokeWidth={2} />
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={26}
                  >
                    {r.emoji}
                  </text>
                </g>
              );
            })}
            <circle cx={CENTER} cy={CENTER} r={14} fill="#fff" stroke="#E5E1D6" strokeWidth={2} />
          </svg>
        </div>
      </div>

      <button
        onClick={handleSpin}
        disabled={spinning || hasSpun}
        className="tile"
        style={{
          background: spinning || hasSpun ? '#D8D3C4' : '#3DDC97',
          borderRadius: 999,
          padding: '14px 36px',
          fontFamily: "'Baloo 2', sans-serif",
          fontWeight: 800,
          fontSize: 17,
          color: '#fff',
          boxShadow: spinning || hasSpun ? 'none' : '0 8px 18px rgba(61,220,151,0.4)',
        }}
      >
        {spinning ? 'Spinning...' : 'Spin!'} <i className="fa-solid fa-rotate" style={{ marginLeft: 8 }} />
      </button>
    </div>
  );
}
