import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { resolveEffectiveSite } from './effectiveSite';
import { evaluateCoverageHousehold } from './coverageHousehold';
import { createMockPolicyVerificationService, type VerifiedPolicy } from './policyVerification';
import { createCoverageJourneyFixture } from '../migration/coverageJourneyExceptionAcceptance';

const data = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')).data;
it.each(['li-term', 'li-10yr', 'li-20yr'])('reconciles verified and new household amounts for the %s spouse cap', async productKey => {
  const site = resolveEffectiveSite(data, 'asce');
  const member = { ...createCoverageJourneyFixture(site, productKey, { applicantKey: 'member', mode: 'new' }).input, amount: 100000 };
  const spouse = { ...createCoverageJourneyFixture(site, productKey, { applicantKey: 'spouse', mode: 'new' }).input, amount: 150000 };
  const record = (applicantKey: 'member' | 'spouse', amount: number): VerifiedPolicy => ({ policyId: `mock-policy-${applicantKey}`, ownerReference: 'mock-owner', siteKey: site.siteKey, productKey, applicantKey, status: 'active', amount, permittedChanges: ['increase'], billing: { method: 'bank-account', frequency: 'monthly' }, effectiveDate: '2026-01-01', expiresAt: Date.UTC(2030, 0, 1), riders: [] });
  const verified = [record('member', 100000), record('spouse', 50000)];
  const services = { policies: createMockPolicyVerificationService(verified) };
  const people = [{ personKey: 'member', applicantKey: 'member' as const, inputs: [member], existingLifeAmount: 100000 }, { personKey: 'spouse', applicantKey: 'spouse' as const, inputs: [spouse], existingLifeAmount: 50000 }];
  const result = await evaluateCoverageHousehold(site, people, services, verified);
  expect(result, JSON.stringify(result)).toMatchObject({ allowed: true });
  const excess = await evaluateCoverageHousehold(site, [people[0], { ...people[1], inputs: [{ ...spouse, amount: 160000 }] }], services, verified);
  expect(excess.allowed).toBe(false);
  expect(excess.errors.join(' ')).toContain('Dependent amount exceeds primary coverage cap');
});
