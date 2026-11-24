// Historical pricing verification; excluded from the routine prototype suite.
import { expect, it } from 'vitest';
import { resolveBilling, resolveCoverageJourneyPolicy } from '../domain/coverageJourneyPolicy';
import { journeySite as site, journeyLibrary, journeyAssignment, syntheticJourneySource } from './freshStartJourneyFixtures';

it('retains method-specific payment choices and applies synthetic fees after annual credit', () => {
    const ama = resolveCoverageJourneyPolicy(site('ama'), 'li-term')!;
    expect(resolveBilling(ama, 'bank-account', 'monthly', 1200)).toMatchObject({ status: 'resolved', amount: 99.6 });
    expect(resolveBilling(ama, 'bank-account', 'annual', 1200).status).toBe('unresolved');
    expect(resolveBilling(ama, 'bill-me', 'semiannual', 1200).amount).toBe(624);
    const source = syntheticJourneySource(), p = journeyAssignment(source, 'example', 'li-term');
    p.billing.annualCredit = 100; p.billing.feePerCollection['bill-me'] = 5;
    const policy = resolveCoverageJourneyPolicy(journeyLibrary('example', source).site, 'li-term')!;
    expect(resolveBilling(policy, 'bill-me', 'quarterly', 1100).amount).toBe(255);
    expect(resolveBilling(policy, 'bill-me', 'quarterly', null)).toMatchObject({ status: 'unavailable', amount: null, displayPrice: false });
    expect(resolveBilling(policy, 'bill-me', 'quarterly', NaN).displayPrice).toBe(false);
  });
