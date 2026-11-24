const prefix = 'receiptConfirmationNumber';
export const receiptConfirmationStorageKey = (siteKey: string) => `${prefix}:${siteKey}`;

/** Local prototype identity only. Production uses the returned submission reference. */
export function receiptConfirmationNumber(siteKey: string, values: Record<string, unknown>, applicationId?: string): string {
  const supplied = typeof values['mock-submission-id'] === 'string' ? values['mock-submission-id'].trim() : '';
  if (supplied) return supplied;
  const application = applicationId ?? 'local-draft';
  const key = receiptConfirmationStorageKey(siteKey);
  try {
    const stored = JSON.parse(sessionStorage.getItem(key) ?? 'null');
    if (stored?.application === application && typeof stored.number === 'string' && stored.number.trim()) return stored.number;
  } catch { /* Invalid local preview state is replaced, never used as a reference. */ }
  const number = `APP-${crypto.randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`;
  sessionStorage.setItem(key, JSON.stringify({ application, number }));
  return number;
}

export function clearReceiptConfirmation(siteKey: string) {
  sessionStorage.removeItem(receiptConfirmationStorageKey(siteKey));
  // Never read an old unscoped reference; clear it when starting a fresh application.
  sessionStorage.removeItem(prefix);
}
