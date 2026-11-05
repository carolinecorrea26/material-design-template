import { completeSourceHealthFixture } from "./sourceQuestionnaireFixture";
import { type EffectiveSite } from "../domain/effectiveSite";
import { activeSiteMigrationScope } from "./activeSiteScope";
import { resolveCoverageJourneyPolicy, type MappingDimensions } from "../domain/coverageJourneyPolicy";
import { evaluateCoverageJourney, type CoverageJourneyInput } from "../domain/coverageJourney";
import { isBenefitPolicy } from "../domain/benefitPolicy";
import { isDependentPolicy } from "../domain/dependentPolicy";
import { isSelectionPolicy, reconcileCoverageSelection } from "../domain/coverageSelectionPolicy";
import { createMockPolicyVerificationService, type VerifiedPolicy } from "../domain/policyVerification";
import { resolveAssociationAmounts } from "../domain/associationAmountPolicy";
import { isAssociationEligibilityPolicy } from "../domain/associationEligibilityPolicy";

// Synthetic applicant facts exercise stored working rules, without claiming source
// approval. Every mapping is evaluated, rather than merely checking its presence.
export function createCoverageJourneyFixture(site: EffectiveSite, productKey: string, dimensions: MappingDimensions) {
  const product = site.configuration.products.find(p => p.productKey === productKey)!;
  const policy = resolveCoverageJourneyPolicy(site, productKey)!;
  const selection = product.selectionPolicies[0].value;
  if (!isSelectionPolicy(selection)) throw new Error("Invalid selection policy");
  const base = site.products.find(p => p.productKey === productKey)!.applicants.find(a => a.applicantKey === dimensions.applicantKey)!.constraints!.value;
  const associationEligibility = product.associationEligibilityPolicies[0]?.value;
  const age = isAssociationEligibilityPolicy(associationEligibility) ? associationEligibility.rules.find(rule => rule.associationKey === dimensions.associationKey && rule.applicantKey === dimensions.applicantKey) : undefined;
  const c = age?.ageBounds === "replace" ? { ...base, minimumAgeYears: age.minimumAgeYears ?? 0, maximumAgeYears: age.maximumAgeYears! } : base;
  const assignedAmounts = resolveAssociationAmounts(site, productKey, dimensions.associationKey);
  if (assignedAmounts.status !== "resolved") throw new Error("Incomplete amount assignment in acceptance fixture");
  const benefit = isBenefitPolicy(product.benefitPolicies[0]?.value) ? product.benefitPolicies[0].value : null;
  const b = benefit?.applicants.find(a => a.applicantKey === dimensions.applicantKey && a.applicantClass === dimensions.applicantClass);
  const ageYears = Math.max(c.minimumAgeYears ?? 0, b?.ageBands?.[0]?.minimumAge ?? 0, Math.min(dimensions.applicantKey === "child" ? 10 : 35, c.maximumAgeYears ?? 64));
  const numeric = (applicantKey: string) => {
    const a = assignedAmounts.rules.find(a => a.value.applicantTypeKey === applicantKey && a.value.applicantClass === (dimensions.applicantClass ?? null)) ?? assignedAmounts.rules.find(a => a.value.applicantTypeKey === applicantKey && a.value.applicantClass === null) ?? assignedAmounts.rules.find(a => a.value.applicantTypeKey === null);
    const minimum = a?.amount?.bands[0]?.value.minimum ?? a?.amount?.pattern.value.minimum ?? Number(a?.amount?.options[0]?.value.value);
    return minimum === 0 ? a?.amount?.bands[0]?.value.increment ?? 1 : minimum;
  };
  const memberAmount = numeric("member") || 100000;
  let amount = b?.minimum ?? numeric(dimensions.applicantKey);
  const dependent = isDependentPolicy(product.dependentPolicies[0]?.value) ? product.dependentPolicies[0].value.rules.find(r => r.applicantKey === dimensions.applicantKey) : null;
  if (dependent?.derived) amount = memberAmount * dependent.derived.multiplier;
  if (selection.childSchedule && dimensions.applicantKey === "child") amount = Math.min(selection.childSchedule.bands.find(b => ageYears * 365 >= b.minimumAgeDays && ageYears * 365 <= b.maximumAgeDays)!.amount, memberAmount * selection.childSchedule.memberMaximumFraction);
  const residency = product.residencyPolicies[0].value as { allowedJurisdictions: string[]; associationAllowedJurisdictions?: Record<string, string[]> };
  const jurisdictions = dimensions.associationKey ? residency.associationAllowedJurisdictions?.[dimensions.associationKey] ?? residency.allowedJurisdictions : residency.allowedJurisdictions;
  const rider = selection.riders.find(r => !r.included && r.applicants.includes(dimensions.applicantKey));
  const existingAmount = dimensions.mode === "rider-only" ? Math.max(100000, rider?.minimumBase ?? 0) : Math.max(1, amount / 2);
  if (dimensions.mode === "rider-only") amount = 0;
  const jurisdiction = jurisdictions.find(j => !rider?.excludedJurisdictions.includes(j))!;
  const q = policy.questions.find(q => q.applicantKey === dimensions.applicantKey && q.modes.includes(dimensions.mode))!;
  const answers = Object.fromEntries(site.configuration.pages.flatMap(p => p.fields).filter(f => f.included).map(f => [f.key, f.definition.options?.find(o => o.value === "no")?.value ?? f.definition.options?.[0]?.value ?? (["number", "percent"].includes(f.definition.inputType) ? 1000000 : f.definition.inputType === "checkbox" ? false : "mock-answer")]));
  const input: CoverageJourneyInput = {
    ...dimensions, productKey, amount, membershipConfirmed: true, jurisdiction,
    eligibility: { ageYears, ageDays: ageYears * 365, workHoursPerWeek: 40, firmMemberCount: 3, activeMilitary: false, activelyAtWork: true, associationMember: false, membershipType: "physician", fullTimeStudent: true, unmarried: true, selectedPlans: [{ productKey, categoryKey: product.catalog!.value.categoryKey, applicantKey: "member" }] },
    benefit: { monthlyIncome: 1000000, existingMonthlyBenefit: 0, memberCoverage: true, memberRequestedBenefit: 1000000, memberTotalMonthlyBenefit: 1000000, selfEmployed: false, retirement: false, monthlyLoanPayment: 1000000, eligibleMonthlyExpenses: 1000000, eligibleExpenseFraction: 1, selectedProducts: [productKey], otherMonthlyBenefits: Object.fromEntries((benefit?.aggregate?.productKeys ?? []).filter(k => k !== productKey).map(k => [k, 0])) },
    dependent: { baseAmounts: { member: memberAmount }, selectedApplicants: ["member"], coveredApplicants: ["member"], selectedProductKeys: [productKey] },
    memberAmount, spouseAmount: 0, election: { riders: dimensions.mode === "rider-only" && rider ? [rider.key] : [], riderAmounts: {} },
    answers, attestations: [q.attestationKey],
    payment: policy.payment.methods[0] ? { method: policy.payment.methods[0].method, frequency: policy.payment.methods[0].frequencies[0] } : undefined,
    existingPolicy: dimensions.mode === "new" ? undefined : { policyId: "mock-matrix-policy", ownerReference: "mock-owner" },
  };
  input.answers = completeSourceHealthFixture(site, input);
  const record: VerifiedPolicy = { policyId: "mock-matrix-policy", ownerReference: "mock-owner", siteKey: site.siteKey, productKey, applicantKey: dimensions.applicantKey, ...(dimensions.associationKey ? { associationKey: dimensions.associationKey } : {}), status: "active", amount: existingAmount, riders: [], permittedChanges: ["increase", "rider-only"], billing: { method: "bank-account", frequency: "monthly" }, effectiveDate: "2026-10-05", expiresAt: Date.UTC(2030, 0, 1) };
  // Determine locked/choice rider amounts from the persisted selection contract.
  input.election = reconcileCoverageSelection(selection, { mode: dimensions.mode, applicantKey: dimensions.applicantKey, baseAmount: amount, existingAmount, existingPolicyVerified: true, ageYears, jurisdiction, memberAmount, spouseAmount: 0, childAgeDays: ageYears * 365 }, input.election).election;
  return { input, policies: createMockPolicyVerificationService([record]) };
}

