import type { EffectiveSite } from "./effectiveSite";
import { isCoverageJourneyPolicy } from "./coverageJourneyPolicy";

/** References reusable structured amount patterns; no competing amount numbers
 * are stored in this association assignment. */
export type AssociationAmountPolicy = { version: 1; associationKey?: string; associationKeys?: string[]; amounts: Array<{ applicantKey: "member" | "spouse" | "child"; amountPatternKey: string }> };
export function isAssociationAmountPolicy(value: unknown): value is AssociationAmountPolicy {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const policy = value as AssociationAmountPolicy;
  const single = typeof policy.associationKey === "string" && !!policy.associationKey.trim() && policy.associationKeys === undefined;
  const multiple = policy.associationKey === undefined && Array.isArray(policy.associationKeys) && policy.associationKeys.length > 0 && policy.associationKeys.every(key => typeof key === "string" && !!key.trim()) && new Set(policy.associationKeys).size === policy.associationKeys.length;
  return policy.version === 1 && (single || multiple) && Array.isArray(policy.amounts) && policy.amounts.length > 0 && policy.amounts.every(row => row && ["member", "spouse", "child"].includes(row.applicantKey) && typeof row.amountPatternKey === "string" && !!row.amountPatternKey.trim()) && new Set(policy.amounts.map(row => row.applicantKey)).size === policy.amounts.length;
}
export function associationAmountKeys(policy: AssociationAmountPolicy): string[] { return policy.associationKeys ?? (policy.associationKey ? [policy.associationKey] : []); }
export function resolveAssociationAmounts(site: EffectiveSite, productKey: string, associationKey?: string) {
  return resolveConfiguredAssociationAmounts(site.configuration, productKey, associationKey);
}
export function resolveConfiguredAssociationAmounts(configuration: EffectiveSite["configuration"], productKey: string, associationKey?: string) {
  const product = configuration.products.find(product => product.productKey === productKey);
  const empty = { rules: [] as NonNullable<typeof product>["amounts"], overridden: false };
  if (!product) return { ...empty, status: "unresolved" as const, reason: "Product is unavailable" };
  if (!product.associationAmounts.length) return { rules: product.amounts, overridden: false, status: "resolved" as const };
  const journeys = product.journeyPolicies;
  const journey = journeys.length === 1 && isCoverageJourneyPolicy(journeys[0].value) ? journeys[0].value : null;
  const policies = product.associationAmounts;
  if (!journey || policies.some(policy => {
    const value = policy.value;
    return !isAssociationAmountPolicy(value) || associationAmountKeys(value).some(key => !journey.associationChoices.some(choice => choice.key === key));
  }) || new Set(policies.flatMap(policy => associationAmountKeys(policy.value as AssociationAmountPolicy))).size !== policies.flatMap(policy => associationAmountKeys(policy.value as AssociationAmountPolicy)).length) return { ...empty, status: "unresolved" as const, reason: "Association amount assignment is invalid or ambiguous" };
  if (!associationKey) return { ...empty, status: "needs-information" as const, reason: "Association is required to determine coverage amounts" };
  if (!journey.associationChoices.some(choice => choice.key === associationKey)) return { ...empty, status: "unresolved" as const, reason: "Association is unavailable for this product" };
  const selected = policies.find(policy => associationAmountKeys(policy.value as AssociationAmountPolicy).includes(associationKey));
  if (!selected) return { rules: product.amounts, overridden: false, status: "resolved" as const };
  if (!selected.amounts.length || selected.amounts.some(rule => rule.status !== "resolved" || rule.amount?.status !== "resolved")) return { ...empty, status: "unresolved" as const, reason: "Association amount pattern is unavailable or invalid" };
  const applicants = new Set<string | null>(selected.amounts.map(rule => rule.value.applicantTypeKey));
  return { rules: [...product.amounts.filter(rule => !applicants.has(rule.value.applicantTypeKey)), ...selected.amounts], overridden: true, status: "resolved" as const };
}
