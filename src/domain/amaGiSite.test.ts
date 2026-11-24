import { readFileSync } from 'node:fs';
import { afterEach, expect, it } from 'vitest';
import { freshStartSource } from './freshStartCatalog';
import { compileRequirementCatalog } from './requirementCatalog.mjs';
import { installPrototypeLibrary, resolvePrototypeLibrary } from './prototypeLibrary';
import { projectLibraryCatalog, type LibraryCatalog } from '../services/libraryCatalogService';
import { getClientPageFields } from '../config/clientFields/getClientPageFields';
import { getCoverageAmountChoices } from '../utils/coverageAmounts';
import { resolveApplicationCoverage, validateApplicationCoverages } from './coverageRuntime';
import { resolveFlowGate } from '../config/flowGates';
import { categoryEligibility, readCategoryEligibilityPolicy } from './categoryEligibilityPolicy';
import { getClientPageRequirement } from '../config/client/getClientPageRequirement';
import { resolveCoverageJourneyPolicy } from './coverageJourneyPolicy';
import { resolveNormalizedResidency } from './residencyPolicy';
import { effectiveSiteSnapshotTables } from '../persistence/catalogTables';
import { validateSnapshotData } from '../persistence/snapshot';
import { resolveEffectiveSite, resolveEffectiveEligibility } from './effectiveSite';
import { resolvePageCatalog } from './pageCatalog';
import { isLibraryDraft } from './libraryDraft';
import { resolveSiteId } from '../data/activeSite';

