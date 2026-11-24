import { createHash } from 'node:crypto';
import { expect, it } from 'vitest';
import { recordedFilesMatch } from './sourceEvidence';

const recorded = { 'owner.ts': createHash('sha256').update('captured owner').digest('hex') };
it('requires exact captured evidence and invalidates changed or missing owners', () => {
  expect(recordedFilesMatch(recorded, () => 'captured owner')).toBe(true);
  expect(recordedFilesMatch(recorded, () => 'replacement owner')).toBe(false);
  expect(recordedFilesMatch(recorded, () => { throw Object.assign(new Error('removed'), { code: 'ENOENT' }); })).toBe(false);
  expect(recordedFilesMatch({}, () => 'captured owner')).toBe(false);
});
it('preserves unexpected read failures rather than disguising them as missing evidence', () => {
  expect(() => recordedFilesMatch(recorded, () => { throw new Error('transport failure'); })).toThrow('transport failure');
});
