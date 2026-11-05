import { expect, it } from 'vitest';
import { paymentPeriod, paymentPeriodSuffix, monthlyEquivalent, estimateSummary } from './useApplicationEstimates';
import { combineRateDisplays } from '../../domain/rateDisplay';
it('compares mixed billing periods as monthly equivalents without adding incompatible period prices', () => {
  const monthly = monthlyEquivalent({ status: 'available', amount: 25 }, paymentPeriod('monthly').months);
  const annual = monthlyEquivalent({ status: 'available', amount: 120 }, paymentPeriod('annually').months);
  expect(combineRateDisplays([monthly, annual])).toEqual({ status: 'available', amount: 35 });
  expect(paymentPeriod('annual')).toEqual(paymentPeriod('annually'));
  expect(paymentPeriod('semiannual').months).toBe(6);
});
it('preserves incomplete, unavailable and suppressed rate states rather than presenting a partial total as complete', () => {
  const partial = monthlyEquivalent({ status: 'needs-information' }, 12);
  expect(combineRateDisplays([{ status: 'available', amount: 25 }, partial]).status).toBe('needs-information');
  expect(monthlyEquivalent({ status: 'unavailable', reason: 'technical' }, 12)).toEqual({ status: 'unavailable', reason: 'technical' });
  expect(combineRateDisplays([{ status: 'hidden' }])).toEqual({ status: 'hidden' });
});

it('shows the actual billing period for a common frequency and labels mixed periods as a monthly equivalent', () => {
 const annual = { period: 'annually', display: { status: 'available' as const, amount: 120 }, monthly: { status: 'available' as const, amount: 10 } };
 expect(estimateSummary([annual])).toMatchObject({ display: { amount: 120 }, label: 'Estimated annual cost', suffix: '/yr' });
 expect(estimateSummary([annual, { period: 'monthly', display: { status: 'available', amount: 25 }, monthly: { status: 'available', amount: 25 } }])).toMatchObject({ display: { amount: 35 }, label: 'Estimated monthly equivalent' });
});

it.each([['monthly', '/mo'], ['quarterly', '/quarter'], ['semiannual', '/6 months'], ['semiannually', '/6 months'], ['annual', '/yr'], ['annually', '/yr']])('labels the selected %s payment period beside its amount', (frequency, suffix) => {
  expect(paymentPeriodSuffix(frequency)).toBe(suffix);
});
