import type { EffectiveSite } from "./effectiveSite";
import { evaluateCoverageJourney, type CoverageJourneyInput } from "./coverageJourney";
import { resolveCoverageJourneyPolicy } from "./coverageJourneyPolicy";
import type { PolicyVerificationService } from "./policyVerification";
import { validateNormalizedLifeAggregate } from "./normalizedCoverageAmounts";
import { isBenefitPolicy } from "./benefitPolicy";

/** One person's portfolio from a single captured Site. Run separately for each
 * child/person. Existing amount facts exclude the resulting totals selected here.
 * The caller's otherMonthlyBenefits contain only unselected/in-force benefits;
 * selected product totals are added here, never trusted from a form summary.
 * This candidate boundary emits no envelope until every product and joint gate passes. */
export async function evaluateCoveragePortfolio(
  site: EffectiveSite,
  inputs: CoverageJourneyInput[],
  services: { policies: PolicyVerificationService; now?: () => number },
  existingLifeAmount?: number,
) {
  const errors: string[] = [], missingFacts: string[] = [];
  if (!inputs.length || new Set(inputs.map(i => i.productKey)).size !== inputs.length || new Set(inputs.map(i => i.applicantKey)).size !== 1) return { allowed: false, errors: ["Portfolio must contain unique products for one applicant"], missingFacts, results: [], submissions: null };
  const selectedProducts = inputs.map(i => i.productKey);
  const results = await Promise.all(inputs.map(input => {
    const product = site.configuration.products.find(p => p.productKey === input.productKey);
    const benefit = product?.benefitPolicies[0]?.value;
    const group = isBenefitPolicy(benefit) ? benefit.aggregate : undefined;
    const others = input.benefit?.otherMonthlyBenefits;
    // Missing existing facts remain missing; selected totals cannot imply zero
    // in-force coverage. This also enforces mutually exclusive product selections.
    const otherMonthlyBenefits = group && others ? Object.fromEntries(Object.entries(others).map(([key, existing]) => [key, existing + (inputs.find(i => i.productKey === key)?.amount ?? 0)])) : others;
    return evaluateCoverageJourney(site, { ...input, benefit: { ...input.benefit, selectedProducts, otherMonthlyBenefits } }, { ...services, portfolio: inputs, existingLifeAmount });
  }));
  results.forEach((result, index) => {
    errors.push(...result.errors.map(e => `${inputs[index].productKey}: ${e}`));
    missingFacts.push(...result.missingFacts.map(f => `${inputs[index].productKey}: ${f}`));
  });
  const collected = results.flatMap(result => result.allowed && "skipPayment" in result && !result.skipPayment ? [result.payment] : []);
  const synchronize = inputs.some(input => resolveCoverageJourneyPolicy(site, input.productKey)?.payment.synchronizeAcrossProducts);
  if (synchronize && new Set(collected.map(p => `${p.method}/${p.frequency}`)).size > 1) errors.push("Payment method and frequency must match across synchronized products");
  if (results.every(r => r.allowed)) {
    const selections = results.map(r => ({ productKey: r.submission!.productKey, amount: r.submission!.mode === "rider-only" ? r.submission!.existingAmount! : r.submission!.amount }));
    const hasLife = selections.some(s => site.configuration.products.find(p => p.productKey === s.productKey)?.catalog?.value.categoryKey === "LI");
    const participation = site.configuration.lifeAggregateParticipation;
    const individualOnly = participation.length === 1 && participation[0].value && typeof participation[0].value === "object" && !Array.isArray(participation[0].value) && "mode" in participation[0].value && participation[0].value.mode === "individual-only" && "provisional" in participation[0].value && participation[0].value.provisional === true && !site.configuration.lifeAggregates.length && !site.configuration.products.some(product => product.limits.some(limit => limit.value.categoryKey === "LI" && limit.value.productKey === null));
    if (hasLife && !individualOnly) {
      const aggregate = validateNormalizedLifeAggregate(site, inputs[0].applicantKey, selections, existingLifeAmount);
      if (!aggregate.allowed) (aggregate.status === "needs-information" ? missingFacts : errors).push(aggregate.reason);
    }
  }
  const allowed = !errors.length && !missingFacts.length;
  return { allowed, errors, missingFacts, results, submissions: allowed ? results.map(r => r.submission!) : null };
}
