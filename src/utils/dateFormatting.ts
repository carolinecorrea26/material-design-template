/** Parse stored ISO date (YYYY-MM-DD) to display format (MM/DD/YYYY) */
export function parseStoredDate(value: string): string {
  if (!value) return "";
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  return `${match[2]}/${match[3]}/${match[1]}`;
}

/** Convert display date (MM/DD/YYYY) to storage format (YYYY-MM-DD) */
export function formatDateForStorage(display: string): string {
  const digits = display.replace(/\D/g, "");
  if (digits.length !== 8) return "";
  const mm = digits.slice(0, 2);
  const dd = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);
  return `${yyyy}-${mm}-${dd}`;
}

/** Format raw digit input as a date display (MM/DD/YYYY) with slashes */
export function formatDateDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

// ─── Month/Year helpers ───────────────────────────────────────────────────────

/** Parse stored month-year (YYYY-MM) to display format (MM/YYYY) */
export function parseStoredMonthYear(value: string): string {
  if (!value) return "";
  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) return value;
  return `${match[2]}/${match[1]}`;
}

/** Convert display month-year (MM/YYYY) to storage format (YYYY-MM) */
export function formatMonthYearForStorage(display: string): string {
  const digits = display.replace(/\D/g, "");
  if (digits.length !== 6) return "";
  const mm = digits.slice(0, 2);
  const yyyy = digits.slice(2, 6);
  return `${yyyy}-${mm}`;
}

/** Format raw digit input as MM/YYYY with a slash */
export function formatMonthYearDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 6);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}
