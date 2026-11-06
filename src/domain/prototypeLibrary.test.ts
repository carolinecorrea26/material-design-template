import { effectiveSiteSnapshotTables } from "../repositories/portalDataRepository";
import { afterEach, describe, expect, it } from 'vitest';
import { createReviewedMigrationDatabase } from '../migration/fixtures';
import { migrationSiteKeys } from '../migration/fixtures';
import { resolvePrototypeLibrary, installPrototypeLibrary, validatePrototypeEnvelope } from './prototypeLibrary';
import { editDraftField, editDraftRates } from './libraryDraft';
import { getResolvedFieldsForSite } from '../config/fields/resolvedFieldRegistry';
import { resolveReviewExperience } from '../config/reviewExperience';
import { resolveRatePresentation } from './ratePresentation';
import type { EffectiveSiteData } from './effectiveSite';
const full = createReviewedMigrationDatabase();
const db = JSON.parse(JSON.stringify(Object.fromEntries([...new Set(effectiveSiteSnapshotTables)].map(table => [table, full[table]])))) as EffectiveSiteData;
afterEach(() => installPrototypeLibrary(null));
describe('persisted Library prototype cutover', () => {
  it.each(migrationSiteKeys)('%s resolves applicant products, fields, Review and rate capabilities from stored rows', siteKey => {
    const library = resolvePrototypeLibrary(db, siteKey, 'test');
    installPrototypeLibrary(library);
    expect(library.products.map(p => p.id).sort()).toEqual(library.client.coverages.enabled?.slice().sort());
    expect(library.products.length).toBeGreaterThan(0);
    for (const product of library.products) {
      expect(product.coverageAmounts?.length).toBeGreaterThan(0);
      expect(product.applicants.length).toBeGreaterThan(0);
      expect(product.planCode.primary).toBeTruthy();
    }
    for (const page of library.site.configuration.pages) expect(getResolvedFieldsForSite(page.key as 'eligibility', siteKey)).toEqual(page.fields.filter(f => f.included).map(f => f.definition));
    expect(resolveReviewExperience(library.client, siteKey, library.products, { state: 'NY', coverageSelections: [library.products[0].id], productApplicants: { [library.products[0].id]: ['member'] }, coverageAmounts: { [`${library.products[0].id}:member`]: 100000 } }).fraudNotice).toBeTruthy();
    if (siteKey === 'csea') {
      expect(resolveRatePresentation(library.site, library.products[0].id).coverageQuoteEnabled).toBe(false);
      expect(full.sites.find(site => site.key === siteKey)?.templateType).toBe('single');
      expect(library.client.features?.defaultTemplate).toBe('single');
    }
  });
  it('Library field and rate edits change the actual applicant resolvers with no catalog mutation', () => {
    const before = JSON.stringify(db);
    const draft = { formatVersion: 1 as const, siteKey: 'abe', baseRevision: `local:v1:sha256:${'a'.repeat(64)}`, editVersion: 0, data: db };
    const edited = editDraftRates(editDraftField(draft, 'eligibility', 'birth-date', { label: 'Library cutover DOB', required: true }), { version: 1, praseConfigured: false, quoteToolEnabled: false, coverageQuoteEnabled: false }, 'li-term', null);
    const installed = validatePrototypeEnvelope({ mode: 'mock', revision: 'saved-draft:1', payload: JSON.parse(JSON.stringify(edited)) }, 'abe');
    installPrototypeLibrary(installed);
    expect(getResolvedFieldsForSite('eligibility', 'abe').find(f => f.id === 'birth-date')).toMatchObject({ label: 'Library cutover DOB', required: true });
    expect(resolveRatePresentation(resolvePrototypeLibrary(db, 'abe', 'before').site, 'li-term').coverageQuoteEnabled).toBe(true);
    expect(resolveRatePresentation(installed.site, 'li-term').coverageQuoteEnabled).toBe(false);
    expect(JSON.stringify(db)).toBe(before);
    expect(() => validatePrototypeEnvelope({ mode: 'mock', revision: 'test', payload: edited }, 'ama')).toThrow();
  });
});

