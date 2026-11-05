import type { CoverageCategoryId } from "./coverage";
import type { ApplicationFormValues } from "../app/ApplicationFormContext";

export type CategoryEligibilityPolicy = { version: 1; fieldId: string; allowedByAnswer: Record<string, CoverageCategoryId[]> };
export function isCategoryEligibilityPolicy(value: unknown): value is CategoryEligibilityPolicy {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const policy = value as CategoryEligibilityPolicy;
  return policy.version === 1 && typeof policy.fieldId === "string" && !!policy.fieldId.trim()
    && !!policy.allowedByAnswer && typeof policy.allowedByAnswer === "object" && !Array.isArray(policy.allowedByAnswer)
    && Object.entries(policy.allowedByAnswer).length > 0 && Object.entries(policy.allowedByAnswer).every(([answer, categories]) => !!answer.trim()
      && Array.isArray(categories) && categories.length > 0 && new Set(categories).size === categories.length && categories.every(category => ["LI", "AD", "DI", "OO", "SH"].includes(category)));
}
export function readCategoryEligibilityPolicy(policies: readonly { value: unknown }[]): CategoryEligibilityPolicy | null {
  if (!policies.length) return null;
  if (policies.length !== 1 || !isCategoryEligibilityPolicy(policies[0].value)) throw new Error("No unique valid category eligibility policy");
  return policies[0].value;
}
export function categoryEligibility(policy: CategoryEligibilityPolicy | null, answer: unknown, category: string, deferUnanswered = false): "eligible" | "ineligible" | "needs-information" {
  if (!policy) return "eligible";
  if (answer === undefined || answer === null || answer === "") return deferUnanswered ? "eligible" : "needs-information";
  return typeof answer === "string" && Object.hasOwn(policy.allowedByAnswer, answer) && policy.allowedByAnswer[answer].some(id => id === category) ? "eligible" : "ineligible";
}

/** Remove elections invalidated by an answered Site category policy. Historical snapshots without a policy retain their behavior. */
export function reconcileCategoryElections(policy: CategoryEligibilityPolicy | null, values: Record<string, unknown>, products: readonly { id: string; categoryId: string }[]): ApplicationFormValues | null {
  if (!policy || values[policy.fieldId] === undefined || values[policy.fieldId] === "") return null;
  const rejected = new Set(products.filter(product => categoryEligibility(policy, values[policy.fieldId], product.categoryId) === "ineligible").map(product => product.id));
  const selected = Array.isArray(values.coverageSelections) ? values.coverageSelections.map(String) : [];
  const chips = Array.isArray(values.selectedCategoryChips) ? values.selectedCategoryChips.map(String) : [];
  if (!selected.some(id => rejected.has(String(id))) && !chips.some(id => categoryEligibility(policy, values[policy.fieldId], String(id)) === "ineligible")) return null;
  const patch: ApplicationFormValues = { coverageSelections: selected.filter(id => !rejected.has(String(id))), selectedCategoryChips: chips.filter(id => categoryEligibility(policy, values[policy.fieldId], String(id)) === "eligible") };
  for (const key of ["productApplicants", "coverageAmounts", "coverageRiders", "coverageRiderAmounts", "coverageRiderOnly", "coverageWaitingPeriods", "coverageMaxBenefitPeriods"]) {
    const entries = values[key];
    if (entries && typeof entries === "object" && !Array.isArray(entries)) patch[key] = Object.fromEntries(Object.entries(entries).filter(([entry]) => ![...rejected].some(id => entry === id || entry.startsWith(`${id}:`))));
  }
  return patch;
}
