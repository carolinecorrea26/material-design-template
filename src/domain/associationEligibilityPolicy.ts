import type { EffectiveSite } from "./effectiveSite";
import type { ApplicantFacts, RequirementResult } from "./coverageRequirements";
import { resolveCoverageJourneyPolicy } from "./coverageJourneyPolicy";

/** Scoped bounds narrow the base by default. An explicit replacement replaces
 * only age bounds; work, participation and other facts retain their owners. */
export type AssociationEligibilityPolicy = { version: 1; rules: Array<{ associationKey: string; applicantKey: "member" | "spouse" | "child"; eligible: boolean; minimumAgeDays?: number; minimumAgeYears?: number; maximumAgeYears?: number; studentMaximumAgeYears?: number; ageBounds?: "replace"; }> };
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
export function isAssociationEligibilityPolicy(value: unknown): value is AssociationEligibilityPolicy {
  if (!object(value) || value.version !== 1 || !Array.isArray(value.rules) || !value.rules.length) return false;
  const seen = new Set<string>();
  return value.rules.every(rule => {
    if (!object(rule) || typeof rule.associationKey !== "string" || !rule.associationKey.trim() || !["member", "spouse", "child"].includes(String(rule.applicantKey)) || typeof rule.eligible !== "boolean") return false;
    const key = `${rule.associationKey}/${rule.applicantKey}`;
    if (seen.has(key)) return false;
    seen.add(key);
    for (const name of ["minimumAgeDays", "minimumAgeYears", "maximumAgeYears", "studentMaximumAgeYears"]) if (rule[name] !== undefined && (typeof rule[name] !== "number" || !Number.isInteger(rule[name]) || rule[name] < 0)) return false;
    return !(typeof rule.minimumAgeYears === "number" && typeof rule.maximumAgeYears === "number" && rule.minimumAgeYears > rule.maximumAgeYears) && (rule.studentMaximumAgeYears === undefined || typeof rule.maximumAgeYears === "number" && Number(rule.studentMaximumAgeYears) > rule.maximumAgeYears) && (rule.ageBounds === undefined || rule.ageBounds === "replace" && (rule.minimumAgeYears !== undefined || rule.minimumAgeDays !== undefined) && rule.maximumAgeYears !== undefined);
  });
}
export function resolveAssociationEligibility(site: EffectiveSite, productKey: string, applicantKey: string, facts: ApplicantFacts): { result: RequirementResult; reason?: string; invalid?: boolean; replacesAgeBounds?: boolean } {
  const policies = site.configuration.products.find(product => product.productKey === productKey)?.associationEligibilityPolicies ?? [];
  if (!policies.length) return { result: "eligible" };
  if (policies.length !== 1 || !isAssociationEligibilityPolicy(policies[0].value)) return { result: "ineligible", invalid: true, reason: "Association eligibility policy is invalid" };
  const journey = resolveCoverageJourneyPolicy(site, productKey);
  if (!journey || policies[0].value.rules.some(rule => !journey.associationChoices.some(choice => choice.key === rule.associationKey))) return { result: "ineligible", invalid: true, reason: "Association eligibility scope is unavailable" };
  if (!facts.associationKey) return { result: "needs-information", reason: "Association is required to determine eligibility" };
  if (!journey.associationChoices.some(choice => choice.key === facts.associationKey)) return { result: "ineligible", invalid: true, reason: "Association is unavailable for this product" };
  const rule = policies[0].value.rules.find(rule => rule.associationKey === facts.associationKey && rule.applicantKey === applicantKey);
  if (!rule) return { result: "eligible" };
  if (!rule.eligible) return { result: "ineligible" };
  const replacesAgeBounds = rule.ageBounds === "replace";
  if ((rule.minimumAgeYears !== undefined || rule.maximumAgeYears !== undefined) && (facts.ageYears === undefined || !Number.isInteger(facts.ageYears) || facts.ageYears < 0) || rule.minimumAgeDays !== undefined && (facts.ageDays === undefined || !Number.isInteger(facts.ageDays) || facts.ageDays < 0)) return { result: "needs-information", replacesAgeBounds };
  const exceedsOrdinaryAge = rule.maximumAgeYears !== undefined && facts.ageYears! > rule.maximumAgeYears;
  if (exceedsOrdinaryAge && rule.studentMaximumAgeYears !== undefined && facts.ageYears! <= rule.studentMaximumAgeYears && typeof facts.fullTimeStudent !== "boolean") return { result: "needs-information", replacesAgeBounds };
  const eligible = (rule.minimumAgeDays === undefined || facts.ageDays! >= rule.minimumAgeDays) && (rule.minimumAgeYears === undefined || facts.ageYears! >= rule.minimumAgeYears) && (!exceedsOrdinaryAge || rule.studentMaximumAgeYears !== undefined && facts.ageYears! <= rule.studentMaximumAgeYears && facts.fullTimeStudent === true);
  return { result: eligible ? "eligible" : "ineligible", replacesAgeBounds };
}
