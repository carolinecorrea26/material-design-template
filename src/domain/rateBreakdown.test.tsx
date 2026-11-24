import { readFileSync } from 'node:fs';
import { afterEach, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { billedRateBreakdown, validRateBreakdown } from './rateBreakdown';
import { applyRateModifiers, type RateModifierPolicy } from './rateModifiers';
import { resolveBilling, resolveCoverageJourneyPolicy } from './coverageJourneyPolicy';
import { validateSharedCatalog } from '../persistence/sharedCatalog';
import { installPrototypeLibrary, resolvePrototypeLibrary } from './prototypeLibrary';
import { buildGlobalTemplate } from '../dev/storybook/globalTemplate';
import { quoteCandidateWithMock } from './mockRating';
import { rateDisplayFromQuote } from './rateDisplay';
import CostBreakdownExample from '../../.storybook/costBreakdownExample';

const catalog = validateSharedCatalog(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')));
const library = resolvePrototypeLibrary(catalog.data, 'asce', 'test:breakdown');
afterEach(() => installPrototypeLibrary(null));
const components = [{ key: 'base', kind: 'base' as const, amount: 120 }, { key: 'rider:0', kind: 'rider' as const, riderIndex: 0, amount: 24 }];

it('rejects incomplete, duplicate and unreconciled itemization without inventing amounts', () => {
  expect(validRateBreakdown(components, 144, 1)).toBe(true);
  for (const value of [undefined, [], [...components, components[0]], [{ ...components[0], amount: NaN }], [{ ...components[0], amount: -1 }], [{ ...components[1], riderIndex: 2 }], [{ ...components[0], amount: 143 }]]) expect(validRateBreakdown(value, 144, 1)).toBe(false);
});

it('reconciles ordered pricing modifiers, credits, billing fees and fractional cents', () => {
  const policy = structuredClone(resolveCoverageJourneyPolicy(library.site, 'li-term')!);
  policy.billing.annualCredit = 11;
  policy.billing.feePerCollection['bank-account'] = 1;
  const rules: RateModifierPolicy['rules'] = [
    { key: 'fee', label: 'Configured fee', when: {}, effect: { kind: 'annual-fee', value: 5 }, sourceReferences: [] },
    { key: 'factor', when: {}, effect: { kind: 'multiply', value: 1.07 }, sourceReferences: [] },
  ];
  for (const frequency of ['monthly', 'annual'] as const) {
    const payment = { method: 'bank-account' as const, frequency };
    const adjusted = applyRateModifiers({ version: 1, rules, provisional: false, revisit: [] }, 144, payment);
    const total = resolveBilling(policy, payment.method, frequency, adjusted.annualPremium!).amount!;
    const result = billedRateBreakdown(components, 144, 1, rules, policy.billing, payment, total)!;
    expect(validRateBreakdown(result, total, 1)).toBe(true);
    expect(result.find(row => row.key === 'modifier:fee')).toMatchObject({ label: 'Configured fee' });
    expect(result.find(row => row.key === 'billing-credit')!.amount).toBeLessThan(0);
    expect(result.find(row => row.key === 'collection-fee')!.amount).toBe(1);
    expect(billedRateBreakdown(undefined, 144, 1, rules, policy.billing, payment, total)).toBeUndefined();
  }
});

it('preserves the quote total with optional provider itemization and the active billing frequency', async () => {
  const facts = { amount: 100000, applicant: 'member', age: 40, jurisdiction: 'US-VA', gender: 'female', tobacco: 'no', membership: true };
  for (const frequency of ['monthly', 'annual'] as const) for (const itemization of [components, undefined, [{ ...components[0], amount: 1 }]]) {
    const result = await quoteCandidateWithMock(library.site, 'li-term', facts, { method: 'bank-account', frequency }, { quote: async () => ({ mode: 'mock', premiumCents: 14400, expiresAt: 2000, authority: 'Synthetic test rates', components: itemization }) }, 1000, 'coverage', [{ amount: 50000, premiumFactor: 0.1 }]);
    expect(result).toMatchObject({ status: 'mock', displayPrice: true, amount: frequency === 'monthly' ? 12 : 144 });
    const display = rateDisplayFromQuote(result);
    expect(display.status).toBe('available');
    if (display.status === 'available') expect(!!display.breakdown).toBe(itemization === components);
  }
});

it('uses the source-compiled Site display option and total-only fallback in the real product card', () => {
  const fixture = buildGlobalTemplate(catalog, 'standard', undefined, undefined, { costBreakdown: true });
  installPrototypeLibrary(fixture);
  expect(fixture.client.coverages.productEstimatedCostBreakdown?.enabled).toBe(true);
  expect(library.client.coverages.productEstimatedCostBreakdown?.enabled).toBe(false);
  const enabled = renderToStaticMarkup(<CostBreakdownExample fixture={fixture} />);
  expect(enabled).toContain('Estimated cost breakdown');
  expect(enabled).toContain('Policy fee');
  expect(enabled).toContain('$13.00');
  expect(renderToStaticMarkup(<CostBreakdownExample fixture={fixture} itemized={false} />)).not.toContain('Estimated cost breakdown');
  expect(renderToStaticMarkup(<CostBreakdownExample fixture={library} />)).not.toContain('Estimated cost breakdown');
});
