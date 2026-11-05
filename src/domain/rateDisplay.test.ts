import { expect, it } from 'vitest';
import { combineRateDisplays, rateDisplayForAmount, rateDisplayFromQuote } from './rateDisplay';
it('does not interpret NaN, invalid amounts or missing inputs as technical failures', () => {
  for (const amount of [NaN, Infinity, -1]) expect(rateDisplayForAmount(amount).status).toBe('needs-information');
  expect(rateDisplayForAmount(0)).toEqual({ status: 'available', amount: 0 });
});
it('keeps partial prices and references out of a numeric total', () => {
  expect(combineRateDisplays([{ status: 'available', amount: 10 }, { status: 'needs-information' }]).status).toBe('needs-information');
  expect(combineRateDisplays([{ status: 'available', amount: 10 }, { status: 'provided-separately' }]).status).toBe('provided-separately');
  expect(combineRateDisplays([{ status: 'available', amount: 10 }, { status: 'available', amount: 20 }])).toEqual({ status: 'available', amount: 30 });
  expect(combineRateDisplays([{ status: 'hidden' }]).status).toBe('hidden');
});
it('keeps loading and technical failure distinct in totals', () => {
  expect(combineRateDisplays([{ status: 'available', amount: 10 }, { status: 'loading' }]).status).toBe('loading');
  expect(combineRateDisplays([{ status: 'unavailable', reason: 'technical' }]).status).toBe('unavailable');
});
it('only maps a technical quote failure to unavailable', () => {
  const failure = { status: 'error' as const, displayPrice: false, amount: null, authority: 'Synthetic', reason: 'test' };
  expect(rateDisplayFromQuote({ ...failure, failureKind: 'configuration' }).status).toBe('provided-separately');
  expect(rateDisplayFromQuote({ ...failure, failureKind: 'inputs' }).status).toBe('needs-information');
  expect(rateDisplayFromQuote({ ...failure, failureKind: 'technical' }).status).toBe('unavailable');
});
