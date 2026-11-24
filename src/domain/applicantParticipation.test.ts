import { urlParameters } from '../content/docs/urlParameters';
import productsSource from '../../requirements/global/products.json';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { installPrototypeLibrary, resolvePrototypeLibrary } from './prototypeLibrary';
import { selectedProductApplicants } from './applicantParticipation';
import { applyingApplicants, shouldShowApplicantLabel } from '../utils/applicantVisibility';
import { deriveApplicantsApplying } from '../utils/applicantsApplying';
import { activeCoverageApplicantRestriction, resolveAvailableApplicants } from '../config/client/coverageApplicantScope';
import { capturedCoverageEntryScope, restoreCoverageEntryScope } from '../config/client/coverageProductScope';
import { getActiveClientCoverages } from '../config/client/getActiveClientCoverages';
import { getClientPageFields } from '../config/clientFields/getClientPageFields';
import { buildSelectedCoverageEntries } from '../utils/coverageDecisions';
import CoverageOptionsPanel from '../components/coverage/CoverageOptionsPanel';

const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
const library = resolvePrototypeLibrary(catalog.data, 'asce', 'shared-applicants');
const term = library.products.find(product => product.id === 'li-term')!;
const base = { membership: 'yes', 'birth-date': '1990-01-01', 'state-province': 'PA', coverageSelections: ['li-term'], productApplicants: { 'li-term': ['member'] }, coverageAmounts: { 'li-term:member': 100000 } };
beforeEach(() => { window.sessionStorage.clear(); window.history.replaceState(null, '', '/coverage?site=asce'); installPrototypeLibrary(library); });
afterEach(() => { installPrototypeLibrary(null); window.sessionStorage.clear(); });

it.each([
  [base, ['member'], false],
  [{ ...base, dependents: ['child'], productApplicants: { 'li-term': ['member', 'child'] } }, ['member', 'child'], true],
  [{ ...base, dependents: ['spouse'], productApplicants: { 'li-term': ['spouse'] } }, ['spouse'], true],
  [{ ...base, dependents: ['child'], productApplicants: { 'li-term': ['child'] } }, ['child'], true],
  [{ ...base, dependents: ['spouse'], productApplicants: { 'li-term': ['member'], removed: ['spouse'] } }, ['member'], false],
  [{ ...base, dependents: [], productApplicants: { 'li-term': ['member', 'spouse', 'child'] } }, ['member'], false],
  [{ ...base, productApplicants: { 'li-term': [] } }, [], false],
] as const)('shares current elections, heading context and derived applicants: %j', (values, expected, labels) => {
  const original = structuredClone(values);
  expect(selectedProductApplicants(values, term)).toEqual(expected);
  expect(applyingApplicants(values, library.products)).toEqual(expected);
  expect(deriveApplicantsApplying(values, library.products)).toEqual(expected);
  expect(shouldShowApplicantLabel('member', values, library.products)).toBe(labels);
  expect(buildSelectedCoverageEntries(values, library.products).map(entry => entry.applicant)).toEqual(expected);
  expect(values).toEqual(original);
});

it('includes an elected attached child benefit in heading context without creating independent child coverage', () => {
  const product = { ...term, applicants: ['member'] as typeof term.applicants, riders: [{ id: 'child-benefit', name: 'Child benefit', description: '', premiumFactor: 0, dependentApplicant: 'child' as const }] };
  const values = { ...base, dependents: ['child'], coverageRiders: { 'li-term:child-benefit:member': true } };
  expect(applyingApplicants(values, [product])).toEqual(['member', 'child']);
  expect(selectedProductApplicants(values, product)).toEqual(['member']);
  expect(applyingApplicants({ ...values, coverageSelections: [] }, [product])).toEqual([]);
  expect(applyingApplicants({ ...values, dependents: [] }, [product])).toEqual(['member']);
});

it.each([['member', ['member']], ['member,spouse', ['member', 'spouse']]] as const)('applies applicant=%s across offering, Eligibility and elections without changing source', (scope, allowed) => {
  const original = JSON.stringify(library);
  window.history.replaceState(null, '', `/eligibility?site=asce&applicant=${scope}`);
  const products = getActiveClientCoverages();
  expect(products.find(product => product.id === 'li-term')!.applicants).toEqual(allowed);
  const dependents = getClientPageFields('eligibility', {}).find(field => field.id === 'dependents');
  expect(dependents?.options?.map(option => option.value) ?? []).toEqual(allowed.filter(applicant => applicant !== 'member'));
  const values = { ...base, dependents: ['spouse', 'child'], productApplicants: { 'li-term': ['member', 'spouse', 'child'] } };
  expect(buildSelectedCoverageEntries(values, products).map(entry => entry.applicant)).toEqual(allowed);
  for (const variant of ['page', 'drawer'] as const) {
    const html = renderToStaticMarkup(createElement(CoverageOptionsPanel, { variant, content: library.content, coverages: products, coverageConfig: library.client.coverages }));
    const doc = new DOMParser().parseFromString(html, 'text/html');
    expect([...doc.querySelectorAll('[data-coverage-summary="li-term"] [data-coverage-applicant]')].map(row => row.getAttribute('data-coverage-applicant'))).toEqual(allowed);
  }
  expect(JSON.stringify(library)).toBe(original);
});

it('preserves applicant entry scope across routes and resume, isolated by Site and reset by a new campaign', () => {
  window.history.replaceState(null, '', '/?site=asce&applicant=member');
  activeCoverageApplicantRestriction('asce');
  const saved = capturedCoverageEntryScope('asce');
  expect(saved.applicant).toBe('member');
  window.history.replaceState(null, '', '/profile');
  expect(activeCoverageApplicantRestriction('asce')).toBe('member');
  expect(activeCoverageApplicantRestriction('synthetic')).toBeNull();
  restoreCoverageEntryScope('asce', {});
  expect(activeCoverageApplicantRestriction('asce')).toBeNull();
  restoreCoverageEntryScope('asce', saved);
  expect(activeCoverageApplicantRestriction('asce')).toBe('member');
  window.history.replaceState(null, '', '/?category=li');
  expect(activeCoverageApplicantRestriction('asce')).toBeNull();
});

it('never expands Site-supported people, and ordinary form choices leave general availability unchanged', () => {
  expect(resolveAvailableApplicants(['self'], 'member,spouse')).toEqual(['member']);
  expect(resolveAvailableApplicants(['self', 'spouse'], 'child')).toEqual(['member', 'spouse']);
  expect(getActiveClientCoverages().find(product => product.id === 'li-term')!.applicants).toEqual(['member', 'spouse', 'child']);
  const values = { ...base, dependents: [] };
  expect(applyingApplicants(values)).toEqual(['member']);
  expect(getActiveClientCoverages().find(product => product.id === 'li-term')!.applicants).toEqual(['member', 'spouse', 'child']);
});

it('projects the same applicant URL contract into reference documentation', () => {
  const contract = productsSource.catalog.urlParameters.find(row => row.parameter === 'applicant')!;
  const reference = urlParameters.find(row => row.parameter === 'applicant')!;
  expect(reference.newBehavior).toEqual([contract.behavior]);
  expect(reference.newValues).toEqual(productsSource.catalog.urlParameterValues.filter(row => row.urlParameterKey === contract.key).map(row => row.value));
});
