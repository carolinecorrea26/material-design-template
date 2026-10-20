import { useEffect, useState } from 'react';
import { getPrototypeLibrary } from '../domain/prototypeLibrary';
import { quoteCandidateWithMock } from '../domain/mockRating';
import { resolveCoverageJourneyPolicy } from '../domain/coverageJourneyPolicy';
import { candidateMockRatingService } from '../mock/client';
import { applicationApplicantFacts } from '../utils/applicantFacts';
import type { CoverageApplicantId } from '../domain/coverage';
import type { PaymentFrequency, PaymentMethod } from '../domain/paymentPolicy';

export function prototypeRateRequest(productKey: string, applicant: CoverageApplicantId, amount: number, values: Record<string, unknown>, frequency: PaymentFrequency) {
  const library = getPrototypeLibrary();
  if (!library) return null;
  const policy = resolveCoverageJourneyPolicy(library.site, productKey);
  const prefix = applicant === 'member' ? '' : `${applicant}-`;
  const child = applicant === 'child' && Array.isArray(values.children) ? values.children[0] as Record<string, unknown> | undefined : undefined;
  const applicantValues = child ? { ...values, 'child-birth-date': child.birthDate, 'child-gender': child.gender } : values;
  const scoped = (name: string) => (values[name] as Record<string, unknown> | undefined)?.[`${productKey}:${applicant}`] ?? (values[name] as Record<string, unknown> | undefined)?.[productKey];
  const booleanFact = (value: unknown) => value === true || value === 'yes' ? true : value === false || value === 'no' ? false : undefined;
  const membership = booleanFact(values[`prototype-fact:${productKey}:member:membership`]) ?? booleanFact(values.membership) ?? booleanFact(values['is-member']) ?? booleanFact(values['membership-confirmed']);
  const association = values.association ?? (policy?.associationChoices.some(choice => choice.key === values.membership) ? values.membership : undefined);
  const jurisdiction = String(values['state-province'] ?? values.state ?? '').replace(/^US-/, '');
  return { productKey, facts: { amount, applicant, age: applicationApplicantFacts(applicantValues, applicant).ageYears, jurisdiction, gender: applicantValues[`${prefix}gender`], tobacco: values[`${prefix}smoker`], membership, waitingPeriod: scoped('coverageWaitingPeriods'), benefitPeriod: scoped('coverageMaxBenefitPeriods'), association, riders: Object.entries(values.coverageRiders as Record<string, boolean> ?? {}).filter(([key, selected]) => selected && key.startsWith(`${productKey}:`) && key.endsWith(`:${applicant}`)).map(([key]) => key.split(':')[1]) }, payment: { method: (values[`payment-method:${productKey}`] ?? values['payment-method'] ?? policy?.payment.defaultMethod) as PaymentMethod, frequency: ({ annually: 'annual', semiannually: 'semiannual' } as Record<string, PaymentFrequency>)[String(values[`payment-frequency:${productKey}`])] ?? values[`payment-frequency:${productKey}`] as PaymentFrequency ?? frequency } };
}
/** Key every response to all rate inputs. A stale response can never price a new election. */
export function usePrototypeRates(requests: Array<{ productKey: string; applicant: CoverageApplicantId; amount: number }>, values: Record<string, unknown>, frequency: PaymentFrequency, purpose: 'coverage' | 'quote-tool') {
  const library = getPrototypeLibrary();
  const [refresh, setRefresh] = useState(0);
  useEffect(() => { if (!library) return; const timer = window.setInterval(() => setRefresh(value => value + 1), 5 * 60 * 1000); return () => window.clearInterval(timer); }, [library]);
  const serialized = JSON.stringify(requests.map(r => ({ key: `${r.productKey}:${r.applicant}`, request: prototypeRateRequest(r.productKey, r.applicant, r.amount, values, frequency) })));
  const [result, setResult] = useState<{ generation: number; inputs: string; premiums: Record<string, number> } | null>(null);
  useEffect(() => {
    if (!library) return;
    let current = true;
    const rows = JSON.parse(serialized) as Array<{ key: string; request: NonNullable<ReturnType<typeof prototypeRateRequest>> }>;
    void Promise.all(rows.map(async row => {
      if (!row.request.facts.amount) return [row.key, 0] as const;
      const quote = await quoteCandidateWithMock(library.site, row.request.productKey, row.request.facts, row.request.payment, candidateMockRatingService, Date.now(), purpose);
      return [row.key, quote.displayPrice && quote.amount !== null ? quote.amount : NaN] as const;
    })).then(rows => { if (current) setResult({ generation: refresh, inputs: serialized, premiums: Object.fromEntries(rows) }); });
    return () => { current = false; };
  }, [serialized, library, purpose, refresh]);
  return { enabled: !!library, premium: (key: string) => result?.inputs === serialized && result.generation === refresh ? result.premiums[key] ?? NaN : NaN };
}
