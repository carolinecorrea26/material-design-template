import { paymentProducts } from './paymentProducts';
import { resolveCoverageJourneyPolicy } from './coverageJourneyPolicy';
import type { PaymentPolicy } from './paymentPolicy';

/** Hidden answers may remain in a saved draft, but only current applicable answers
 * belong to generated payment documents or a future production submission. */
export function activePaymentAnswers(values: Record<string, unknown>, products: Array<{ productKey: string; payment: PaymentPolicy }>, requirement: 'required' | 'optional' | 'none', bankFieldIds: string[]) {
  const answers: Record<string, unknown> = {};
  if (requirement === 'optional') answers['payment-information-opt-in'] = values['payment-information-opt-in'];
  if (requirement === 'none' || requirement === 'optional' && values['payment-information-opt-in'] !== 'yes') return answers;
  let bank = false;
  for (const { productKey, payment } of products) {
    if (payment.collection === 'none') continue;
    const methodKey = `payment-method:${productKey}`, frequencyKey = `payment-frequency:${productKey}`;
    const method = payment.methods.find(option => option.method === values[methodKey]);
    if (!method) continue;
    answers[methodKey] = method.method;
    const raw = String(values[frequencyKey] ?? '');
    const frequency = raw === 'annually' ? 'annual' : raw === 'semiannually' ? 'semiannual' : raw;
    if (method.frequencies.some(value => value === frequency)) answers[frequencyKey] = raw;
    bank ||= method.method === 'bank-account';
  }
  if (bank) for (const id of bankFieldIds) if (values[id] !== undefined) answers[id] = values[id];
  return answers;
}

/** One active-payment projection for Receipt and generated payment documents. */
export function applicationPaymentAnswers(library: import('./prototypeLibrary').PrototypeLibrary, values: import('../app/ApplicationFormContext').ApplicationFormValues, coverages: import('./coverage').CoverageDefinition[]) {
  const page = library.site.configuration.pages.find(page => page.key === 'payment');
  if (!page) throw new Error('Missing fresh-start Payment requirement');
  return activePaymentAnswers(values, paymentProducts(values, coverages).flatMap(product => {
    const payment = resolveCoverageJourneyPolicy(library.site, product.coverageId)?.payment;
    return payment ? [{ productKey: product.coverageId, payment }] : [];
  }), page.requirement, library.fieldSurfaces.paymentBank.mapping.fields.map(field => field.id));
}

export function hasPaymentDocument(answers: Record<string, unknown>): boolean {
  return Object.keys(answers).some(key => key.startsWith('payment-method:') && Object.hasOwn(answers, key.replace('payment-method:', 'payment-frequency:')));
}
