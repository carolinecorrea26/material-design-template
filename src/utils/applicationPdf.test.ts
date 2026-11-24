import { readFileSync } from 'node:fs';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../domain/prototypeLibrary';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { applicationPdfLines, jpegPagesToPdf } from './applicationPdf';

const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
beforeEach(() => installPrototypeLibrary(resolvePrototypeLibrary(catalog.data, 'asce', 'pdf:fresh-source')));
afterEach(() => installPrototypeLibrary(null));

it('includes collected application/health/payment data and leaves iframe health history blank', () => {
  const lines = applicationPdfLines({ 'payment-information-opt-in': 'yes', membership: 'yes', coverageSelections: ['li-term'], productApplicants: { 'li-term': ['member'] }, coverageAmounts: { 'li-term:member': 100000 }, 'first-name': 'Avery', 'last-name': 'Mock', 'health-di-q1': 'yes', 'health-di-q1-details': [{ details: 'Synthetic detail' }], 'payment-method:li-term': 'bill-me', 'health-qd-iframe-data': 'Never included' } as unknown as import('../app/ApplicationFormContext').ApplicationFormValues);
  const text = lines.map(line => line.text).join('\n');
  expect(text).toContain('Avery'); expect(text).toContain('Synthetic detail'); expect(text).toContain('bill-me');
  expect(text).not.toContain('Never included');
  expect(text).toContain('QuickDecision health history: ');
  expect(applicationPdfLines({ 'health-di-q1': 'yes', 'bank-institution': 'Mock bank' }, true).map(line => line.text).join('\n')).not.toContain('health di');
});

it('writes PDF page objects and byte offsets around binary image content', async () => {
  const blob = jpegPagesToPdf([new Uint8Array([255, 216, 255, 217]), new Uint8Array([255, 216, 255, 217])], 1190, 1684);
  const bytes = await new Promise<ArrayBuffer>(resolve => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as ArrayBuffer); reader.readAsArrayBuffer(blob); });
  const text = new TextDecoder().decode(bytes);
  expect(blob.type).toBe('application/pdf'); expect(text).toContain('/Count 2');
  const xref = Number(/startxref\n(\d+)/.exec(text)![1]);
  expect(new TextDecoder().decode(bytes.slice(xref, xref + 4))).toBe('xref');
});

it('omits retained bank and removed-product answers from the generated payment document', () => {
  const text = applicationPdfLines({ 'payment-information-opt-in': 'yes', coverageSelections: ['li-term'], productApplicants: { 'li-term': ['member'] }, coverageAmounts: { 'li-term:member': 100000 }, 'payment-method:li-term': 'bill-me', 'payment-frequency:li-term': 'monthly', 'payment-method:removed': 'bank-account', 'bank-account-number': '000123456', 'bank-institution': 'Retained hidden bank' }, true).map(line => line.text).join('\n');
  expect(text).toContain('bill-me');
  expect(text).not.toContain('bank-account');
  expect(text).not.toContain('000123456');
  expect(text).not.toContain('Retained hidden bank');
});
