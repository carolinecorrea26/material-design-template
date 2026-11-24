import { expect, it } from 'vitest';
import { validateBeneficiaryRecords } from './beneficiaryValidation';
import type { ResolvedFieldSurface } from './fieldSurfaces';

const individual: ResolvedFieldSurface = { pageKey: 'beneficiary', label: 'Beneficiary', maxItems: 1, mapping: { fields: [{ id: 'beneficiary-firstName', label: 'Saved name', inputType: 'text', required: true }, { id: 'beneficiary-share', label: 'Share', inputType: 'text', required: true, format: 'percent' }], fieldToKey: { 'beneficiary-firstName': 'givenName', 'beneficiary-share': 'allocation' }, gridFields: [] } };
const trust: ResolvedFieldSurface = { pageKey: 'beneficiary', label: 'Trust', maxItems: 1, mapping: { fields: [{ id: 'beneficiary-trustName', label: 'Trust name', inputType: 'text', required: true }], fieldToKey: { 'beneficiary-trustName': 'trustName' }, gridFields: [] } };
const item = { designation: 'primary', beneficiaryType: 'individual', givenName: 'Test', allocation: '100' };
it('validates restored beneficiary requirements and allocations through stored bindings', () => {
  expect(validateBeneficiaryRecords([item], individual, trust)).toBeUndefined();
  expect(validateBeneficiaryRecords([{ ...item, givenName: '' }], individual, trust)).toContain('Saved name');
  expect(validateBeneficiaryRecords([{ ...item, allocation: '101' }], individual, trust)).toContain('100%');
  expect(validateBeneficiaryRecords([item, item], individual, trust)).toContain('at most 1');
});
it('retains designation and trust business rules independently of authored labels', () => {
  expect(validateBeneficiaryRecords([null], individual, trust)).toContain('Update');
  expect(validateBeneficiaryRecords([{ ...item, designation: 'unknown' }], individual, trust)).toContain('designation');
  expect(validateBeneficiaryRecords([{ designation: 'primary', beneficiaryType: 'trust', trustName: 'Test trust' }], individual, trust)).toBeUndefined();
});

it('uses the canonical whole-percentage format and validates the total across records', () => {
  const surface = { ...individual, maxItems: 3 };
  const rows = [33, 33, 34].map(allocation => ({ ...item, allocation: String(allocation) }));
  expect(validateBeneficiaryRecords(rows, surface, trust)).toBeUndefined();
  expect(validateBeneficiaryRecords([{ ...item, allocation: '33.333' }], surface, trust)).toContain('percent');
  expect(validateBeneficiaryRecords([...rows.slice(0, 2), { ...item, allocation: '35' }], surface, trust)).toContain('100%');
  for (const allocation of ['50.5', '1e2', '0x64', '100%']) expect(validateBeneficiaryRecords([{ ...item, allocation }], surface, trust)).toBeTruthy();
});

it.each(['primary', 'contingent'])('requires 100%% for populated %s individuals only on Next', designation => {
  const otherRecords = designation === 'contingent' ? [item] : [];
  const partial = [{ ...item, designation, allocation: '50' }];
  expect(validateBeneficiaryRecords(partial, individual, trust)).toBeUndefined();
  expect(validateBeneficiaryRecords([...otherRecords, ...partial], individual, trust, 'next')).toContain('total 100%');
  expect(validateBeneficiaryRecords([...otherRecords, { ...item, designation }], individual, trust, 'next')).toBeUndefined();
  expect(validateBeneficiaryRecords([...otherRecords, { designation, beneficiaryType: 'trust', trustName: 'Test trust' }], individual, trust, 'next')).toBeUndefined();
});

it('checks designation totals independently through authored bindings', () => {
  const surface = { ...individual, maxItems: 2 };
  const rows = ['primary', 'contingent'].flatMap(designation => [
    { ...item, designation, allocation: '40' }, { ...item, designation, allocation: '60' },
  ]);
  expect(validateBeneficiaryRecords(rows, surface, trust, 'next')).toBeUndefined();
  expect(validateBeneficiaryRecords([{ ...item, allocation: '40' }, { ...item, designation: 'contingent', allocation: '60' }], surface, trust, 'next')).toContain('total 100%');
  expect(validateBeneficiaryRecords([], surface, trust, 'next')).toContain('Primary');
});

it.each([
  { ...item, designation: 'contingent' },
  { designation: 'contingent', beneficiaryType: 'trust', trustName: 'Test trust' },
])('requires a primary on Next even when contingent records are complete: %j', contingent => {
  expect(validateBeneficiaryRecords([contingent], individual, trust)).toBeUndefined();
  expect(validateBeneficiaryRecords([contingent], individual, trust, 'next')).toContain('Primary');
  expect(validateBeneficiaryRecords([item, contingent], individual, trust, 'next')).toBeUndefined();
  expect(validateBeneficiaryRecords([{ designation: 'primary', beneficiaryType: 'trust', trustName: 'Primary trust' }, contingent], individual, trust, 'next')).toBeUndefined();
});
