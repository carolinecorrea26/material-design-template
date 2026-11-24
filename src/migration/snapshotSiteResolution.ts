import { resolveSnapshotSite, type EffectiveSite, type EffectiveSiteData } from '../domain/effectiveSite';

let resolution: WeakMap<object, Map<string, EffectiveSite>> | undefined;
/** One immutable captured projection per Site within a synchronous audit. A new
 * report always re-resolves edited inputs; no cache survives the audit boundary. */
export function withSnapshotSiteResolution<T>(audit: () => T): T {
  const previous = resolution;
  resolution = new WeakMap();
  try { return audit(); } finally { resolution = previous; }
}
function freeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) freeze(child);
  }
  return value;
}
export function resolveAuditSnapshotSite(data: EffectiveSiteData, siteKey: string): EffectiveSite {
  if (!resolution) return resolveSnapshotSite(data, siteKey);
  if (!resolution.has(data)) resolution.set(data, new Map());
  const sites = resolution.get(data)!;
  if (!sites.has(siteKey)) sites.set(siteKey, freeze(resolveSnapshotSite(data, siteKey)));
  return sites.get(siteKey)!;
}
