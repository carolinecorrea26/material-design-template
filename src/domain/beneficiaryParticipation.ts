import { BENEFICIARY_INFO_OPT_IN_FIELD_ID } from '../config/fields/beneficiaryFields';
import configurationDefinitions from "../../requirements/global/configurations/beneficiary.json";
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
export function collectsBeneficiaries(site: EffectiveSite | undefined, productKey: string, categoryKey: string, applicantKey: string, associationKey?: string): boolean {
  if (!["member", "spouse"].includes(applicantKey)) return false;
  const configured = site?.configuration.configurations.find(row => row.key === "requirements.beneficiaryPolicy.categoryIds")?.value
    ?? configurationDefinitions.configurations.find(row => row.id === "beneficiary-categories")!.default;
  if (!Array.isArray(configured) || configured.some(value => typeof value !== "string")) throw new Error("Invalid beneficiary category configuration");
  const defaultParticipation = configured.includes(categoryKey);
  const policies = site?.configuration.beneficiaryParticipationPolicies ?? [];
  if (!policies.length) return defaultParticipation;
  if (policies.length !== 1 || !isBeneficiaryParticipationPolicy(policies[0].value)) throw new Error("No unique valid beneficiary participation policy");
  const candidates = policies[0].value.rules.filter(rule => rule.productKey === productKey && rule.applicantKey === applicantKey);
  const rule = candidates.find(rule => rule.associationKeys === undefined || associationKey !== undefined && rule.associationKeys.includes(associationKey));
  // Missing Association cannot accidentally enable a product with scoped rules.
  if (candidates.length && candidates.every(rule => rule.associationKeys !== undefined) && !associationKey) return false;
  return rule?.collect ?? defaultParticipation;
}

export function beneficiaryQuestionsEnabled(requirement: 'required' | 'optional' | 'none', values: Record<string, unknown>): boolean {
  return requirement !== 'none' && (requirement !== 'optional' || values[BENEFICIARY_INFO_OPT_IN_FIELD_ID] === 'yes');
}
