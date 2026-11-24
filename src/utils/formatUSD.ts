import { requirementText } from '../domain/requirementContent';
export function formatUSD(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return requirementText('coverage.estimated-rate.estimate-unavailable');
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
