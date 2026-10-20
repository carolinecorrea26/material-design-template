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
