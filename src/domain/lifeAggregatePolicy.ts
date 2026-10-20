const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const number = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(v => typeof v === "string" && v.length > 0) && new Set(value).size === value.length;
export type LifeAggregatePolicy = { version: 1; groups: { key: string; applicantKeys: string[]; productKeys: string[]; maximum: number }[] };
export function isLifeAggregatePolicy(value: unknown): value is LifeAggregatePolicy {
  if (!object(value) || value.version !== 1 || !Array.isArray(value.groups) || !value.groups.length) return false;
  const seen = new Set<string>();
  for (const group of value.groups) {
    if (!object(group) || typeof group.key !== "string" || !group.key || seen.has(group.key) || !strings(group.applicantKeys) || !group.applicantKeys.length || !strings(group.productKeys) || !group.productKeys.length || !number(group.maximum) || group.maximum <= 0) return false;
    seen.add(group.key);
  }
  return true;
}
