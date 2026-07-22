import type { ThemeName } from '../types';

const variants: Record<ThemeName, { style: React.CSSProperties }[]> = {
  playful: [
    { style: { top: 60, left: 70, width: 80, height: 80, borderRadius: '50%', background: '#FF8A80', animation: 'floatY 5s ease-in-out infinite' } },
    { style: { top: 120, right: 100, width: 56, height: 56, background: '#2EC4B6', transform: 'rotate(20deg)', animation: 'spinSlow 12s linear infinite' } },
    { style: { bottom: 100, left: 130, width: 64, height: 64, borderRadius: '50%', background: '#8E7CFF', animation: 'pulseSoft 4s ease-in-out infinite' } },
    { style: { bottom: 60, right: 150, width: 50, height: 50, transform: 'rotate(45deg)', background: '#FFA630', animation: 'floatY2 6s ease-in-out infinite' } },
    { style: { top: 260, right: 60, width: 34, height: 34, borderRadius: '50%', background: '#4CC3FF', animation: 'floatY 4s ease-in-out infinite 1s' } },
  ],
  calm: [
    { style: { top: 80, left: 90, width: 60, height: 60, borderRadius: '50%', background: '#C9DFC6', opacity: 0.6, animation: 'floatY 6s ease-in-out infinite' } },
    { style: { bottom: 120, right: 130, width: 50, height: 50, borderRadius: '50%', background: '#AFD3E0', opacity: 0.6, animation: 'floatY2 7s ease-in-out infinite' } },
  ],
  adventure: [
    { style: { top: 90, left: 110, width: 10, height: 10, borderRadius: '50%', background: '#E8B33D', animation: 'twinkle 3s ease-in-out infinite' } },
    { style: { top: 160, right: 140, width: 8, height: 8, borderRadius: '50%', background: '#F4EBD0', animation: 'twinkle 4s ease-in-out infinite .5s' } },
    { style: { bottom: 140, left: 80, width: 9, height: 9, borderRadius: '50%', background: '#E8B33D', animation: 'twinkle 3.5s ease-in-out infinite 1s' } },
    { style: { bottom: 200, right: 100, width: 7, height: 7, borderRadius: '50%', background: '#F4EBD0', animation: 'twinkle 4.5s ease-in-out infinite 1.5s' } },
    { style: { top: 280, left: 200, width: 6, height: 6, borderRadius: '50%', background: '#E8B33D', animation: 'twinkle 3.2s ease-in-out infinite .8s' } },
  ],
};

export default function FloatingShapes({ theme }: { theme: ThemeName }) {
  return (
    <>
      {variants[theme].map((s, i) => (
        <div key={i} className="bgShape" style={{ ...s.style, zIndex: 0 }} />
      ))}
    </>
  );
}
