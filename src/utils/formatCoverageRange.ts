import { requirementText } from '../domain/requirementContent';
import { formatUSD } from './formatUSD';

/** Shared range presentation for coverage panels and the application header. */
export function formatCoverageRange({ minAmount, maxAmount }: { minAmount?: number; maxAmount?: number }) {
  if (minAmount == null && maxAmount == null) return requirementText('coverage.summary.variable-amount');
  if (minAmount != null && maxAmount != null) return minAmount === maxAmount ? formatUSD(minAmount, 0) : requirementText('coverage.summary.amount-range', { minimum: formatUSD(minAmount, 0), maximum: formatUSD(maxAmount, 0) });
  if (minAmount != null) return requirementText('coverage.summary.starting-at', { minimum: formatUSD(minAmount, 0) });
  return requirementText('coverage.summary.up-to', { maximum: formatUSD(maxAmount!, 0) });
}
