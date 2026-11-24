import { afterEach, expect, it } from 'vitest';
import { journeyLibrary, journeySite, journeySiteKeys, journeyFormValues } from './freshStartJourneyFixtures';
import { runCoverageJourneyAcceptance } from './coverageJourneyAcceptance';
import { createCoverageJourneyFixture } from './coverageJourneyExceptionAcceptance';
import { resolveCoverageJourneyPolicy } from '../domain/coverageJourneyPolicy';
import { evaluateCoverageHousehold } from '../domain/coverageHousehold';
import { createMockPolicyVerificationService } from '../domain/policyVerification';
import { installPrototypeLibrary } from '../domain/prototypeLibrary';
import { getActiveFormFlow, getNextFormPageId, getPreviousFormPageId } from '../config/formFlow';
import { validateCoverageSubmission } from '../domain/coverageRuntime';
import { applicationUnderwriting } from '../domain/coverageRuntime';
import type { CoverageApplicantId } from '../domain/coverage';
import type { PageId } from '../types';

afterEach(() => { installPrototypeLibrary(null); sessionStorage.clear(); });

it('submits representative effective applicant/product/mode journeys across enrolled Sites', async () => {
  const result = await runCoverageJourneyAcceptance(journeySiteKeys.map(journeySite));
  expect(result.tested).toBeGreaterThan(0);
  expect(result.represented).toBeGreaterThan(result.tested);
  expect(result.failures, JSON.stringify(result.failures)).toEqual([]);
}, 60000);

it('traverses configured application routes through Review, signing and Receipt for distinct effective flow configurations', async () => {
  const groups = new Map<string, string[]>();
  for (const key of journeySiteKeys) {
    const library = journeyLibrary(key);
    const policies = library.products.map(p => resolveCoverageJourneyPolicy(library.site, p.id)!);
    const signature = JSON.stringify({ template: library.client.features?.defaultTemplate,
      applicants: [...new Set(policies.flatMap(p => p.applicants))].sort(),
      health: [...new Set(policies.flatMap(p => Object.values(p.healthPageByUnderwriting ?? {})))].sort(),
      payment: [...new Set(policies.map(p => `${p.payment.collection}/${p.payment.synchronizeAcrossProducts}`))].sort() });
    groups.set(signature, [...(groups.get(signature) ?? []), key]);
  }
  for (const members of groups.values()) {
    const key = members[0], library = journeyLibrary(key);
    window.history.replaceState(null, '', `/?site=${key}`);
    sessionStorage.clear(); installPrototypeLibrary(library);
    const life = library.products.find(p => p.categoryId === 'LI') ?? library.products[0];
    const disability = library.products.find(p => p.categoryId === 'DI');
    const policy = resolveCoverageJourneyPolicy(library.site, life.id)!;
    const inputs = policy.applicants.map(applicantKey => createCoverageJourneyFixture(library.site, life.id, policy.mappings.find(m => m.when.applicantKey === applicantKey && m.when.mode === 'new')!.when).input);
    if (disability && disability.id !== life.id) inputs.push(createCoverageJourneyFixture(library.site, disability.id, resolveCoverageJourneyPolicy(library.site, disability.id)!.mappings.find(m => m.when.applicantKey === 'member' && m.when.mode === 'new')!.when).input);
    const values = journeyFormValues(library, inputs);
    expect(validateCoverageSubmission(library.products, values), key).toBeUndefined();
    const people = [...new Set(inputs.map(input => input.applicantKey))].map(applicantKey => ({ personKey: applicantKey, applicantKey: applicantKey as CoverageApplicantId, inputs: inputs.filter(input => input.applicantKey === applicantKey), existingLifeAmount: 0 }));
    const submitted = await evaluateCoverageHousehold(library.site, people, { policies: createMockPolicyVerificationService([]) });
    expect(submitted.allowed, `${key}: ${JSON.stringify({ errors: submitted.errors, missing: submitted.missingFacts })}`).toBe(true);
    expect(submitted.submissions).toHaveLength(inputs.length);
    const expected = getActiveFormFlow(values);
    const visited: PageId[] = [expected[0]];
    for (let step = 0; step < library.pages.length; step++) {
      const next = getNextFormPageId(visited.at(-1)!, values);
      if (!next) break;
      expect(getPreviousFormPageId(next, values), key).toBe(visited.at(-1));
      visited.push(next);
    }
    expect(visited, key).toEqual(expected);
    expect(visited, key).toEqual(expect.arrayContaining(['membership', 'eligibility', 'coverage', 'review', 'docusign', 'receipt']));
    expect(visited.at(-1), key).toBe('receipt');
    const collected = submitted.portfolios.flatMap(p => p.results).some(r => 'skipPayment' in r && !r.skipPayment);
    expect(visited.includes('payment'), key).toBe(collected);
    for (const input of inputs) {
      const product = library.products.find(p => p.id === input.productKey)!;
      const health = applicationUnderwriting(product, input.applicantKey as CoverageApplicantId, values).healthPage;
      if (health) expect(visited, `${key}/${input.productKey}/${input.applicantKey}`).toContain(health);
    }
  }
}, 60000);
