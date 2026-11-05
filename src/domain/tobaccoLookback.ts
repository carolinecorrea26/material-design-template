/** Rating classification only; original health/tobacco answers are retained. */
export type TobaccoLookbackPolicy = { months: number; sourceReferences: string[]; associationOverrides?: Array<{ associationKeys: string[]; months: number; sourceReferences: string[] }> };
export function isTobaccoLookbackPolicy(value: unknown): value is TobaccoLookbackPolicy {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const policy = value as TobaccoLookbackPolicy;
  const months = (value: unknown) => typeof value === "number" && Number.isSafeInteger(value) && value > 0;
  const strings = (value: unknown): value is string[] => Array.isArray(value) && value.length > 0 && value.every(key => typeof key === "string" && !!key.trim());
  if (!months(policy.months) || !strings(policy.sourceReferences)) return false;
  if (policy.associationOverrides === undefined) return true;
  if (!Array.isArray(policy.associationOverrides) || !policy.associationOverrides.every(row => row && strings(row.associationKeys) && months(row.months) && strings(row.sourceReferences))) return false;
  const keys = policy.associationOverrides.flatMap(row => row.associationKeys);
  return new Set(keys).size === keys.length;
}

/** A missing, malformed or future date cannot establish a nonsmoker class.
 * Anniversary dates use calendar months, including end-of-month clamping. */
export function tobaccoRateAnswer(policy: TobaccoLookbackPolicy | undefined, answer: unknown, lastUsed: unknown, association: unknown, now = Date.now()): unknown {
  if (!policy || answer !== "yes" || typeof lastUsed !== "string" || !Number.isFinite(now)) return answer;
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(lastUsed);
  const us = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(lastUsed);
  if (!iso && !us) return answer;
  const [year, month, day] = iso ? [Number(iso[1]), Number(iso[2]), Number(iso[3])] : [Number(us![3]), Number(us![1]), Number(us![2])];
  const date = new Date(Date.UTC(year, month - 1, day));
  const today = new Date(now); today.setUTCHours(0, 0, 0, 0);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day || date > today) return answer;
  const months = policy.associationOverrides?.find(row => typeof association === "string" && row.associationKeys.includes(association))?.months ?? policy.months;
  const anniversary = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(Date.UTC(anniversary.getUTCFullYear(), anniversary.getUTCMonth() + 1, 0)).getUTCDate();
  anniversary.setUTCDate(Math.min(day, lastDay));
  return anniversary <= today ? "no" : answer;
}
