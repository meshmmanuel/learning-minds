const cache = new Map<string, HTMLAudioElement>();

const TAP_SOUND = 'select_001';

/**
 * Module-level mirror of the parent's sound preferences. Audio fires from a
 * dozen call sites with no access to React context, so the provider syncs these
 * on change rather than every caller reading settings.
 */
let tapSoundsEnabled = true;
let gameSoundsEnabled = true;

export function setSoundPreferences(prefs: { tap: boolean; game: boolean }) {
  tapSoundsEnabled = prefs.tap;
  gameSoundsEnabled = prefs.game;
}

function play(name: string) {
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

/** UI feedback on taps — the noisiest category, muted separately. */
export function playTap() {
  if (!tapSoundsEnabled) return;
  play(TAP_SOUND);
}

/** Answer, reward and celebration sounds. */
export function playSound(name: string) {
  if (!gameSoundsEnabled) return;
  play(name);
}
