export type UpdateCheckResult = 'found' | 'current' | 'unsupported';

/**
 * Asks the service worker to re-fetch its script. When a newer build exists the
 * registration reports `updatefound` (or already has one waiting), and
 * ReloadPrompt's banner takes over to offer the actual reload.
 */
export async function checkForUpdate(): Promise<UpdateCheckResult> {
  if (!('serviceWorker' in navigator)) return 'unsupported';

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return 'unsupported';

  // A worker already staged from an earlier check still counts as an update.
  if (registration.waiting) return 'found';

  let found = false;
  const onUpdateFound = () => {
    found = true;
  };
  registration.addEventListener('updatefound', onUpdateFound);
  try {
    await registration.update();
  } catch {
    return 'current';
  } finally {
    registration.removeEventListener('updatefound', onUpdateFound);
  }

  return found || registration.waiting ? 'found' : 'current';
}

export function formatBuildTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
