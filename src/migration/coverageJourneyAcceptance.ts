import { completeSourceHealthFixture } from "./sourceQuestionnaireFixture";
import type { EffectiveSite } from "../domain/effectiveSite";
import { activeSiteMigrationScope } from "./activeSiteScope";
import { resolveCoverageJourneyPolicy } from "../domain/coverageJourneyPolicy";
import { evaluateCoverageJourney, type CoverageJourneyInput } from "../domain/coverageJourney";
import { createMockPolicyVerificationService } from "../domain/policyVerification";
import { isBenefitPolicy } from "../domain/benefitPolicy";

export async function runCoverageJourneyAcceptance(resolveSite: (siteKey: string) => EffectiveSite) {
  const policies = createMockPolicyVerificationService([]);
  const failures: unknown[] = [];
  let tested = 0;
  for (const scope of activeSiteMigrationScope.sites) {
    const site = resolveSite(scope.key);
    for (const product of site.configuration.products) {
      const policy = resolveCoverageJourneyPolicy(site, product.productKey)!;
      const mapping = policy.mappings.find(m => m.when.applicantKey === "member" && m.when.mode === "new")!;
      const applicant = site.products.find(p => p.productKey === product.productKey)!.applicants.find(a => a.applicantKey === "member")!;
      const c = applicant.constraints!.value;
      const benefit = product.benefitPolicies.length && isBenefitPolicy(product.benefitPolicies[0].value) ? product.benefitPolicies[0].value : null;
      const b = benefit?.applicants.find(a => a.applicantKey === "member" && a.applicantClass === mapping.when.applicantClass);
      const a = product.amounts.find(a => a.value.applicantTypeKey === "member" && (!a.value.applicantClass || a.value.applicantClass === mapping.when.applicantClass)) ?? product.amounts.find(a => a.value.applicantTypeKey === null);
      const candidate = b?.minimum ?? a?.amount?.bands[0]?.value.minimum ?? a?.amount?.pattern.value.minimum ?? Number(a?.amount?.options[0]?.value.value);
      const amount = candidate === 0 ? a?.amount?.bands[0]?.value.increment ?? 1 : candidate;
      const q = policy.questions.find(q => q.applicantKey === "member" && q.modes.includes("new"))!;
      const fields = site.configuration.pages.flatMap(p => p.fields).filter(f => f.included && (q.financialFields.includes(f.key) || q.tobaccoFields.includes(f.key) || q.healthPage && f.key.startsWith(`${q.healthPage}-q`) && !f.key.endsWith("-spouse")));
      const answers = Object.fromEntries(fields.map(f => [f.key, f.definition.options?.find(o => o.value === "no")?.value ?? f.definition.options?.[0]?.value ?? (f.definition.inputType === "number" ? 1000000 : "mock-answer")]));
      const residency = product.residencyPolicies[0].value as { allowedJurisdictions: string[] };
      const input: CoverageJourneyInput = {
        ...mapping.when, productKey: product.productKey, amount, membershipConfirmed: true,
        eligibility: { ageYears: Math.max(c.minimumAgeYears ?? 18, Math.min(40, c.maximumAgeYears ?? 64)), workHoursPerWeek: 40, firmMemberCount: 3, activeMilitary: false, activelyAtWork: true, membershipType: "physician", fullTimeStudent: true, unmarried: true, selectedPlans: [{ productKey: product.productKey, categoryKey: product.catalog!.value.categoryKey, applicantKey: "member" }] },
        jurisdiction: residency.allowedJurisdictions[0], election: { riders: [], riderAmounts: {} },
        benefit: { monthlyIncome: 1000000, existingMonthlyBenefit: 0, memberCoverage: true, memberRequestedBenefit: 1000000, memberTotalMonthlyBenefit: 1000000, selfEmployed: false, selfEmployedYears: 10, retirement: false, monthlyLoanPayment: 1000000, eligibleMonthlyExpenses: 1000000, eligibleExpenseFraction: 1, selectedProducts: [product.productKey], otherMonthlyBenefits: Object.fromEntries((benefit?.aggregate?.productKeys ?? []).filter(k => k !== product.productKey).map(k => [k, 0])) },
        answers, attestations: [q.attestationKey],
        payment: policy.payment.defaultMethod && policy.payment.defaultFrequency ? { method: policy.payment.defaultMethod, frequency: policy.payment.defaultFrequency } : undefined,
        dependentElections: Object.fromEntries(policy.dependentElections.map(e => [e.key, { selected: false }])),
      };
      input.answers = completeSourceHealthFixture(site, input);
      const result = await evaluateCoverageJourney(site, input, { policies, existingLifeAmount: 0 });
      tested++;
      if (!result.allowed) failures.push({ site: site.siteKey, product: product.productKey, amount, errors: result.errors, missing: result.missingFacts });
      if (result.allowed) {
        if (result.submission?.productKey !== product.productKey || result.submission?.questions && "bank-account-number" in result.submission.questions) failures.push({ site: site.siteKey, product: product.productKey, error: "Invalid submission envelope" });
        for (const invalid of [{ jurisdiction: undefined }, { amount: -1 }, { attestations: [] }]) if ((await evaluateCoverageJourney(site, { ...input, ...invalid }, { policies, existingLifeAmount: 0 })).allowed) failures.push({ site: site.siteKey, product: product.productKey, error: "Accepted incomplete/invalid application", invalid });
      }
    }
  }
  return { tested, failures };
}
