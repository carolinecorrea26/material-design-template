import type { EffectiveSite } from '../domain/effectiveSite';
import { resolveCoverageJourneyPolicy, type MappingDimensions } from '../domain/coverageJourneyPolicy';
import { isSelectionPolicy } from '../domain/coverageSelectionPolicy';
import { createCoverageJourneyFixture } from './coverageJourneyExceptionAcceptance';
import { evaluateCoverageJourney } from '../domain/coverageJourney';

/** Contract checks enumerate every assignment separately. Execute shared journey
 * mechanics once per effective behavior, not once per identifier/period spelling. */
export function representativeJourneyScenarios(sites: EffectiveSite[]) {
  const groups = new Map<string, { site: EffectiveSite; productKey: string; dimensions: MappingDimensions; members: string[] }>();
  for (const site of sites) for (const product of site.configuration.products) {
    const policy = resolveCoverageJourneyPolicy(site, product.productKey)!;
    const selection = product.selectionPolicies[0].value;
    if (!isSelectionPolicy(selection)) throw new Error('Invalid effective selection');
    for (const mapping of policy.mappings) {
      const d = mapping.when;
      if (!selection.modes.includes(d.mode) || d.mode === 'rider-only' && !selection.riderOnlyApplicants.includes(d.applicantKey)) continue;
      const questions = policy.questions.find(q => q.applicantKey === d.applicantKey && q.modes.includes(d.mode));
      const signature = JSON.stringify({ category: product.catalog!.value.categoryKey, applicant: d.applicantKey, mode: d.mode,
        applicantClass: d.applicantClass, association: d.associationKey,
        underwriting: policy.defaultUnderwritingPathway, health: policy.healthPageByUnderwriting, portfolioHealth: policy.healthPageForPortfolio,
        questionnaire: site.configuration.healthQuestionnairePolicies.map(row => row.value),
        payment: policy.payment, hasQuestions: !!questions, financial: questions?.financialFields, tobacco: questions?.tobaccoFields,
        eligibility: site.products.find(p => p.productKey === product.productKey)!.applicants.find(a => a.applicantKey === d.applicantKey)!.constraints?.value,
        // Period choices and numeric bounds are covered by policy unit tests;
        // their presence changes the journey's required-input behavior.
        periods: [!!d.waitingPeriod, !!d.benefitPeriod], childSchedule: selection.childSchedule,
        dependentElections: policy.dependentElections, skipExistingPayment: selection.skipPaymentForExisting,
      });
      const member = `${site.siteKey}/${product.productKey}/${JSON.stringify(d)}`;
      const group = groups.get(signature);
      if (group) group.members.push(member);
      else groups.set(signature, { site, productKey: product.productKey, dimensions: d, members: [member] });
    }
  }
  return [...groups.values()];
}

export async function runCoverageJourneyAcceptance(sites: EffectiveSite[]) {
  const failures: unknown[] = [];
  const groups = representativeJourneyScenarios(sites);
  for (const group of groups) {
    const { site, productKey, dimensions } = group;
    const { input, policies } = createCoverageJourneyFixture(site, productKey, dimensions);
    const result = await evaluateCoverageJourney(site, input, { policies, existingLifeAmount: 0 });
    if (!result.allowed) failures.push({ site: site.siteKey, product: productKey, dimensions, amount: input.amount, errors: result.errors, missing: result.missingFacts });
    else if (result.submission?.productKey !== productKey || result.submission.applicantKey !== dimensions.applicantKey || result.submission.questions && 'bank-account-number' in result.submission.questions) failures.push({ site: site.siteKey, product: productKey, error: 'Invalid scoped submission envelope' });
  }
  return { tested: groups.length, represented: groups.reduce((sum, group) => sum + group.members.length, 0), failures };
}
