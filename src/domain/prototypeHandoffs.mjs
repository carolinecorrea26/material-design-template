const pages = ['health-qd', 'docusign'];
const screenKeys = new Set(['src', 'alt', 'placeholder']);
const nonempty = value => typeof value === 'string' && !!value.trim();
function validScreen(screen) {
  if (!screen || typeof screen !== 'object' || Array.isArray(screen)) return false;
  if (Object.keys(screen).some(key => !screenKeys.has(key)) || !nonempty(screen.alt)) return false;
  if (screen.src !== undefined && (!nonempty(screen.src) || !screen.src.startsWith('/prototype/') || screen.src.split('/').includes('..'))) return false;
  if (screen.placeholder !== undefined && !nonempty(screen.placeholder)) return false;
  return !!(screen.src || screen.placeholder);
}
/** Validate authored global defaults or partial effective-Site image assignments. */
export function validatePrototypeHandoffs(value, partial = false) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || !partial && pages.some(page => !Object.hasOwn(value, page))
    || Object.entries(value).some(([page, screens]) => !pages.includes(page) || !Array.isArray(screens) || !screens.length || !screens.every(validScreen))) {
    throw new Error('Invalid prototype handoff screens');
  }
  return value;
}
