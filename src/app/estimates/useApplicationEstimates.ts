import { useMemo } from 'react';
import { getActiveClientCoverages } from '../../config/client/getActiveClientCoverages';
import { getPrototypeLibrary } from '../../domain/prototypeLibrary';
import { associationRatesSuppressed } from '../../domain/ratePresentation';
import { combineRateDisplays, rateDisplayForAmount, type RateDisplayState } from '../../domain/rateDisplay';
import { getCoverageAmountRequested, getOrderedDecisionEntries } from '../../utils/coverageDecisions';
import { monthsPerPayment, productMonthlyPremium } from '../../domain/pricing';
import { usePrototypeRates } from '../usePrototypeRates';
import type { ApplicationFormValues } from '../ApplicationFormContext';
import { getContent } from '../../content';

export function paymentPeriod(value: unknown) {
  const key = String(value ?? 'monthly');
  const label = ({ monthly: 'monthly', quarterly: 'quarterly', semiannual: 'semiannually', semiannually: 'semiannually', annual: 'annually', annually: 'annually' } as Record<string, string>)[key];
  return label ? { label, months: monthsPerPayment(key) } : { label: 'monthly', months: 1 };
}
export function paymentPeriodSuffix(value: unknown) {
  return ({ 1: '/mo', 3: '/quarter', 6: '/6 months', 12: '/yr' } as Record<number, string>)[paymentPeriod(value).months];
}
export function monthlyEquivalent(display: RateDisplayState, months: number): RateDisplayState {
  return display.status === 'available' ? { status: 'available', amount: display.amount / months } : display.status === 'loading' && display.previousAmount !== undefined ? { status: 'loading', previousAmount: display.previousAmount / months } : display;
}
export function estimateSummary(items: Array<{ period: string; display: RateDisplayState; monthly: RateDisplayState }>) {
  const periods = [...new Set(items.map(item => item.period))];
  const common = periods.length === 1 ? periods[0] : undefined;
  const labels: Record<string, [string, string]> = { monthly: ['Estimated monthly cost', '/mo'], quarterly: ['Estimated quarterly cost', '/quarter'], semiannually: ['Estimated semiannual cost', '/6 months'], annually: ['Estimated annual cost', '/yr'] };
  const [label, suffix] = common ? labels[common] ?? labels.monthly : ['Estimated monthly equivalent', '/mo'];
  return { display: combineRateDisplays(items.map(item => common ? item.display : item.monthly)), label, suffix };
}
export function useApplicationEstimates(values: ApplicationFormValues) {
  const coverages = getActiveClientCoverages();
  const entries = useMemo(() => getOrderedDecisionEntries(values, coverages), [values, coverages]);
  const requests = entries.map(entry => ({ productKey: entry.coverageId, applicant: entry.applicant, amount: getCoverageAmountRequested(values, entry.coverageId, entry.applicant) ?? 0 }));
  const rates = usePrototypeRates(requests, values, 'monthly', 'coverage');
  const library = getPrototypeLibrary();
  const hidden = library && associationRatesSuppressed(library.site, values);
  const items = entries.map((entry, index) => {
    const period = paymentPeriod(values[`payment-frequency:${entry.coverageId}`]);
    const display: RateDisplayState = hidden ? { status: 'hidden' } : rates.enabled ? rates.display(`${entry.coverageId}:${entry.applicant}`) : requests[index].amount > 0 ? rateDisplayForAmount(productMonthlyPremium(entry.coverage, entry.applicant, requests[index].amount, values.coverageRiders as Record<string, boolean> | undefined, values.coverageRiderAmounts as Record<string, number> | undefined) * period.months) : { status: 'needs-information' };
    return { id: `${entry.coverageId}:${entry.applicant}`, name: `${entry.coverage.name} · ${getContent().shared.applicantLabels[entry.applicant]}`, period: period.label, display, monthly: monthlyEquivalent(display, period.months) };
  });
  return { items, ...estimateSummary(items) };
}
