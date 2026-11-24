import { readFileSync } from 'node:fs';
import { afterEach, expect, it } from 'vitest';
import { installPrototypeLibrary, resolvePrototypeLibrary } from './prototypeLibrary';
import { getOrderedDecisionEntries } from '../utils/coverageDecisions';
afterEach(() => installPrototypeLibrary(null));
it('preserves the supplied effective product order and stable member/spouse/child order', () => {
  const library = resolvePrototypeLibrary(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')).data, 'asce', 'receipt-order');
  installPrototypeLibrary(library);
  const products = ['di-ltd', 'li-term', 'li-20yr'].map(id => library.products.find(product => product.id === id)!);
  const entries = getOrderedDecisionEntries({ membership: 'yes', 'state-province': 'PA', 'birth-date': '1990-01-01', 'spouse-birth-date': '1991-01-01', dependents: ['spouse', 'child'], coverageSelections: ['li-20yr', 'li-term', 'di-ltd'], productApplicants: { 'li-20yr': ['member'], 'li-term': ['child', 'spouse', 'member'], 'di-ltd': ['member'], 'li-10yr': ['spouse'] }, coverageAmounts: { 'di-ltd:member': 1000, 'li-term:member': 100000, 'li-term:spouse': 100000, 'li-term:child': 10000, 'li-20yr:member': 100000 } }, products);
  expect(entries.map(entry => `${entry.coverageId}:${entry.applicant}`)).toEqual(['di-ltd:member', 'li-term:member', 'li-term:spouse', 'li-term:child', 'li-20yr:member']);
});
