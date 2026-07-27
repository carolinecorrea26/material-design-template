/**
 * Formats a raw digit string as a currency display value (e.g. "1234567" → "$1,234,567").
 * Only allows up to 12 digits. Returns empty string for empty input.
 */
export function formatCurrencyInput(value: string): string {
  const digits = value.replace(/[^0-9]/g, "").slice(0, 12);
  if (!digits) return "";
  return `$${Number(digits).toLocaleString("en-US")}`;
}
