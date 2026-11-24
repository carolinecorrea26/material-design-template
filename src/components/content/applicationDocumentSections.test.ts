import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { validateSharedCatalog } from '../../persistence/sharedCatalog';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../../domain/prototypeLibrary';
import { buildDocumentSections } from './applicationDocumentSections';
import { getClientPageFields } from '../../config/clientFields/getClientPageFields';
import { getActiveClientCoverages } from '../../config/client/getActiveClientCoverages';

const catalog = validateSharedCatalog(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')));
let library: ReturnType<typeof resolvePrototypeLibrary>;
const base = { membership: 'yes', 'birth-date': '1990-01-01', 'state-province': 'NY', 'zip-postal-code': '10001', coverageSelections: ['li-term'], productApplicants: { 'li-term': ['member'] }, coverageAmounts: { 'li-term:member': 100000 } };
beforeEach(() => { window.history.replaceState(null, '', '/review?site=asce'); library = resolvePrototypeLibrary(catalog.data, 'asce', 'review-rules'); installPrototypeLibrary(library); });
afterEach(() => installPrototypeLibrary(null));
it('masks SSNs and omits empty sections from Review', () => {
  const sections = buildDocumentSections({ ...base, 'social-security-number': '123456789' });
  const text = JSON.stringify(sections);
  expect(text).toContain('***-**-6789');
  expect(text).not.toContain('123456789');
  expect(sections.some(section => section.title === 'Beneficiary')).toBe(false);
  expect(sections.some(section => section.title === 'Contact')).toBe(false);
});
it('uses the same Site financial threshold on Profile and its Review preview', () => {
  library.site.configuration.features.find(feature => feature.key === 'feature-financial-questionnaire')!.enabled = true;
  library.site.configuration.financialQuestionnairePolicies = [{ value: { version: 1, enabled: true, applicant: 'member', rules: [{ productKeys: ['di-ltd'], minimumAmount: 3000, inclusive: true }], sourceReferences: ['Synthetic test policy'] } }] as never;
  const values = { ...base, coverageSelections: ['di-ltd'], productApplicants: { 'di-ltd': ['member'] }, coverageAmounts: { 'di-ltd:member': 3000 }, 'total-net-worth': '$90,000' };
  expect(JSON.stringify(buildDocumentSections(values))).toContain('90,000');
  expect(JSON.stringify(buildDocumentSections({ ...values, coverageAmounts: { 'di-ltd:member': 2999 } }))).not.toContain('90,000');
  library.site.configuration.financialQuestionnairePolicies[0].value.enabled = false;
  expect(JSON.stringify(buildDocumentSections(values))).not.toContain('90,000');
});
it('shows collected child details only when child coverage is applied for', () => {
  const product = getActiveClientCoverages().find(product => product.applicants.includes('child'))!;
  expect(product).toBeDefined();
  const collection = library.fieldCollections.children;
  const item = Object.fromEntries(collection.mapping.fields.filter(field => /first-name$/.test(field.id)).map(field => [collection.mapping.fieldToKey[field.id], 'ChildExample']));
  const values = { ...base, dependents: ['child'], children: [item], coverageSelections: [product.id], productApplicants: { [product.id]: ['member', 'child'] }, coverageAmounts: { [`${product.id}:member`]: 100000, [`${product.id}:child`]: 10000 } };
  expect(JSON.stringify(buildDocumentSections(values))).toContain('ChildExample');
  expect(JSON.stringify(buildDocumentSections({ ...values, productApplicants: { [product.id]: ['member'] } }))).not.toContain('ChildExample');
});
it('uses QD-only personal questions and Country while hiding stale non-QD answers', () => {
  const values = { ...base, 'intend-live-outside-us': 'yes' };
  const fields = getClientPageFields('profile', values);
  expect(fields.find(field => field.id === 'intend-live-outside-us')?.label).toBe('Do you intend to reside outside the U.S. or Canada for more than six months?');
  expect(fields.some(field => field.id === 'outside-us-country')).toBe(true);
  expect(fields.some(field => field.id === 'outside-us-months')).toBe(false);
  const fuw = getClientPageFields('profile', { ...values, 'birth-date': '1963-01-01', coverageSelections: ['li-10yr'], productApplicants: { 'li-10yr': ['member'] }, coverageAmounts: { 'li-10yr:member': 700000 } });
  for (const id of ['weight-12-months-ago-lbs', 'has-drivers-license', 'drivers-license-number', 'drivers-license-state', 'intend-live-outside-us', 'outside-us-country', 'outside-us-months']) expect(fuw.some(field => field.id === id), id).toBe(false);
});

it('omits stale answers and records for categories no longer selected', () => {
  const lifeOnly = { ...base, 'has-disability-insurance': 'yes', selfDisabilityCompanies: [{ company: 'StaleDisabilityCarrier', monthlyBenefitAmount: '1200', benefitPeriod: 'Age 65', waitingPeriod: '90 days' }] };
  expect(JSON.stringify(buildDocumentSections(lifeOnly))).not.toContain('StaleDisabilityCarrier');
  const disabilityOnly = { ...base, coverageSelections: ['di-ltd'], productApplicants: { 'di-ltd': ['member'] }, coverageAmounts: { 'di-ltd:member': 3000 }, 'has-other-life-insurance': 'yes', 'pending-life-insurance-company': 'StaleLifeCarrier' };
  expect(JSON.stringify(buildDocumentSections(disabilityOnly))).not.toContain('StaleLifeCarrier');
});

it('does not preview financial answers when the effective Site feature is disabled', () => {
  library.site.configuration.financialQuestionnairePolicies = [{ value: { version: 1, enabled: true, applicant: 'member', rules: [{ productKeys: ['di-ltd'], minimumAmount: 1, inclusive: true }], sourceReferences: ['Synthetic policy'] } }] as never;
  const values = { ...base, coverageSelections: ['di-ltd'], productApplicants: { 'di-ltd': ['member'] }, coverageAmounts: { 'di-ltd:member': 3000 }, 'total-net-worth': '$987654' };
  expect(JSON.stringify(buildDocumentSections(values))).not.toContain('987,654');
});


it('omits beneficiaries for declined participation, removed products/applicants and zero amounts', () => {
  const record = { designation: 'primary', beneficiaryType: 'individual', firstName: 'CurrentBeneficiary', lastName: 'Example', relationship: 'Child', share: 100 };
  const stale = { ...record, firstName: 'StaleBeneficiary' };
  const values = { ...base, 'beneficiary-information-opt-in': 'yes', beneficiaries: { 'li-term:member': [record], 'li-10yr:member': [stale], 'li-term:spouse': [stale] } };
  const text = JSON.stringify(buildDocumentSections(values));
  expect(text).toContain('CurrentBeneficiary'); expect(text).not.toContain('StaleBeneficiary');
  expect(JSON.stringify(buildDocumentSections({ ...values, 'beneficiary-information-opt-in': 'no' }))).not.toContain('CurrentBeneficiary');
  expect(JSON.stringify(buildDocumentSections({ ...values, coverageAmounts: { 'li-term:member': 0 } }))).not.toContain('CurrentBeneficiary');
});

it('uses configured product order rather than saved selection order and omits disabled pages', () => {
  library.client.coverages.productOrder = ['li-20yr', 'li-term'];
  const values = { ...base, coverageSelections: ['li-term', 'li-20yr'], productApplicants: { 'li-term': ['member'], 'li-20yr': ['member'] }, coverageAmounts: { 'li-term:member': 100000, 'li-20yr:member': 100000 }, 'street-address': 'HiddenAddressExample' };
  const coverage = buildDocumentSections(values).find(section => section.title === 'Coverage')!;
  expect(coverage.groups.map(group => group.coverageKey)).toEqual(['li-20yr:member', 'li-term:member']);
  library.pages.find(page => page.key === 'contact')!.enabled = false;
  expect(JSON.stringify(buildDocumentSections(values))).not.toContain('HiddenAddressExample');
});
