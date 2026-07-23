import { useState } from 'react';
import type { NumberLineWindow } from '../utils/mathQuestions';
import { playTap } from '../utils/sound';

interface NumberLineProps {
  win: NumberLineWindow;
  disabled?: boolean;
}

function tickX(value: number, min: number, max: number, padX: number, innerWidth: number) {
  if (max === min) return padX + innerWidth / 2;
  return padX + ((value - min) / (max - min)) * innerWidth;
}

function arcPath(x1: number, x2: number, y: number, height: number) {
  const mid = (x1 + x2) / 2;
  return `M ${x1} ${y} Q ${mid} ${y - height} ${x2} ${y}`;
}

export default function NumberLine({ win, disabled = false }: NumberLineProps) {
  const { min, max, start, end } = win;
  const [currentPos, setCurrentPos] = useState(start);
  const [arcs, setArcs] = useState<{ from: number; to: number; forward: boolean }[]>([]);

  const padX = 28;
  const ticks = Math.max(2, max - min + 1);
  const maxLabelChars = Math.max(String(min).length, String(max).length);
  const labelStepPx = maxLabelChars * 10 + 14;
  const stepPx = Math.max(26, labelStepPx);
  const width = Math.max(300, (ticks - 1) * stepPx + padX * 2);
  const height = 110;
  const lineY = 60;
  const arcH = 20;
  const innerWidth = width - padX * 2;

  const values: number[] = [];
  for (let n = min; n <= max; n++) values.push(n);

  const stepForward = () => {
    if (disabled || currentPos >= max) return;
    setArcs((a) => [...a, { from: currentPos, to: currentPos + 1, forward: true }]);
    setCurrentPos((p) => p + 1);
    playTap();
  };

  const stepBack = () => {
    if (disabled || currentPos <= min) return;
    setArcs((a) => [...a, { from: currentPos, to: currentPos - 1, forward: false }]);
    setCurrentPos((p) => p - 1);
    playTap();
  };

  const dir = win.isAdd ? 'forward' : 'back';
  const ariaLabel = `Start at ${start}, jump ${dir} ${win.jumps} time${win.jumps === 1 ? '' : 's'}, land on ${end}`;

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', overflowX: 'auto' }}
    >
      <button
        type="button"
        onClick={stepBack}
        disabled={disabled || currentPos <= min}
        aria-label="Step back one on the number line"
        style={{
          flexShrink: 0,
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          fontWeight: 800,
          color: '#dc2626',
          opacity: disabled || currentPos <= min ? 0.4 : 1,
        }}
      >
        &minus;
      </button>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        aria-hidden="true"
        style={{ display: 'block', margin: '0 auto' }}
      >
        <line x1={padX - 8} y1={lineY} x2={width - padX + 8} y2={lineY} stroke="#9c9284" strokeWidth={2} />
        {values.map((n) => {
          const x = tickX(n, min, max, padX, innerWidth);
          return (
            <g key={n}>
              <line x1={x} y1={lineY - 6} x2={x} y2={lineY + 6} stroke="#9c9284" strokeWidth={2} />
              <text x={x} y={lineY + 24} textAnchor="middle" fontSize={13} fontWeight={700} fill="#6b6355">
                {n}
              </text>
            </g>
          );
        })}
        <g>
          {arcs.map((arc, i) => {
            const x1 = tickX(arc.from, min, max, padX, innerWidth);
            const x2 = tickX(arc.to, min, max, padX, innerWidth);
            return (
              <path
                key={i}
                d={arcPath(x1, x2, lineY, arcH)}
                stroke={arc.forward ? '#2563eb' : '#dc2626'}
                fill="none"
                strokeWidth={2.5}
                strokeDasharray="6 4"
              />
            );
          })}
        </g>
        <g style={{ animation: 'bounceArrow 1s ease-in-out infinite' }}>
          <path
            d={`M ${tickX(start, min, max, padX, innerWidth) - 7} ${lineY - arcH - 18} L ${tickX(start, min, max, padX, innerWidth) + 7} ${lineY - arcH - 18} L ${tickX(start, min, max, padX, innerWidth)} ${lineY - arcH - 6} Z`}
            fill="#dc2626"
          />
        </g>
        <circle cx={tickX(start, min, max, padX, innerWidth)} cy={lineY} r={5} fill="#dc2626" />
        <circle
          cx={tickX(end, min, max, padX, innerWidth)}
          cy={lineY}
          r={5}
          fill="#2563eb"
          opacity={currentPos === end ? 1 : 0}
        />
        <circle cx={tickX(currentPos, min, max, padX, innerWidth)} cy={lineY} r={6} fill="#2563eb" />
      </svg>

      <button
        type="button"
        onClick={stepForward}
        disabled={disabled || currentPos >= max}
        aria-label="Step forward one on the number line"
        style={{
          flexShrink: 0,
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          fontWeight: 800,
          color: '#2563eb',
          opacity: disabled || currentPos >= max ? 0.4 : 1,
        }}
      >
        +
      </button>
    </div>
  );
}
