import { expect, it } from 'vitest';
import { riderDescription } from './riderDescription';
import { validateProductCatalog } from './requirementProductCatalog.mjs';
import products from '../../requirements/global/products.json';
it('scopes authored rider wording while retaining the generic overview', () => {
  const rider = products.catalog.riders.find(row => row.definition.id === 'cir')!.definition;
  expect(riderDescription(rider, 'member')).toBe('Chronic illness coverage from $50,000 to $1,000,000 for members.');
  expect(riderDescription(rider, 'spouse')).toBe('Chronic illness coverage from $25,000 to $1,000,000 for spouses.');
  expect(riderDescription({ ...rider, dependentApplicant: 'spouse' }, 'member')).toContain('for spouses.');
  expect(rider.description).toContain('members and');
  expect(riderDescription({ description: 'A shared benefit' }, 'member')).toBe('A shared benefit');
});
it('rejects unsupported applicants or empty scoped wording in source definitions', () => {
  const changed = structuredClone(products);
  Object.assign(changed.catalog.riders[0].definition, { applicantDescriptions: { invalid: 'Unsupported' } });
  expect(() => validateProductCatalog(changed.catalog, 'global')).toThrow('Invalid rider applicant descriptions');
});
