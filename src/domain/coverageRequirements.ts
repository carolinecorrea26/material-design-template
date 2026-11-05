import { eligibilityFactSatisfied, eligibilityAgeMaximumSatisfied } from "./eligibilityFacts";
import type { CoverageApplicantId, CoverageDefinition, CoverageRequirements } from "./coverage";

export type ApplicantFacts = {
  ageYears?: number; ageDays?: number; honorablyDischargedServiceMember?: boolean; unmarried?: boolean; fullTimeStudent?: boolean;
  workHoursPerWeek?: number; averageMonthlyIncome?: number; activelyAtWork?: boolean; associationMember?: boolean; activeMilitary?: boolean;
  selfEmployed?: boolean; yearsSelfEmployed?: number;
  associationKey?: string; firmMemberCount?: number;
};
export type RequirementResult = "eligible" | "ineligible" | "needs-information";
/** Missing facts never silently establish eligibility. Ages are completed years/days. */
export function evaluateEligibility(requirements: CoverageRequirements | undefined, applicant: CoverageApplicantId, facts: ApplicantFacts): RequirementResult {
  const checks: Array<boolean | undefined> = [];
  for (const rule of requirements?.eligibility?.filter((r) => r.applicantType === applicant) ?? []) {
    if (rule.unmarried) checks.push(facts.unmarried);
    if (rule.minimumAgeDays !== undefined) checks.push(facts.ageDays === undefined ? undefined : facts.ageDays >= rule.minimumAgeDays);
    if (rule.minimumAgeYears !== undefined) checks.push(facts.ageYears === undefined ? undefined : facts.ageYears >= rule.minimumAgeYears);
    if (rule.maximumAgeYears !== undefined) {
      checks.push(rule.fullTimeStudentMaximumAgeYears !== undefined && facts.ageYears !== undefined && facts.ageYears > rule.maximumAgeYears && facts.ageYears <= rule.fullTimeStudentMaximumAgeYears ? facts.fullTimeStudent : eligibilityAgeMaximumSatisfied(facts.ageYears, rule.maximumAgeYears, rule.factRequirements ?? [], facts));
    }
    if (rule.minimumWorkHoursPerWeek !== undefined) checks.push(facts.workHoursPerWeek === undefined ? undefined : facts.workHoursPerWeek >= rule.minimumWorkHoursPerWeek);
    for (const requirement of rule.factRequirements ?? []) if (!("extendsMaximumAgeTo" in requirement)) checks.push(eligibilityFactSatisfied(requirement, facts[requirement.fact]));
  }
  return checks.includes(false) ? "ineligible" : checks.includes(undefined) ? "needs-information" : "eligible";
}

/** Caps are ordered first-match rules, matching the documented if/else precedence. */
export function resolveBenefitLimit(requirements: CoverageRequirements | undefined, applicant: CoverageApplicantId, facts: ApplicantFacts) {
  const rule = requirements?.benefitLimit;
  if (!rule || rule.applicantType !== applicant) return undefined;
  let cap: (typeof rule.caps)[number] | undefined;
  let complete = true;
  for (const candidate of rule.caps) {
    const { when } = candidate;
    const checks: Array<boolean | undefined> = [];
    if (when.minimumAgeYears !== undefined) checks.push(facts.ageYears === undefined ? undefined : facts.ageYears >= when.minimumAgeYears);
    if (when.maximumAgeYears !== undefined) checks.push(facts.ageYears === undefined ? undefined : facts.ageYears <= when.maximumAgeYears);
    if (when.selfEmployedLessThanYears !== undefined) checks.push(facts.selfEmployed === false ? false : facts.selfEmployed === undefined || facts.yearsSelfEmployed === undefined ? undefined : facts.yearsSelfEmployed < when.selfEmployedLessThanYears);
    if (checks.includes(false)) continue;
    if (checks.includes(undefined)) { complete = false; break; }
    cap = candidate; break;
  }
  const maximum = complete ? cap?.maximum ?? rule.defaultMaximum : undefined;
  return { maximum: facts.averageMonthlyIncome === undefined || maximum === undefined ? undefined : Math.min(facts.averageMonthlyIncome * rule.incomeFraction, maximum), applicableCap: maximum, requiredWaitingPeriod: cap?.requiredWaitingPeriod, requiredBenefitPeriod: cap?.requiredBenefitPeriod };
}

export function coverageRelationshipErrors(products: CoverageDefinition[], selections: Record<string, CoverageApplicantId[]>): string[] {
  const errors = new Set<string>();
  for (const product of products) {
    if (!selections[product.id]?.length) continue;
    for (const excluded of product.requirements?.exclusiveProducts ?? []) {
      if (selections[excluded]?.length) {
        const other = products.find(candidate => candidate.id === excluded);
        errors.add(`${product.name} and ${other?.name ?? excluded} cannot be selected together.`);
      }
    }
  }
  for (const product of products) for (const applicant of selections[product.id] ?? []) {
    for (const rule of product.requirements?.dependencies ?? []) {
      if (rule.applicantType === applicant && !products.some((candidate) => candidate.categoryId === rule.categoryId && (!rule.sameProduct || candidate.id === product.id) && selections[candidate.id]?.includes(rule.requiresApplicant))) errors.add(`${applicant} ${product.categoryId} coverage requires ${rule.requiresApplicant} ${rule.categoryId} coverage.`);
    }
    for (const rule of product.requirements?.maximumPlans ?? []) {
      if (rule.applicantType === applicant && products.filter((candidate) => candidate.categoryId === rule.categoryId && selections[candidate.id]?.includes(applicant)).length > rule.count) errors.add(`${applicant} may be covered under only ${rule.count} ${rule.categoryId} plan.`);
    }
  }
  return [...errors];
}

export function resolveUnderwritingBand(product: CoverageDefinition, applicantType: CoverageApplicantId, age: number, amount: number, applicantClassId?: string) {
  return product.underwritingBands?.find((band) => (!band.scope.applicantType || band.scope.applicantType === applicantType) && (!band.scope.applicantClassId || band.scope.applicantClassId === applicantClassId) && age >= band.minimumAgeYears && age <= band.maximumAgeYears && (band.minimumAmountExclusive ? amount > band.minimumAmount : amount >= band.minimumAmount) && amount <= band.maximumAmount);
}
