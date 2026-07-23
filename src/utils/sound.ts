const cache = new Map<string, HTMLAudioElement>();

const TAP_SOUND = 'select_001';

export function playTap() {
  playSound(TAP_SOUND);
}

export function playSound(name: string) {
  let audio = cache.get(name);
  if (!audio) {
    audio = new Audio(`/sounds/${name}.ogg`);
    cache.set(name, audio);
  } else {
    audio.currentTime = 0;
  }
  void audio.play().catch(() => {
    /* autoplay can be blocked before a user gesture — safe to ignore */
  });
}
