import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { installPrototypeLibrary, resolvePrototypeLibrary } from './prototypeLibrary';
import { receiptHasTechnicalIssue, receiptNeedsUnderwritingNote } from './receiptPresentation';
import { getDecisionStatus, readQdDecisionResult, type QdDecisionResult, type SelectedCoverageEntry } from '../utils/coverageDecisions';
import type { CoverageUnderwritingType } from './coverage';
const library = resolvePrototypeLibrary(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')).data, 'asce', 'receipt-presentation');
const policy = library.client.reviewPolicy!;
beforeEach(() => installPrototypeLibrary(library));
afterEach(() => installPrototypeLibrary(null));
function entry(type: CoverageUnderwritingType, id = 'li-term', applicant: 'member' | 'spouse' | 'child' = 'member'): SelectedCoverageEntry {
  return { coverageId: id, coverage: library.products.find(product => product.id === id)!, applicant, underwriting: { status: 'resolved', underwritingType: type } };
}
it.each(['conditionally-approved', 'referred', 'soft-declined', 'database-unavailable'] as QdDecisionResult[])('preserves the explicit QD outcome and applicable next-step rule: %s', result => {
  const entries = [entry('QD')], values = { qdDecisions: { 'li-term:member': result } };
  expect(readQdDecisionResult(values, 'li-term', 'member')).toBe(result);
  expect(receiptHasTechnicalIssue(entries, values)).toBe(false);
  expect(receiptNeedsUnderwritingNote(entries, values, policy)).toBe(['referred', 'database-unavailable'].includes(result));
});
it.each([undefined, null, [], 'approved', { 'li-term:member': 'unknown' }, { 'li-term:spouse': 'referred' }])('treats missing/unrecognized results as technical issues, never database failures or invented referrals: %j', qdDecisions => {
  const entries = [entry('QD')], values = { qdDecisions };
  expect(readQdDecisionResult(values, 'li-term', 'member')).toBeUndefined();
  expect(receiptHasTechnicalIssue(entries, values)).toBe(true);
  expect(receiptNeedsUnderwritingNote(entries, values, policy)).toBe(false);
});
it('retains standard adult medical review and omits medical guidance for AD&D, children and unresolved requirements', () => {
  for (const type of ['FUW', 'SI', 'TELE'] as const) expect(receiptNeedsUnderwritingNote([entry(type)], {}, policy)).toBe(true);
  expect(receiptNeedsUnderwritingNote([entry('NA', 'li-add')], {}, policy)).toBe(false);
  expect(receiptNeedsUnderwritingNote([entry('FUW', 'li-term', 'child')], {}, policy)).toBe(false);
  const unresolved = { ...entry('QD'), underwriting: { status: 'unresolved' as const } };
  expect(receiptHasTechnicalIssue([unresolved], {})).toBe(true);
  expect(receiptNeedsUnderwritingNote([unresolved], {}, policy)).toBe(false);
});
it('shows guidance for mixed outcomes only when one applicable product is actually sent for review', () => {
  const entries = [entry('QD'), entry('QD', 'li-10yr', 'spouse')];
  const values = { qdDecisions: { 'li-term:member': 'conditionally-approved', 'li-10yr:spouse': 'soft-declined' } };
  expect(receiptNeedsUnderwritingNote(entries, values, policy)).toBe(false);
  values.qdDecisions['li-10yr:spouse'] = 'referred';
  expect(receiptNeedsUnderwritingNote(entries, values, policy)).toBe(true);
});

it.each(['FUW', 'SI', 'GI', 'NA', 'TELE'] as const)('ignores a retained QD outcome for non-QD underwriting: %s', underwritingType => {
  expect(getDecisionStatus({ underwritingType, decisionResult: 'conditionally-approved' }).label).toBe(library.content.receipt.decisionStatuses.fullyUnderwritten.label);
});
