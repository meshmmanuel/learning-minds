import confetti from 'canvas-confetti';

export function fireConfetti({ big = false }: { big?: boolean } = {}) {
  const colors = ['#FF6F61', '#2EC4B6', '#8E7CFF', '#FF6FA5', '#3DDC97', '#4CC3FF', '#FFD166'];

  if (!big) {
    confetti({
      particleCount: 80,
      spread: 65,
      startVelocity: 35,
      origin: { y: 0.6 },
      colors,
    });
    return;
  }

  const end = Date.now() + 800;
  const frame = () => {
    confetti({ particleCount: 6, angle: 60, spread: 70, origin: { x: 0 }, colors });
    confetti({ particleCount: 6, angle: 120, spread: 70, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  confetti({ particleCount: 140, spread: 100, startVelocity: 45, origin: { y: 0.55 }, colors });
  frame();
}
