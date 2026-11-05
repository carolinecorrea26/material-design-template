import type { ReferenceRateTable } from './ratePresentation';
import type { quoteCandidateWithMock } from './mockRating';

/** UI presentation is explicit: a missing number is never evidence of a service failure. */
export type RateDisplayState =
  | { status: 'available'; amount: number }
  | { status: 'loading'; previousAmount?: number }
  | { status: 'unavailable'; reason: 'technical' }
  | { status: 'reference-table'; table: ReferenceRateTable }
  | { status: 'needs-information' }
  | { status: 'provided-separately'; message?: string }
  | { status: 'hidden' };

export function rateDisplayForAmount(amount: number): RateDisplayState {
  return Number.isFinite(amount) && amount >= 0 ? { status: 'available', amount } : { status: 'needs-information' };
}
export function rateDisplayFromQuote(quote: Awaited<ReturnType<typeof quoteCandidateWithMock>>): RateDisplayState {
  if (quote.displayPrice && quote.amount !== null) return rateDisplayForAmount(quote.amount);
  if ('failureKind' in quote && quote.failureKind === 'technical') return { status: 'unavailable', reason: 'technical' };
  if (quote.status === 'needs-information' || 'failureKind' in quote && quote.failureKind === 'inputs') return { status: 'needs-information' };
  return { status: 'provided-separately' };
}
export function combineRateDisplays(states: RateDisplayState[]): RateDisplayState {
  if (!states.length || states.every(state => state.status === 'hidden')) return { status: 'hidden' };
  if (states.some(state => state.status === 'unavailable')) return { status: 'unavailable', reason: 'technical' };
  if (states.some(state => state.status === 'loading')) return { status: 'loading' };
  if (states.every(state => state.status === 'available')) return { status: 'available', amount: Math.round(states.reduce((sum, state) => sum + state.amount, 0) * 100) / 100 };
  if (states.some(state => state.status === 'needs-information')) return { status: 'needs-information' };
  return { status: 'provided-separately', message: states.some(state => state.status === 'reference-table') ? 'See rate tables for the total cost.' : 'Total cost provided separately.' };
}