it('the live Coverage resolver applies persisted eligibility, residency, benefits and exclusions', async () => {
  const { resolveApplicationCoverage } = await import('./coverageRuntime');
  const library = resolvePrototypeLibrary(db, 'asce', 'test');
  installPrototypeLibrary(library);
  const di = library.products.find(p => p.id === 'di-ltd')!;
  const values = { 'birth-date': '1990-01-01', 'state-province': 'IL', gender: 'male', 'hours-worked-per-week': 40, 'average-monthly-income': 5000, 'is-self-employed': 'no' };
  expect(resolveApplicationCoverage(di, 'member', values, library.products)).toMatchObject({ selectable: true });
  expect(resolveApplicationCoverage(di, 'member', values, library.products).amounts.at(-1)).toBe(3000);
  expect(resolveApplicationCoverage(di, 'member', { ...values, 'hours-worked-per-week': 29 }, library.products).selectable).toBe(false);
  expect(resolveApplicationCoverage(di, 'member', { ...values, 'state-province': 'ZZ' }, library.products).selectable).toBe(false);
  const changed = structuredClone(db);
  changed.eligibilityConstraints.find(r => r.siteKey === 'asce' && r.productKey === 'di-ltd' && r.applicantTypeKey === 'member')!.minimumWorkHours = 45;
  const edited = resolvePrototypeLibrary(changed, 'asce', 'edited');
  installPrototypeLibrary(edited);
  expect(resolveApplicationCoverage(edited.products.find(p => p.id === 'di-ltd')!, 'member', values, edited.products).selectable).toBe(false);
  const abe = resolvePrototypeLibrary(db, 'abe', 'abe');
  installPrototypeLibrary(abe);
  const disability = abe.products.find(p => p.id === 'di-ltd')!;
  expect(resolveApplicationCoverage(disability, 'member', { ...values, coverageSelections: ['di-ltd-plus'], productApplicants: { 'di-ltd-plus': ['spouse'] }, 'prototype-fact:di-ltd:member:existingMonthlyBenefit': 0 }, abe.products).selectable).toBe(false);
});

it('uses normalized DI periods and child collection pricing facts in the persisted ASCE runtime', async () => {
  const { resolveApplicationCoverage, validateApplicationCoverages } = await import('./coverageRuntime');
  const { prototypeRateRequest } = await import('../app/usePrototypeRates');
  const library = resolvePrototypeLibrary(db, 'asce', 'test');
  installPrototypeLibrary(library);
  const di = library.products.find(p => p.id === 'di-ltd')!;
  const values = { membership: 'yes', 'birth-date': '1990-01-01', 'state-province': 'IL', gender: 'male', 'hours-worked-per-week': 30, 'average-monthly-income': 10000, 'is-self-employed': 'yes', 'years-self-employed': 0.5, coverageSelections: ['di-ltd'], productApplicants: { 'di-ltd': ['member'] }, coverageAmounts: { 'di-ltd:member': 1050 }, coverageWaitingPeriods: { 'di-ltd:member': '90-days' }, coverageMaxBenefitPeriods: { 'di-ltd:member': '5-years' }, children: [{ "child-birth-date": '2016-01-01', "child-gender": 'male', "child-full-time-student": 'no' }] };
  expect(resolveApplicationCoverage(di, 'member', values, library.products)).toMatchObject({ selectable: true, waitingPeriod: { requiredValue: '90-days' }, benefitPeriod: { requiredValue: '5-years' } });
  expect(validateApplicationCoverages(library.products, values)).toBeUndefined();
  const request = prototypeRateRequest('li-term', 'child', 10000, values, 'monthly')!;
  expect(request.facts.age).toBeGreaterThan(0);
  expect(request.facts.gender).toBe('male');
  expect(request.facts.membership).toBe(true);
});
