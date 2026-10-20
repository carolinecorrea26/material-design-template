// @vitest-environment node
import { createHash } from 'node:crypto';
import { expect, it } from 'vitest';
import { enrollmentQrDataUrl, enrollmentQrMatrix } from './authenticator-qr.mjs';

// This fixture was independently decoded by macOS Vision and matched the URI.
const uri = 'otpauth://totp/Portal%20Mock:caroline?secret=ABCDEFGHIJKLMNOPQRSTUVWXYZ234567&issuer=Portal%20Mock&algorithm=SHA1&digits=6&period=30';
it('preserves the independently scanned enrollment matrix and a four-module quiet zone', () => {
  const matrix = enrollmentQrMatrix(uri);
  expect(matrix).toHaveLength(49);
  expect(createHash('sha256').update(JSON.stringify(matrix)).digest('hex')).toBe('55c529456daaaf6569bbecf8912ab29394459764f328530c2860efbbcf87bd13');
  const url = enrollmentQrDataUrl(uri);
  expect(url).toMatch(/^data:image\/svg\+xml;base64,/);
  const svg = Buffer.from(url.split(',')[1], 'base64').toString('utf8');
  expect(svg).toContain('viewBox="0 0 57 57"');
  expect(svg).not.toContain(uri);
  expect(svg).not.toContain('<script');
});
it('rejects oversized input instead of generating a truncated credential', () => {
  expect(() => enrollmentQrMatrix('a'.repeat(192))).not.toThrow();
  expect(() => enrollmentQrMatrix('a'.repeat(193))).toThrow('capacity');
  expect(() => enrollmentQrMatrix('é'.repeat(97))).toThrow('capacity');
});
