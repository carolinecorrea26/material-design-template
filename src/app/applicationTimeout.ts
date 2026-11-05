import { applicationSessionPolicy } from '../config/applicationSessionPolicy';

export const applicationTimeoutKey = (site: string) => `applicationSessionDeadline:${site}`;
export const timeoutMilliseconds = applicationSessionPolicy.inactivityMinutes * 60_000;
export const warningMilliseconds = applicationSessionPolicy.warningMinutes * 60_000;
export function resetApplicationTimeout(site: string) { sessionStorage.removeItem(applicationTimeoutKey(site)); }
export function isApplicationSessionExpired(site: string, now = Date.now()) {
  const deadline = Number(sessionStorage.getItem(applicationTimeoutKey(site)));
  return Number.isFinite(deadline) && deadline > 0 && deadline <= now;
}

/** Persist the deadline across routes and reloads. Background timer throttling cannot extend it. */
export function readApplicationDeadline(site: string, now = Date.now()) {
  const key = applicationTimeoutKey(site);
  const saved = Number(sessionStorage.getItem(key));
  if (Number.isFinite(saved) && saved > 0) return saved;
  const deadline = now + timeoutMilliseconds;
  sessionStorage.setItem(key, String(deadline));
  return deadline;
}
