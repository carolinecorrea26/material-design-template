import { expect, it } from 'vitest';
import { activePaymentAnswers, hasPaymentDocument } from './paymentAnswers';
import type { PaymentPolicy } from './paymentPolicy';
const payment: PaymentPolicy = { collection: 'required', methods: [{ method: 'bank-account', frequencies: ['monthly'] }, { method: 'bill-me', frequencies: ['monthly', 'annual'] }], defaultMethod: 'bank-account', defaultFrequency: 'monthly', frequencyLocked: false, synchronizeAcrossProducts: false };
const product = { productKey: 'li-term', payment };
const values = { 'payment-method:li-term': 'bill-me', 'payment-frequency:li-term': 'annually', 'payment-method:removed': 'bank-account', 'payment-frequency:removed': 'monthly', 'bank-routing-number': '021000021', 'bank-account-number': '000123456', 'payment-method:all': 'bank-account' };
it('excludes inactive products, shared UI answers and bank details hidden by Direct Bill', () => {
  expect(activePaymentAnswers(values, [product], 'required', ['bank-routing-number', 'bank-account-number'])).toEqual({ 'payment-method:li-term': 'bill-me', 'payment-frequency:li-term': 'annually' });
});
it('includes bank details only for a current allowed bank choice and preserves leading zeros', () => {
  expect(activePaymentAnswers({ ...values, 'payment-method:li-term': 'bank-account', 'payment-frequency:li-term': 'monthly' }, [product], 'required', ['bank-account-number'])['bank-account-number']).toBe('000123456');
  expect(activePaymentAnswers(values, [{ ...product, payment: { ...payment, collection: 'none' } }], 'required', ['bank-account-number'])).toEqual({});
});
it('does not export retained payment/bank details when optional collection is declined', () => {
  expect(activePaymentAnswers({ ...values, 'payment-information-opt-in': 'no' }, [product], 'optional', ['bank-account-number'])).toEqual({ 'payment-information-opt-in': 'no' });
});

it.each(['bank-account', 'bill-me'])('makes Payment PDF available for an active allowed %s method and frequency', method => {
  const answers = activePaymentAnswers({ ...values, 'payment-method:li-term': method, 'payment-frequency:li-term': 'monthly' }, [product], 'required', []);
  expect(hasPaymentDocument(answers)).toBe(true);
});
it('hides Payment PDF for disabled, opted-out, stale-only, incomplete or invalid payment answers', () => {
  for (const answers of [
    activePaymentAnswers(values, [product], 'none', []),
    activePaymentAnswers({ ...values, 'payment-information-opt-in': 'no' }, [product], 'optional', []),
    activePaymentAnswers(values, [], 'required', []),
    activePaymentAnswers(values, [{ ...product, payment: { ...payment, collection: 'none' } }], 'required', []),
    activePaymentAnswers({ ...values, 'payment-frequency:li-term': undefined }, [product], 'required', []),
    activePaymentAnswers({ ...values, 'payment-frequency:li-term': 'weekly' }, [product], 'required', []),
    activePaymentAnswers({ ...values, 'payment-method:li-term': 'unsupported' }, [product], 'required', []),
  ]) expect(hasPaymentDocument(answers)).toBe(false);
});
