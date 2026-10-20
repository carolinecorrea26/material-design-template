import type { EffectiveSite } from "./effectiveSite";
import type { CoverageJourneyInput } from "./coverageJourney";
import { evaluateCoveragePortfolio } from "./coveragePortfolio";
import { verifyExistingPolicy, type PolicyLookup, type PolicyVerificationService } from "./policyVerification";
import { isBenefitPolicy } from "./benefitPolicy";
import { resolveCoverageJourneyPolicy } from "./coverageJourneyPolicy";

export type HouseholdPerson = { personKey: string; applicantKey: "member" | "spouse" | "child"; inputs: CoverageJourneyInput[]; existingLifeAmount?: number };
/** Captures actual people and selections, reconciles dependencies against the
 * captured household, and retains independent per-person limits for children.
 * In-force primary coverage outside the request must be a verified journey. */
export async function evaluateCoverageHousehold(site: EffectiveSite, people: HouseholdPerson[], services: { policies: PolicyVerificationService; now?: () => number }, existingPrimaryPolicies: PolicyLookup[] = []) {
  const errors: string[] = [], missingFacts: string[] = [];
  const fail = (reason: string) => ({ allowed: false, errors: [reason], missingFacts, portfolios: [], submissions: null });
  if (!people.length || people.some(person => !["member", "spouse", "child"].includes(person.applicantKey) || !person.personKey || !person.inputs.length || person.inputs.some(input => input.applicantKey !== person.applicantKey)) || new Set(people.map(person => person.personKey)).size !== people.length || people.filter(person => person.applicantKey === "member").length > 1 || people.filter(person => person.applicantKey === "spouse").length > 1) return fail("Invalid household identity or applicant roles");
  const selections = people.flatMap(person => person.inputs);
  for (const input of selections) {
    const benefit = site.configuration.products.find(product => product.productKey === input.productKey)?.benefitPolicies[0]?.value;
    if (isBenefitPolicy(benefit) && benefit.exclusiveProducts.some(key => selections.some(selected => selected.productKey === key))) errors.push("Mutually exclusive household products selected");
  }
  const primaryAmounts: Record<string, Record<string, number>> = {};
  for (const lookup of existingPrimaryPolicies) {
    if (lookup.siteKey !== site.siteKey || !["member", "spouse"].includes(lookup.applicantKey) || !site.products.some(product => product.productKey === lookup.productKey && product.applicants.some(applicant => applicant.applicantKey === lookup.applicantKey))) { errors.push("Invalid existing primary policy scope"); continue; }
    const verified = await verifyExistingPolicy(services.policies, lookup);
    if (verified.status !== "verified" || ["policyId", "ownerReference", "siteKey", "productKey", "applicantKey", "associationKey"].some(key => verified.policy[key as keyof PolicyLookup] !== lookup[key as keyof PolicyLookup]) || verified.policy.status !== "active" || !Number.isFinite(verified.policy.amount) || verified.policy.amount <= 0 || !Number.isFinite(verified.policy.expiresAt) || verified.policy.expiresAt <= (services.now ?? Date.now)()) { errors.push("Existing primary policy verification failed"); continue; }
    primaryAmounts[lookup.productKey] ??= {};
    if (primaryAmounts[lookup.productKey][lookup.applicantKey] !== undefined) { errors.push("Ambiguous existing primary policy"); continue; }
    primaryAmounts[lookup.productKey][lookup.applicantKey] = verified.policy.amount;
  }
  const portfolios: Awaited<ReturnType<typeof evaluateCoveragePortfolio>>[] = [];
  for (const role of ["member", "spouse", "child"] as const) for (const person of people.filter(person => person.applicantKey === role)) {
    const inputs = person.inputs.map(input => {
      const sameProduct = selections.filter(selected => selected.productKey === input.productKey);
      const selectedApplicants = [...new Set(sameProduct.map(selected => selected.applicantKey))];
      const baseAmounts = primaryAmounts[input.productKey] ?? {};
      const memberAmount = baseAmounts.member;
      return { ...input, memberAmount, spouseAmount: baseAmounts.spouse ?? 0, onlyChild: sameProduct.every(selected => selected.applicantKey === "child"), eligibility: { ...input.eligibility, selectedPlans: selections.map(selected => ({ productKey: selected.productKey, categoryKey: site.configuration.products.find(product => product.productKey === selected.productKey)?.catalog?.value.categoryKey ?? "", applicantKey: selected.applicantKey })) }, dependent: { ...input.dependent, baseAmounts, selectedApplicants, coveredApplicants: Object.keys(baseAmounts), selectedProductKeys: person.inputs.map(selected => selected.productKey) }, benefit: { ...input.benefit, memberCoverage: memberAmount !== undefined, memberRequestedBenefit: memberAmount, memberTotalMonthlyBenefit: memberAmount } };
    });
    const result = await evaluateCoveragePortfolio(site, inputs, services, person.existingLifeAmount);
    portfolios.push(result);
    errors.push(...result.errors.map(error => `${person.personKey}: ${error}`));
    missingFacts.push(...result.missingFacts.map(fact => `${person.personKey}: ${fact}`));
    if (result.allowed) for (const submission of result.submissions ?? []) {
      primaryAmounts[submission.productKey] ??= {};
      primaryAmounts[submission.productKey][role] = submission.mode === "rider-only" ? submission.existingAmount! : submission.amount;
    }
  }
  const collected = portfolios.flatMap(portfolio => portfolio.results.flatMap(result => result.allowed && "skipPayment" in result && !result.skipPayment ? [result.payment] : []));
  if (selections.some(input => resolveCoverageJourneyPolicy(site, input.productKey)?.payment.synchronizeAcrossProducts) && new Set(collected.map(payment => `${payment.method}/${payment.frequency}`)).size > 1) errors.push("Household payment method and frequency must match");
  const allowed = !errors.length && !missingFacts.length;
  return { allowed, errors, missingFacts, portfolios, submissions: allowed ? portfolios.flatMap(portfolio => portfolio.submissions ?? []) : null };
}
