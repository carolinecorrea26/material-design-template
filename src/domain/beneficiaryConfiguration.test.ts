import { readFileSync } from 'node:fs';
import { afterEach, expect, it } from 'vitest';
import { freshStartSource } from './freshStartCatalog';
import { resolveMappedFields } from './requirementFieldDefinitions.mjs';
import { compileRequirementCatalog } from './requirementCatalog.mjs';
import { resolveEffectiveSite } from './effectiveSite';
import { installPrototypeLibrary } from './prototypeLibrary';

const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
const fields = () => structuredClone(freshStartSource().fields);
afterEach(() => installPrototypeLibrary(null));
it.each(['first-name', 'last-name', 'beneficiary-information-opt-in', 'beneficiary-relationship', 'beneficiary-share', 'beneficiary-trust-name', 'beneficiary-trust-date'])('keeps %s included and required in the Beneficiary placement', id => {
  const source = fields();
  const site = source.sites.asce as { fields: Record<string, unknown> };
  site.fields[id] = { required: { beneficiary: false } };
  const resolve = () => resolveMappedFields({ page: 'beneficiary' }, { source, siteId: 'asce', person: 'beneficiary' });
  expect(resolve).toThrow('Required mapped field cannot be optional');
  delete site.fields[id];
  (source.sitePages!.asce.beneficiary as { hide?: string[] }).hide = [id];
  expect(resolve).toThrow('Required mapped field cannot be hidden');
});

it('retains beneficiary labels and supported relationship subsets while preserving structural choices and share/date formats', () => {
  const source = fields(), site = source.sites.asce as { fields: Record<string, unknown> };
  const resolve = () => resolveMappedFields({ page: 'beneficiary' }, { source, siteId: 'asce', person: 'beneficiary' });
  site.fields['first-name'] = { label: { beneficiary: 'Given name' } };
  site.fields['beneficiary-relationship'] = { options: ['Parent', 'Other'] };
  expect(resolve().find(field => field.id === 'first-name')).toMatchObject({ label: 'Given name', required: true });
  expect(resolve().find(field => field.id === 'beneficiary-relationship')?.options?.map(option => option.value)).toEqual(['Parent', 'Other']);
  for (const [id, override] of [
    ['beneficiary-type', { options: ['individual'] }], ['beneficiary-information-opt-in', { options: ['yes'] }],
    ['beneficiary-share', { format: 'digits' }], ['beneficiary-trust-date', { inputMode: 'numeric' }],
  ] as const) {
    site.fields[id] = override;
    expect(resolve).toThrow('Fixed mapped field property');
    delete site.fields[id];
  }
});

it('rejects Beneficiary product/applicant policy assignments outside the effective Site offering', () => {
  const source = structuredClone(freshStartSource());
  const data = compileRequirementCatalog(catalog.data, source, 'asce');
  // A detached synthetic Site avoids the historical ASCE approval inspector;
  // this check targets the shared product/applicant configuration boundary.
  data.sites.find(row => row.key === 'asce')!.key = 'beneficiary-test';
  for (const rows of Object.values(data)) if (Array.isArray(rows)) for (const row of rows) {
    if (row && typeof row === 'object' && 'siteKey' in row && row.siteKey === 'asce') row.siteKey = 'beneficiary-test';
  }
  const key = 'shared.beneficiary-participation';
  data.configurationValues.push({ ...data.configurationValues[0], id: key, key, configurationKey: key, scope: 'site', siteKey: 'beneficiary-test', hostingAssociationKey: null, value: { version: 1, rules: [{ productKey: 'li-term', applicantKey: 'spouse', collect: true }] } });
  const options = { freshStart: false };
  expect(() => resolveEffectiveSite(data, 'beneficiary-test', options)).not.toThrow();
  data.siteProductApplicants = data.siteProductApplicants.filter(row => !(row.siteKey === 'beneficiary-test' && row.productKey === 'li-term' && row.applicantKey === 'spouse'));
  expect(() => resolveEffectiveSite(data, 'beneficiary-test', options)).toThrow('beneficiary participation policy applicant scope');
  data.configurationValues = data.configurationValues.filter(row => row.configurationKey !== key);
  expect(() => resolveEffectiveSite(data, 'beneficiary-test', options)).toThrow('beneficiary note policy applicant scope');
});
