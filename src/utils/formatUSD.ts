export function formatUSD(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return "Estimate unavailable";
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
