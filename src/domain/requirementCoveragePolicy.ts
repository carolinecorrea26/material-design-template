import definitions from "../../requirements/global/configurations/coverage-policy.json";
import amountControls from "../../requirements/global/configurations/coverage-amount-controls.json";
import { parseCoverageAssignments, type CoverageAssignment } from "./requirementCoverageValidation.mjs";
import type { CoverageApplicantId, CoverageDefinition, CoverageRequirements } from "./coverage";
import type { ApplicantFacts, RequirementResult } from "./coverageRequirements";
import { numericFact } from "../utils/applicantFacts";
import { requirementText } from "./requirementContent";

export const coverageConfigurationDefinitions = [...definitions.configurations, ...amountControls.configurations];
export type { CoverageAssignment };
const documents = import.meta.glob("../../requirements/parked/sites/*/coverage.json", { eager: true });

/** Site values are separate from reusable definitions. The same projection feeds every surface. */
export function coverageRequirementAssignments(siteKey: string): CoverageAssignment[] {
  const module = documents[`../../requirements/parked/sites/${siteKey}/coverage.json`] as { default?: unknown } | undefined;
  return module ? parseCoverageAssignments(module.default ?? module, coverageConfigurationDefinitions, siteKey) : [];
}

export function coverageRequirementValue(product: CoverageDefinition, applicant: CoverageApplicantId, id: string) {
  return product.requirementPolicy?.find(row => row.configuration === id && row.applicants.includes(applicant))?.value;
}

type EligibilityBounds = Omit<NonNullable<CoverageRequirements["eligibility"]>[number], "applicantType" | "factRequirements">;
const eligibilityProperties: Record<string, keyof EligibilityBounds> = {
  "coverage-minimum-work-hours": "minimumWorkHoursPerWeek",
  "coverage-minimum-age-years": "minimumAgeYears",
  "coverage-maximum-age-years": "maximumAgeYears",
  "coverage-minimum-age-days": "minimumAgeDays",
  "coverage-student-maximum-age-years": "fullTimeStudentMaximumAgeYears",
};

/** Library columns and applicant products use the same eligibility projection. */
export function requirementCoverageEligibilityOverrides(assignments: CoverageAssignment[], product: string, applicant: CoverageApplicantId): EligibilityBounds {
  return Object.fromEntries(assignments.filter(row => row.product === product && row.applicants.includes(applicant) && eligibilityProperties[row.configuration])
    .map(row => [eligibilityProperties[row.configuration], row.value]));
}

export function applyRequirementCoveragePolicy(product: CoverageDefinition, assignments: CoverageAssignment[]): CoverageDefinition {
  const policy = assignments.filter(row => row.product === product.id);
  if (!policy.length) return product;
  const result = { ...product, requirementPolicy: policy, requirements: structuredClone(product.requirements ?? {}) };
  for (const row of policy) for (const applicant of row.applicants) {
    const property = eligibilityProperties[row.configuration];
    if (property) {
      const rules = result.requirements.eligibility ??= [];
      let rule = rules.find(rule => rule.applicantType === applicant);
      if (!rule) { rule = { applicantType: applicant }; rules.push(rule); }
      Object.assign(rule, requirementCoverageEligibilityOverrides(policy, product.id, applicant));
    }
    if (row.configuration === "coverage-child-requires-member" && row.value === true) {
      result.requirements.dependencies = [
        ...(result.requirements.dependencies ?? []).filter(rule => rule.applicantType !== applicant || rule.categoryId !== product.categoryId),
        { applicantType: applicant, requiresApplicant: "member", categoryId: product.categoryId, sameProduct: false },
      ];
    }
  }
  return result;
}

/** A single reviewed answer must not silently fall back to obsolete saved answers. */
export function requirementCoverageFacts(product: CoverageDefinition, facts: ApplicantFacts): ApplicantFacts {
  return coverageRequirementValue(product, "member", "coverage-self-employment-question") === "under-one-year"
    ? { ...facts, selfEmployed: undefined, yearsSelfEmployed: undefined }
    : { ...facts, selfEmployedUnderOneYear: undefined };
}

export function requirementCoverageEligibility(product: CoverageDefinition, applicant: CoverageApplicantId, facts: ApplicantFacts): RequirementResult {
  const minimum = coverageRequirementValue(product, applicant, "coverage-minimum-annual-income");
  if (typeof minimum !== "number") return "eligible";
  return facts.averageMonthlyIncome === undefined ? "needs-information" : facts.averageMonthlyIncome * 12 >= minimum ? "eligible" : "ineligible";
}

/** Filters normalized choices last, so legacy and normalized amount sources cannot bypass reviewed limits. */
export function requirementCoverageAmounts(product: CoverageDefinition, applicant: CoverageApplicantId, age: number | undefined, amounts: number[], mode: "new" | "increase" | "rider-only" = "new") {
  const minimum = coverageRequirementValue(product, applicant, "coverage-new-application-minimum-amount");
  const bands = product.requirementPolicy?.filter(row => row.configuration === "coverage-age-maximum-amount" && row.applicants.includes(applicant)) ?? [];
  if (bands.length && age === undefined) return [];
  const maximum = bands.find(row => age! >= row.minimumAgeYears! && age! <= row.maximumAgeYears!)?.value;
  return amounts.filter(amount => (mode !== "new" || typeof minimum !== "number" || amount >= minimum) && (typeof maximum !== "number" || amount <= maximum));
}

export function requirementCoverageResidencyMessage(product: CoverageDefinition, applicant: CoverageApplicantId, values: Record<string, unknown>) {
  const excluded = coverageRequirementValue(product, applicant, "coverage-excluded-states");
  const state = String(values["state-province"] ?? values.state ?? "").replace(/^US-/, "");
  return Array.isArray(excluded) && excluded.includes(state) ? "This coverage is not available in your state of residence." : undefined;
}

/** Called only by page submission validation. Selection and reveal do not run this joint-election check. */
export function requirementCoverageSubmitAlert(products: CoverageDefinition[], values: Record<string, unknown>) {
  const selected = Array.isArray(values.coverageSelections) ? values.coverageSelections : [];
  const people = values.productApplicants as Record<string, CoverageApplicantId[]> | undefined;
  const amounts = values.coverageAmounts as Record<string, unknown> | undefined;
  for (const product of products.filter(product => selected.includes(product.id))) {
    const minimum = coverageRequirementValue(product, "spouse", "coverage-member-benefit-submit-minimum");
    const member = numericFact(amounts?.[`${product.id}:member`]);
    const spouse = numericFact(amounts?.[`${product.id}:spouse`]);
    if (typeof minimum === "number" && people?.[product.id]?.includes("member") && people[product.id].includes("spouse") && member && spouse && member < minimum) {
      return requirementText("coverage.alert.joint-spouse-benefit", { minimum: `$${minimum.toLocaleString("en-US")}`, coverageName: product.name });
    }
  }
}
