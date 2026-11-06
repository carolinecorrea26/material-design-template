import { rateDisplayFromQuote, type RateDisplayState } from '../domain/rateDisplay';
import { resolveRatePresentation } from '../domain/ratePresentation';
import { currentMembershipLookup } from "../domain/membershipLookup";
import { useEffect, useState } from 'react';
import { getPrototypeLibrary } from '../domain/prototypeLibrary';
import { selectedRiderCharges } from '../domain/pricing';
import { quoteCandidateWithMock } from '../domain/mockRating';
import { resolveCoverageJourneyPolicy } from '../domain/coverageJourneyPolicy';
import { candidateMockRatingService } from '../mock/client';
import { applicationApplicantFacts } from '../utils/applicantFacts';
import type { CoverageApplicantId } from '../domain/coverage';
import type { PaymentFrequency, PaymentMethod } from '../domain/paymentPolicy';

/** Selected riders priced on their own or the base amount; the mock rating server adds them to the base premium. */
function riderCharges(library: NonNullable<ReturnType<typeof getPrototypeLibrary>>, productKey: string, applicant: CoverageApplicantId, amount: number, values: Record<string, unknown>) {
  const product = library.products.find(product => product.id === productKey);
  return product ? selectedRiderCharges(product, applicant, amount, values.coverageRiders as Record<string, boolean> | undefined, values.coverageRiderAmounts as Record<string, number> | undefined).map(({ amount, premiumFactor }) => ({ amount, premiumFactor })) : [];
}

export function prototypeRateRequest(productKey: string, applicant: CoverageApplicantId, amount: number, values: Record<string, unknown>, frequency: PaymentFrequency) {
  const library = getPrototypeLibrary();
  if (!library) return null;
  const policy = resolveCoverageJourneyPolicy(library.site, productKey);
  const prefix = applicant === 'member' ? '' : `${applicant}-`;
  const child = applicant === 'child' && Array.isArray(values.children) ? values.children[0] as Record<string, unknown> | undefined : undefined;
  const applicantValues = child ? { ...values, 'child-birth-date': child['child-birth-date'], 'child-gender': child['child-gender'] } : values;
  const scoped = (name: string) => (values[name] as Record<string, unknown> | undefined)?.[`${productKey}:${applicant}`] ?? (values[name] as Record<string, unknown> | undefined)?.[productKey];
  const booleanFact = (value: unknown) => value === true || value === 'yes' ? true : value === false || value === 'no' ? false : undefined;
  const membership = (library.client.applicantExperience?.membershipLookup ? currentMembershipLookup(values)?.isMember : undefined) ?? booleanFact(values[`prototype-fact:${productKey}:member:membership`]) ?? booleanFact(values.membership) ?? booleanFact(values['is-member']) ?? booleanFact(values['membership-confirmed']);
  const association = values.association ?? (policy?.associationChoices.some(choice => choice.key === values.membership) || typeof values.membership === 'string' && library.site.assignedAssociationKeys.includes(values.membership) ? values.membership : undefined);
  const jurisdiction = String(values['state-province'] ?? values.state ?? '').replace(/^US-/, '');
  return { productKey, riders: riderCharges(library, productKey, applicant, amount, values), facts: { amount, applicant, age: applicationApplicantFacts(applicantValues, applicant).ageYears, jurisdiction, gender: applicantValues[`${prefix}gender`], tobacco: values[`${prefix}smoker`], tobaccoLastUsed: values[`${prefix}tobacco-last-used`], membership, waitingPeriod: scoped('coverageWaitingPeriods'), benefitPeriod: scoped('coverageMaxBenefitPeriods'), association, riders: Object.entries(values.coverageRiders as Record<string, boolean> ?? {}).filter(([key, selected]) => selected && key.startsWith(`${productKey}:`) && key.endsWith(`:${applicant}`)).map(([key]) => key.split(':')[1]) }, payment: { method: (values[`payment-method:${productKey}`] ?? values['payment-method'] ?? policy?.payment.defaultMethod) as PaymentMethod, frequency: ({ annually: 'annual', semiannually: 'semiannual' } as Record<string, PaymentFrequency>)[String(values[`payment-frequency:${productKey}`])] ?? values[`payment-frequency:${productKey}`] as PaymentFrequency ?? frequency } };
}
/** Key every response to all rate inputs. A stale response can never price a new election. */
export function usePrototypeRates(requests: Array<{ productKey: string; applicant: CoverageApplicantId; amount: number }>, values: Record<string, unknown>, frequency: PaymentFrequency, purpose: 'coverage' | 'quote-tool') {
  const library = getPrototypeLibrary();
  const [refresh, setRefresh] = useState(0);
  useEffect(() => { if (!library) return; const timer = window.setInterval(() => setRefresh(value => value + 1), 5 * 60 * 1000); return () => window.clearInterval(timer); }, [library]);
  const serialized = JSON.stringify(requests.map(r => ({ key: `${r.productKey}:${r.applicant}`, request: prototypeRateRequest(r.productKey, r.applicant, r.amount, values, frequency) })));
  const [result, setResult] = useState<{ generation: number; inputs: string; displays: Record<string, RateDisplayState> } | null>(null);
  useEffect(() => {
    if (!library) return;
    let current = true;
    const rows = JSON.parse(serialized) as Array<{ key: string; request: NonNullable<ReturnType<typeof prototypeRateRequest>> }>;
    void Promise.all(rows.map(async row => {
      const presentation = resolveRatePresentation(library.site, row.request.productKey, typeof row.request.facts.association === 'string' ? row.request.facts.association : undefined);
      let display: RateDisplayState;
      if (presentation.referenceTable) display = { status: 'reference-table', table: presentation.referenceTable };
      else if (presentation.status === 'resolved' && !(purpose === 'quote-tool' ? presentation.quoteToolEnabled : presentation.coverageQuoteEnabled)) display = { status: 'hidden' };
      else if (!row.request.facts.amount) display = { status: 'needs-information' };
      else {
        try {
          const quote = await quoteCandidateWithMock(library.site, row.request.productKey, row.request.facts, row.request.payment, candidateMockRatingService, Date.now(), purpose, row.request.riders);
          display = rateDisplayFromQuote(quote);
        } catch { display = { status: 'unavailable', reason: 'technical' }; }
      }
      return [row.key, display] as const;
    })).then(displays => { if (current) setResult({ generation: refresh, inputs: serialized, displays: Object.fromEntries(displays) }); });
    return () => { current = false; };
  }, [serialized, library, purpose, refresh]);
  const display = (key: string): RateDisplayState => {
    if (result?.inputs === serialized && result.generation === refresh) return result.displays[key] ?? { status: 'needs-information' };
    const previous = result?.displays[key];
    return { status: 'loading', ...(previous?.status === 'available' ? { previousAmount: previous.amount } : {}) };
  };
  return { enabled: !!library, display, premium: (key: string) => { const state = display(key); return state.status === 'available' ? state.amount : NaN; } };
}