const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')) as LibraryCatalog;
afterEach(() => { installPrototypeLibrary(null); sessionStorage.clear(); });
function library(data = catalog.data) {
  window.history.replaceState(null, '', '/?site=ama-gi');
  const result = resolvePrototypeLibrary(data, 'ama-gi', 'ama-gi-test');
  installPrototypeLibrary(result);
  return result;
}
it('authors AMA-GI identity and assignments under the Site source and reconstructs missing captured identity', () => {
  window.history.replaceState(null, '', '/?site=ama-gi');
  expect(resolveSiteId()).toBe('ama-gi');
  window.history.replaceState(null, '', '/membership');
  expect(resolveSiteId()).toBe('ama-gi');
  const payloadData = Object.fromEntries([...new Set(effectiveSiteSnapshotTables)].map(table => [table, catalog.data[table]]));
  validateSnapshotData(payloadData, [...new Set(effectiveSiteSnapshotTables)]);
  resolvePageCatalog(catalog.data, 'ama-gi');
  resolveEffectiveSite(catalog.data, 'ama-gi');
  expect(isLibraryDraft({ formatVersion: 1, siteKey: 'ama-gi', editVersion: 0, baseRevision: `local:v1:sha256:${'0'.repeat(64)}`, data: payloadData })).toBe(true);
  const source = freshStartSource();
  const input = structuredClone(catalog.data);
  input.sites = input.sites.filter((site: { key: string }) => site.key !== 'ama-gi');
  input.siteAssociations = input.siteAssociations.filter((row: { siteKey: string }) => row.siteKey !== 'ama-gi');
  const projected = compileRequirementCatalog(input, source, 'ama-gi');
  expect(input.sites.some((site: { key: string }) => site.key === 'ama-gi')).toBe(false);
  expect(projected.sites.find(site => site.key === 'ama-gi')).toMatchObject({ clientId: 'ama', templateType: 'single', hostingAssociationId: 'ama' });
  expect(projected.siteAssociations.find(row => row.siteKey === 'ama-gi')).toMatchObject({ associationKey: 'american-medical-association', enabled: true });
  const site = library(projected);
  expect(site.client.features?.defaultTemplate).toBe('single');
  expect(site.client.applicantExperience?.coveredPeople).toEqual(['self']);
  expect(site.products.map(product => product.id).sort()).toEqual(['di-short-term', 'li-term']);
});
it('projects GI amounts, no riders, no health pages and no payment consistently through Library and prototype', () => {
  for (const data of [catalog.data, projectLibraryCatalog(catalog).data]) {
    const site = library(data);
    const values = { membership: 'student', 'birth-date': '2000-01-01', 'state-province': 'IL', coverageSelections: ['li-term', 'di-short-term'], productApplicants: { 'li-term': ['member'], 'di-short-term': ['member'] }, coverageAmounts: { 'li-term:member': 50000, 'di-short-term:member': 1000 }, coverageWaitingPeriods: { 'di-short-term:member': '30-days' }, coverageMaxBenefitPeriods: { 'di-short-term:member': '12-months' } };
    for (const product of site.products) {
      expect(product.applicants).toEqual(['member']);
      expect(product.riders).toEqual([]);
      expect(product.underwritingType).toBe('GI');
      expect(getCoverageAmountChoices(product)).toEqual(product.id === 'li-term' ? [50000, 100000] : [1000]);
      expect(resolveApplicationCoverage(product, 'member', values, site.products)).toMatchObject({ selectable: true, messages: [] });
      const journey = resolveCoverageJourneyPolicy(site.site, product.id)!;
      expect(journey.payment.collection).toBe('none');
      expect(journey.questions).toEqual([]);
      expect(journey.healthPageByUnderwriting).toEqual({ GI: null });
    }
    expect(validateApplicationCoverages(site.products, values)).toBeUndefined();
    for (const page of ['health-qd', 'health-tele', 'health-di-supp', 'health-si', 'health-cir'] as const) expect(resolveFlowGate(page, values, site.products), page).toBe(false);
    expect(getClientPageRequirement('payment')).toBe('none');
    expect(site.site.configuration.pages.find(page => page.key === 'beneficiary')?.requirement).toBe('optional');
    expect(site.site.configuration.pages.find(page => page.key === 'payment')?.requirement).toBe('none');
  }
});
it('limits membership options and reveals only the existing student identity fields for a spouse', () => {
  const site = library();
  const student = getClientPageFields('membership', { membership: 'student' });
  expect(student.find(field => field.id === 'membership')).toMatchObject({ label: 'I am a (select one):' });
  expect(student.find(field => field.id === 'membership')?.options?.map(option => option.value)).toEqual(['student', 'spouse']);
  expect(student.some(field => field.id.startsWith('ama-physician-'))).toBe(false);
  const spouse = getClientPageFields('membership', { membership: 'spouse' });
  expect(spouse.filter(field => field.id.startsWith('ama-physician-')).map(field => field.id).sort()).toEqual(['ama-physician-birth-date', 'ama-physician-email', 'ama-physician-first-name', 'ama-physician-last-name']);
  expect(site.content.pages.membership?.messages?.associatedProfessionalTitle).toBe('Medical Student Information');
  expect(getClientPageFields('eligibility', { membership: 'student' }).some(field => field.id === 'dependents')).toBe(false);
  const policy = readCategoryEligibilityPolicy(site.site.configuration.categoryEligibilityPolicies);
  expect(categoryEligibility(policy, 'student', 'DI')).toBe('eligible');
  expect(categoryEligibility(policy, 'spouse', 'DI')).toBe('ineligible');
  expect(categoryEligibility(policy, 'spouse', 'LI')).toBe('eligible');
  expect(site.client.coverages.categories).toEqual(['LI', 'DI']);
});
it('uses the confirmed age, residency, periods and hero copy', () => {
  const site = library();
  for (const product of site.products) for (const age of [16, 17, 39, 40]) expect(resolveEffectiveEligibility(site.site, product.id, 'member', { ageYears: age, membershipType: 'student' }).eligible).toBe(age >= 17 && age < 40);
  expect(resolveNormalizedResidency(site.site, 'li-term', 'member', { jurisdiction: 'US-LA' }).allowed).toBe(false);
  expect(resolveNormalizedResidency(site.site, 'li-term', 'member', { jurisdiction: 'US-NH' }).allowed).toBe(true);
  for (const state of ['US-NH', 'US-WA']) expect(resolveNormalizedResidency(site.site, 'di-short-term', 'member', { jurisdiction: state }).allowed).toBe(false);
  const product = site.products.find(product => product.id === 'di-short-term')!;
  expect(product.waitingPeriodOptions?.map(option => option.value)).toEqual(['30-days']);
  expect(product.maxBenefitPeriodOptions?.map(option => option.value)).toEqual(['12-months']);
  expect(JSON.stringify(site.content.home)).toContain('AMA-Sponsored Medical Student Program');
  expect(JSON.stringify(site.content.home)).toContain('Open Enrollment: July 1–December 31');
});
it('projects SSN-only Profile and isolates the new Site from main AMA', () => {
  library();
  const values = { membership: 'student', 'birth-date': '2000-01-01', 'state-province': 'IL', coverageSelections: ['li-term', 'di-short-term'], productApplicants: { 'li-term': ['member'], 'di-short-term': ['member'] }, coverageAmounts: { 'li-term:member': 50000, 'di-short-term:member': 1000 } };
  const personal = getClientPageFields('profile', values).filter(field => ['height-feet', 'height-inches', 'weight-lbs', 'social-security-number', 'marital-status', 'has-drivers-license', 'intend-live-outside-us', 'travel-outside-us-six-months'].includes(field.id));
  expect(personal.map(field => field.id)).toEqual(['social-security-number']);
  expect(getClientPageFields('profile', values).some(field => field.id === 'has-other-life-insurance' || field.id.startsWith('physician-'))).toBe(false);
  const main = resolvePrototypeLibrary(catalog.data, 'ama', 'main-ama-unchanged');
  expect(main.client.features?.defaultTemplate).toBe('multi');
  expect(main.products).toHaveLength(10);
  expect(main.content.pages.membership?.messages?.associatedProfessionalTitle).toBe('Physician Information');
});
