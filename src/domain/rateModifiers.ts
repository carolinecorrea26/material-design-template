export type RateModifierPolicy = { version: 1; rules: Array<{ key: string; when: { membership?: boolean; jurisdictions?: string[]; method?: string; frequency?: string }; effect: { kind: "multiply" | "annual-fee"; value: number }; sourceReferences: string[] }>; provisional: boolean; revisit: string[] };
export function applyRateModifiers(policy: RateModifierPolicy, annualPremium: number, facts: { membership?: boolean; jurisdiction?: string; method: string; frequency: string }) {
  if (policy.version !== 1 || !Number.isFinite(annualPremium) || annualPremium < 0) return { allowed: false, annualPremium: null, missing: [] as string[], applied: [] as string[] };
  let total = annualPremium;
  const missing: string[] = [], applied: string[] = [];
  for (const rule of policy.rules) {
    if (!Number.isFinite(rule.effect.value) || rule.effect.value < 0 || !["multiply", "annual-fee"].includes(rule.effect.kind)) return { allowed: false, annualPremium: null, missing, applied };
    if (rule.when.membership !== undefined && facts.membership === undefined) { missing.push("membership"); continue; }
    if (rule.when.jurisdictions && !facts.jurisdiction) { missing.push("jurisdiction"); continue; }
    if (rule.when.membership !== undefined && rule.when.membership !== facts.membership || rule.when.jurisdictions && !rule.when.jurisdictions.includes(facts.jurisdiction!.replace(/^US-/, "")) || rule.when.method && rule.when.method !== facts.method || rule.when.frequency && rule.when.frequency !== facts.frequency) continue;
    total = rule.effect.kind === "multiply" ? total * rule.effect.value : total + rule.effect.value;
    applied.push(rule.key);
  }
  return { allowed: !missing.length && Number.isFinite(total), annualPremium: missing.length ? null : total, missing: [...new Set(missing)], applied };
}
export function isRateModifierPolicy(value: unknown): value is RateModifierPolicy {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const policy = value as RateModifierPolicy;
  return policy.version === 1 && typeof policy.provisional === "boolean" && Array.isArray(policy.revisit) && policy.revisit.every(reference => typeof reference === "string") && Array.isArray(policy.rules) && new Set(policy.rules.map(rule => rule?.key)).size === policy.rules.length && policy.rules.every(rule => rule && typeof rule.key === "string" && rule.when && typeof rule.when === "object" && (!rule.when.jurisdictions || Array.isArray(rule.when.jurisdictions) && rule.when.jurisdictions.every(code => typeof code === "string" && /^[A-Z]{2}$/.test(code))) && (rule.when.membership === undefined || typeof rule.when.membership === "boolean") && (rule.when.method === undefined || ["bank-account", "credit-card", "bill-me"].includes(rule.when.method)) && (rule.when.frequency === undefined || ["monthly", "quarterly", "semiannual", "annual"].includes(rule.when.frequency)) && rule.effect && ["multiply", "annual-fee"].includes(rule.effect.kind) && Number.isFinite(rule.effect.value) && rule.effect.value >= 0 && Array.isArray(rule.sourceReferences) && rule.sourceReferences.every(reference => typeof reference === "string"));
}
