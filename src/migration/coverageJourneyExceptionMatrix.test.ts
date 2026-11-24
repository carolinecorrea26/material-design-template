import { expect, it } from 'vitest';
import { journeySite } from './freshStartJourneyFixtures';
import { createCoverageJourneyFixture } from './coverageJourneyExceptionAcceptance';
import { evaluateCoverageJourney, type CoverageJourneyInput } from '../domain/coverageJourney';
import { resolveCoverageJourneyPolicy } from '../domain/coverageJourneyPolicy';

it('rejects incomplete global journey inputs once, withholding the submission envelope', async () => {
  const site = journeySite('asce');
  const { input, policies } = createCoverageJourneyFixture(site, 'li-term', { applicantKey: 'member', mode: 'new' });
  expect((await evaluateCoverageJourney(site, input, { policies })).allowed).toBe(true);
  for (const invalid of [{ jurisdiction: undefined }, { attestations: [] }, { amount: -1 }, { membershipConfirmed: false }, { eligibility: { ...input.eligibility, ageYears: 1000 } }] satisfies Partial<CoverageJourneyInput>[]) {
    expect(await evaluateCoverageJourney(site, { ...input, ...invalid }, { policies })).toMatchObject({ allowed: false, submission: null });
  }
});
it('requires actual class and period choices for the AMA disability override', async () => {
  const site = journeySite('ama'), productKey = 'di-step-rated';
  const mapping = resolveCoverageJourneyPolicy(site, productKey)!.mappings.find(m => m.when.mode === 'new')!;
  const { input, policies } = createCoverageJourneyFixture(site, productKey, mapping.when);
  expect((await evaluateCoverageJourney(site, input, { policies })).allowed).toBe(true);
  for (const key of ['applicantClass', 'waitingPeriod', 'benefitPeriod'] as const) for (const value of [undefined, 'invalid']) {
    expect(await evaluateCoverageJourney(site, { ...input, [key]: value }, { policies })).toMatchObject({ allowed: false, submission: null });
  }
});
