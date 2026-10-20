import { expect, it } from 'vitest';
import { applicationPdfLines, jpegPagesToPdf } from './applicationPdf';

it('includes collected application/health/payment data and leaves iframe health history blank', () => {
  const lines = applicationPdfLines({ 'first-name': 'Avery', 'last-name': 'Mock', 'health-di-q1': 'yes', 'health-di-q1-details': [{ details: 'Synthetic detail' }], 'payment-method:li-term': 'bill-me', 'health-qd-iframe-data': 'Never included' } as unknown as import('../app/ApplicationFormContext').ApplicationFormValues);
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
