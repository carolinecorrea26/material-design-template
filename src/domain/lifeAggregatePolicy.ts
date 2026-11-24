import type { EffectiveSite } from './effectiveSite';

const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const number = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(v => typeof v === "string" && v.length > 0) && new Set(value).size === value.length;
export type LifeAggregatePolicy = { version: 1; groups: { key: string; applicantKeys: string[]; productKeys: string[]; maximum: number }[] };
/** Approval/provisional metadata does not change the effective application rule. */
export function resolveLifeAggregateParticipation(site: EffectiveSite): 'configured' | 'individual-only' | 'unresolved' {
  const rows = site.configuration.lifeAggregateParticipation;
  if (!rows.length) return 'configured'; // The aggregate validator requires an actual configured limit.
  if (rows.length !== 1 || !object(rows[0].value)) return 'unresolved';
  const policy = rows[0].value;
  if (policy.version !== 1 || typeof policy.provisional !== 'boolean' || !['configured', 'individual-only'].includes(String(policy.mode))) return 'unresolved';
  if (policy.mode === 'configured') return 'configured';
  if (site.configuration.lifeAggregates.length || site.configuration.products.some(product => product.limits.some(limit => limit.value.categoryKey === 'LI' && limit.value.productKey === null))) return 'unresolved';
  return 'individual-only';
}
export function isLifeAggregatePolicy(value: unknown): value is LifeAggregatePolicy {
  if (!object(value) || value.version !== 1 || !Array.isArray(value.groups) || !value.groups.length) return false;
  const seen = new Set<string>();
  for (const group of value.groups) {
    if (!object(group) || typeof group.key !== "string" || !group.key || seen.has(group.key) || !strings(group.applicantKeys) || !group.applicantKeys.length || !strings(group.productKeys) || !group.productKeys.length || !number(group.maximum) || group.maximum <= 0) return false;
    seen.add(group.key);
  }
  return true;
}