export async function runCoverageJourneyExceptionAcceptance(resolveSite: (siteKey: string) => EffectiveSite) {
  const failures = [];
  let tested = 0;
  for (const scope of activeSiteMigrationScope.sites) {
    const site = resolveSite(scope.key);
    for (const product of site.configuration.products) {
      for (const mapping of resolveCoverageJourneyPolicy(site, product.productKey)!.mappings) {
        const { input, policies } = createCoverageJourneyFixture(site, product.productKey, mapping.when);
        const result = await evaluateCoverageJourney(site, input, { policies, existingLifeAmount: 0 });
        tested++;
        if (tested % 50 === 0) await new Promise(resolve => setTimeout(resolve, 0));
        if (!result.allowed) failures.push({ site: site.siteKey, product: product.productKey, dimensions: mapping.when, amount: input.amount, errors: result.errors, missing: result.missingFacts });
        if (result.allowed) {
          if (JSON.stringify(result.submission?.identifiers) !== JSON.stringify(mapping.identifiers) || result.submission?.applicantKey !== mapping.when.applicantKey) failures.push({ site: site.siteKey, product: product.productKey, dimensions: mapping.when, error: "Submission mapping mismatch" });
          const invalidInputs: Partial<CoverageJourneyInput>[] = [{ jurisdiction: undefined }, { attestations: [] }, { amount: -1 }, { eligibility: { ...input.eligibility, ageYears: 1000 } }];
          if (mapping.when.mode !== "new") invalidInputs.push({ existingPolicy: undefined });
          for (const dimension of ["associationKey", "applicantClass", "waitingPeriod", "benefitPeriod"] as const) if (mapping.when[dimension]) invalidInputs.push({ [dimension]: undefined }, { [dimension]: "mock-invalid" });
          for (const invalid of invalidInputs) {
            const rejected = await evaluateCoverageJourney(site, { ...input, ...invalid }, { policies, existingLifeAmount: 0 });
            if (rejected.allowed || rejected.submission !== null) failures.push({ site: site.siteKey, product: product.productKey, dimensions: mapping.when, acceptedInvalid: invalid });
          }
        }
      }
    }
  }
  return { tested, failures };
}
