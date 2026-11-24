export const DEV_MODE_STORAGE_KEY = 'devtools:devMode';
/** Explicit URL choice wins; retained only for this browser tab. */
export function getIsDevMode() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('dev')) {
    const enabled = !['false', '0', 'off'].includes((params.get('dev') ?? '').toLowerCase());
    sessionStorage.setItem(DEV_MODE_STORAGE_KEY, String(enabled));
    return enabled;
  }
  return sessionStorage.getItem(DEV_MODE_STORAGE_KEY) === 'true';
}
