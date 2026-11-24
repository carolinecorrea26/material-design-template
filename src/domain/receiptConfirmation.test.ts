import { afterEach, expect, it } from 'vitest';
import { clearReceiptConfirmation, receiptConfirmationNumber, receiptConfirmationStorageKey } from './receiptConfirmation';
afterEach(() => sessionStorage.clear());
it('uses a supplied submission reference and keeps a local reference stable for the same application', () => {
  expect(receiptConfirmationNumber('asce', { 'mock-submission-id': '  SUPPLIED-1  ' })).toBe('SUPPLIED-1');
  const number = receiptConfirmationNumber('asce', { 'mock-submission-id': ' ' }, 'application-1');
  expect(number).toMatch(/^APP-[A-F0-9]{12}$/);
  expect(receiptConfirmationNumber('asce', {}, 'application-1')).toBe(number);
  expect(receiptConfirmationNumber('asce', {}, 'application-2')).not.toBe(number);
});
it('isolates Sites and clears only the current Site when starting over', () => {
  const a = receiptConfirmationNumber('asce', {}), b = receiptConfirmationNumber('synthetic', {});
  expect(a).not.toBe(b);
  clearReceiptConfirmation('asce');
  expect(receiptConfirmationNumber('asce', {})).not.toBe(a);
  expect(receiptConfirmationNumber('synthetic', {})).toBe(b);
});
it('ignores old unscoped references and replaces malformed cache data', () => {
  sessionStorage.setItem('receiptConfirmationNumber', 'ANOTHER-SITE');
  sessionStorage.setItem(receiptConfirmationStorageKey('asce'), '{broken');
  expect(receiptConfirmationNumber('asce', {})).not.toBe('ANOTHER-SITE');
});
