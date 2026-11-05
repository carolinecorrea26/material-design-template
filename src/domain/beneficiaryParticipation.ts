import type { EffectiveSite } from "./effectiveSite";

export type BeneficiaryParticipationPolicy = { version: 1; rules: Array<{ productKey: string; applicantKey: "member" | "spouse"; associationKeys?: string[]; collect: boolean }> };
export function isBeneficiaryParticipationPolicy(value: unknown): value is BeneficiaryParticipationPolicy {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const policy = value as BeneficiaryParticipationPolicy;
  if (policy.version !== 1 || !Array.isArray(policy.rules) || !policy.rules.length) return false;
  const valid = policy.rules.every(rule => rule && typeof rule.productKey === "string" && rule.productKey.trim() && ["member", "spouse"].includes(rule.applicantKey) && typeof rule.collect === "boolean" &&
    (rule.associationKeys === undefined || Array.isArray(rule.associationKeys) && rule.associationKeys.length > 0 && rule.associationKeys.every(key => typeof key === "string" && key.trim()) && new Set(rule.associationKeys).size === rule.associationKeys.length));
  return valid && policy.rules.every((rule, index) => policy.rules.slice(index + 1).every(other => rule.productKey !== other.productKey || rule.applicantKey !== other.applicantKey || rule.associationKeys !== undefined && other.associationKeys !== undefined && !rule.associationKeys.some(key => other.associationKeys!.includes(key))));
}

/** Product/applicant rules are independent of note wording and health routing. */
export function collectsBeneficiaries(site: EffectiveSite | undefined, productKey: string, categoryKey: string, applicantKey: string, associationKey?: string, fallback = ["LI", "AD"].includes(categoryKey)): boolean {
  if (!["member", "spouse"].includes(applicantKey)) return false;
  const policies = site?.configuration.beneficiaryParticipationPolicies ?? [];
  if (!policies.length) return fallback;
  if (policies.length !== 1 || !isBeneficiaryParticipationPolicy(policies[0].value)) throw new Error("No unique valid beneficiary participation policy");
  const candidates = policies[0].value.rules.filter(rule => rule.productKey === productKey && rule.applicantKey === applicantKey);
  const rule = candidates.find(rule => rule.associationKeys === undefined || associationKey !== undefined && rule.associationKeys.includes(associationKey));
  // Missing Association cannot accidentally enable a product with scoped rules.
  if (candidates.length && candidates.every(rule => rule.associationKeys !== undefined) && !associationKey) return false;
  return rule?.collect ?? fallback;
}
