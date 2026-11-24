import { completePrototypeQdOutcomes } from './prototypeQdOutcomes';
import { noEligibleProductsMessage, applicationProductEligibility } from './coverageRuntime';
import { readFileSync } from 'node:fs';
import { afterEach, expect, it } from 'vitest';
import { installPrototypeLibrary, resolvePrototypeLibrary } from './prototypeLibrary';
import { validateApplicationCoverages, validateCoverageSubmission } from './coverageRuntime';
import { buildSelectedCoverageEntries } from '../utils/coverageDecisions';
import { paymentProducts } from './paymentProducts';
import { applicationUnderwritingContext } from './quickDecisionPolicy';
import { applicantPortfolioProducts } from './portfolioHealthParticipation';
import { coverageLifeMaximumError } from './coverageSubmitValidation';
import { freshStartSource } from './freshStartCatalog';
import { selectedApplicationApplicants } from './applicantParticipation';

const data = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')).data;
const base = { membership: 'yes', 'birth-date': '1990-01-01', 'spouse-birth-date': '1940-01-01', 'state-province': 'NY', gender: 'male', smoker: 'no' };
afterEach(() => installPrototypeLibrary(null));
const load = () => { const library = resolvePrototypeLibrary(data, 'asce', 'authority-regression'); installPrototypeLibrary(library); return library; };

it('uses the same active people for validation, summaries, payment and underwriting after a dependent is removed', () => {
  const library = load();
  const values = { ...base, dependents: [], coverageSelections: ['li-10yr'], productApplicants: { 'li-10yr': ['member', 'spouse'] }, coverageAmounts: { 'li-10yr:member': 100000, 'li-10yr:spouse': 100000 } };
  expect(buildSelectedCoverageEntries(values, library.products).map(e => e.applicant)).toEqual(['member']);
  expect(paymentProducts(values, library.products)[0].applicants.map(e => e.applicant)).toEqual(['member']);
  expect(validateCoverageSubmission(library.products, values)).toBeUndefined();
  expect(applicantPortfolioProducts(library.site, 'spouse', values)).toEqual([]);
  expect(applicationUnderwritingContext(library.site, 'li-10yr', 'member', values).portfolio).toEqual([{ productKey: 'li-10yr', applicantKey: 'member', amount: 100000 }]);
  expect(values.productApplicants['li-10yr']).toContain('spouse'); // Retained draft answers are preserved.
  expect(validateApplicationCoverages(library.products, { ...values, dependents: ['spouse'] })).toContain('eligibility requirements');
});

it('rejects a selected product with no remaining active applicants and ignores stale products', () => {
  const library = load();
  const values = { ...base, dependents: [], coverageSelections: ['li-10yr'], productApplicants: { 'li-10yr': ['spouse'], 'li-20yr': ['member'] }, coverageAmounts: { 'li-10yr:spouse': 100000, 'li-20yr:member': 100000 } };
  expect(selectedApplicationApplicants(values, library.products)).toEqual({ 'li-10yr': [] });
  expect(validateCoverageSubmission(library.products, values)).toContain('select an applicant');
  expect(applicationUnderwritingContext(library.site, 'li-10yr', 'member', values).portfolio).toEqual([]);
});

it('keeps missing-map defaults distinct from explicitly empty elections across all consumers', () => {
  const library = load();
  const values = { ...base, dependents: [], coverageSelections: ['li-10yr'], coverageAmounts: { 'li-10yr:member': 100000 } };
  expect(validateCoverageSubmission(library.products, values)).toBeUndefined();
  expect(applicantPortfolioProducts(library.site, 'member', values)).toEqual(['li-10yr']);
  expect(validateCoverageSubmission(library.products, { ...values, productApplicants: { 'li-10yr': [] } })).toContain('select an applicant');
});

