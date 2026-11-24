import type { RateModifierPolicy } from './rateModifiers';
import type { CoverageJourneyPolicy } from './coverageJourneyPolicy';
import type { PaymentFrequency, PaymentMethod } from './paymentPolicy';

export type QuotePriceComponent = { key: string; kind: 'base' | 'rider' | 'fee' | 'adjustment'; amount: number; label?: string; riderIndex?: number };

/** Itemization is optional provider data, never inferred from a quoted total. */
export function validRateBreakdown(value: unknown, total: number, riderCount = Infinity): value is QuotePriceComponent[] {
  if (!Array.isArray(value) || !value.length || value.length > 100 || new Set(value.map(row => row?.key)).size !== value.length) return false;
  if (value.some(row => !row || typeof row.key !== 'string' || !row.key.trim() || !['base', 'rider', 'fee', 'adjustment'].includes(row.kind) || !Number.isFinite(row.amount) || row.kind !== 'adjustment' && row.amount < 0 || row.label !== undefined && (typeof row.label !== 'string' || !row.label.trim()) || row.kind === 'rider' && (!Number.isSafeInteger(row.riderIndex) || row.riderIndex < 0 || row.riderIndex >= riderCount))) return false;
  return Number.isFinite(total) && Math.round(value.reduce((sum, row) => sum + row.amount, 0) * 100) === Math.round(total * 100);
}

/** Apply the same ordered modifiers and billing values used by the quote. */
export function billedRateBreakdown(value: unknown, rawAnnual: number, riderCount: number, rules: RateModifierPolicy['rules'], billing: CoverageJourneyPolicy['billing'], payment: { method: PaymentMethod; frequency: PaymentFrequency }, total: number): QuotePriceComponent[] | undefined {
  if (!validRateBreakdown(value, rawAnnual, riderCount)) return undefined;
  let items = value.map(row => ({ ...row }));
  for (const rule of rules) {
    if (rule.effect.kind === 'multiply') items = items.map(row => ({ ...row, amount: row.amount * rule.effect.value }));
    else items.push({ key: `modifier:${rule.key}`, kind: 'fee', amount: rule.effect.value, ...(rule.label ? { label: rule.label } : {}) });
  }
  const annual = items.reduce((sum, row) => sum + row.amount, 0);
  if (billing.annualCredit > 0) items.push({ key: 'billing-credit', kind: 'adjustment', amount: -Math.min(annual, billing.annualCredit) });
  items = items.map(row => ({ ...row, amount: row.amount * billing.annualFactors[payment.frequency] }));
  if (billing.feePerCollection[payment.method] > 0) items.push({ key: 'collection-fee', kind: 'fee', amount: billing.feePerCollection[payment.method] });
  items = items.map(row => ({ ...row, amount: Math.round(row.amount * 100) / 100 }));
  const balance = Math.round(total * 100) - items.reduce((sum, row) => sum + Math.round(row.amount * 100), 0);
  const largest = items.reduce((index, row, next) => Math.abs(row.amount) > Math.abs(items[index].amount) ? next : index, 0);
  items[largest].amount = (Math.round(items[largest].amount * 100) + balance) / 100;
  return validRateBreakdown(items, total, riderCount) ? items : undefined;
}