it('enforces the same effective Life ceiling at Coverage and final Review checkpoints', () => {
  const source = structuredClone(freshStartSource());
  // Change the authoritative Site policy, rather than a generated amount or validator constant.
  (source.siteCoveragePolicies.asce as { lifeMaximum: { maximum: number } }).lifeMaximum.maximum = 2500000;
  const library = resolvePrototypeLibrary(data, 'asce', 'changed-life-ceiling', source);
  installPrototypeLibrary(library);
  const values = { ...base, dependents: [], coverageSelections: ['li-10yr', 'li-20yr'], productApplicants: { 'li-10yr': ['member'], 'li-20yr': ['member'] }, coverageAmounts: { 'li-10yr:member': 1500000, 'li-20yr:member': 1500000 } };
  for (const options of [undefined, { deferProfileUnderwriting: true }]) expect(validateCoverageSubmission(library.products, values, options)).toContain('$2,500,000');
  expect(coverageLifeMaximumError(library.site, library.products, values, library.client)).toContain('$2,500,000');
  expect(validateCoverageSubmission(library.products, { ...values, coverageAmounts: { 'li-10yr:member': 1500000, 'li-20yr:member': 1000000 } })).toBeUndefined();
});

it('enforces the joint-election submit rule at both checkpoints without counting a removed spouse', () => {
  const library = load();
  const values = { ...base, 'spouse-birth-date': '1990-01-01', dependents: ['spouse'], 'hours-worked-per-week': 40, 'spouse-hours-worked-per-week': 40, 'average-monthly-income': 10000, 'spouse-average-monthly-income': 1000, 'self-employed-under-one-year': 'no', coverageSelections: ['di-ltd'], productApplicants: { 'di-ltd': ['member', 'spouse'] }, coverageAmounts: { 'di-ltd:member': 300, 'di-ltd:spouse': 500 } };
  for (const options of [undefined, { deferProfileUnderwriting: true }]) expect(validateCoverageSubmission(library.products, values, options)).toContain('$600');
  expect(validateCoverageSubmission(library.products, { ...values, dependents: [] })).toBeUndefined();
});

it('blocks only definitive whole-offering ineligibility and uses the effective support contact', () => {
  const library = load();
  const old = { membership: 'yes', 'birth-date': '1910-01-01', 'state-province': 'PA', dependents: [] };
  expect(library.products.every(product => !product.applicants.includes('member') || applicationProductEligibility(product, 'member', old) === 'ineligible')).toBe(true);
  const message = noEligibleProductsMessage(library.products, old)!;
  expect(message).toContain('Unfortunately, you are not eligible for any products. For questions, contact:');
  expect(message).toContain(library.client.branding.name);
  expect(message).toContain(library.client.support.email);
  expect(noEligibleProductsMessage(library.products, { membership: 'yes', dependents: [] })).toBeUndefined();
  expect(noEligibleProductsMessage(library.products, { ...base, dependents: [], 'spouse-birth-date': '1910-01-01' })).toBeUndefined();
});

it('records the global prototype QD default for active QD elections and preserves explicit outcomes', () => {
  const library = load();
  const values = { ...base, dependents: [], coverageSelections: ['li-10yr', 'li-add'], productApplicants: { 'li-10yr': ['member', 'spouse'], 'li-add': ['member'] }, coverageAmounts: { 'li-10yr:member': 100000, 'li-10yr:spouse': 100000, 'li-add:member': 100000 } };
  expect(completePrototypeQdOutcomes(values, library.products).qdDecisions).toEqual({ 'li-10yr:member': 'conditionally-approved' });
  for (const outcome of ['referred', 'soft-declined', 'database-unavailable', 'invalid']) {
    const explicit = { ...values, qdDecisions: { 'li-10yr:member': outcome } };
    expect(completePrototypeQdOutcomes(explicit, library.products).qdDecisions).toEqual(explicit.qdDecisions);
  }
  expect(values).not.toHaveProperty('qdDecisions');
});

it('records QD outcomes only when the effective product Health page has completed', () => {
  const library = resolvePrototypeLibrary(data, 'waepa', 'qd-health-owner'); installPrototypeLibrary(library);
  const values = { ...base, 'birth-date': '1990-01-01', dependents: [], coverageSelections: ['li-group-term'], productApplicants: { 'li-group-term': ['member'] }, coverageAmounts: { 'li-group-term:member': 100000 } };
  expect(completePrototypeQdOutcomes(values, library.products, 'health-qd').qdDecisions).toEqual({});
  expect(completePrototypeQdOutcomes(values, library.products, 'health-tele').qdDecisions).toEqual({ 'li-group-term:member': 'conditionally-approved' });
  expect(completePrototypeQdOutcomes(values, library.products, 'membership')).toBe(values);
});
