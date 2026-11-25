import { templateSourceLibraries } from '../dev/storybook/globalTemplate';
import { readFileSync } from 'node:fs';
import { afterEach, expect, it } from 'vitest';
import { freshStartSource } from './freshStartCatalog';
import { installPrototypeLibrary, resolvePrototypeLibrary } from './prototypeLibrary';
import { projectLibraryCatalog, type LibraryCatalog } from '../services/libraryCatalogService';
import { portalLibraryData } from './portalLibraryScope';
import { getClientPageFields } from '../config/clientFields/getClientPageFields';
import { getActiveClientCoverages } from '../config/client/getActiveClientCoverages';
import { getCoverageAmountChoices } from '../utils/coverageAmounts';
import { prototypeCoverageDecision } from './prototypeCoverageDecision';
import { prototypeApplicantOperand } from './prototypeApplicantOperands';
import { resolveCoverageQuestionSections } from '../config/resolvers/resolveCoverageQuestionSections';
import { getQuoteQuestionFieldIds } from '../config/fields/homeQuoteFields';
import { applicationRiderOptions, reconcileApplicationRiders } from './applicationRiders';
import { getRiderOnlyOptions } from './coverageRiderOnly';
import { financialQuestionnaireForApplication } from './financialQuestionnaire';
import { buildSelectedCoverageEntries } from '../utils/coverageDecisions';
import { beneficiaryQuestionsEnabled } from './beneficiaryParticipation';

const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')) as LibraryCatalog;
let projected: LibraryCatalog | undefined;
const publishedLibrary = () => projected ??= projectLibraryCatalog(catalog);
const expected = {
  ama: ['li-term', 'li-10yr', 'li-15yr', 'li-20yr', 'li-preferred', 'li-premier-accident', 'di-step-rated', 'di-level-rated', 'oo-office-overhead', 'sh-hospital-income'],
  waepa: ['li-group-term', 'di-short-term'],
  'waepa-gi': ['li-group-term'],
  'ama-gi': ['li-term', 'di-short-term'],
};
afterEach(() => installPrototypeLibrary(null));

it('inherits AMA child participation consistently in Eligibility and the assigned Coverage products', () => {
  const childProducts = ['li-10yr', 'li-15yr', 'li-20yr', 'li-preferred', 'li-premier-accident', 'sh-hospital-income'];
  window.history.replaceState(null, '', '/eligibility?site=ama');
  for (const data of [catalog.data, publishedLibrary().data]) {
    const library = resolvePrototypeLibrary(data, 'ama', 'ama-child-participation');
    installPrototypeLibrary(library);
    expect(library.client.applicantExperience?.coveredPeople).toEqual(['self', 'spouse', 'child']);
    expect(getClientPageFields('eligibility', { membership: 'physician' }).find(field => field.id === 'dependents')?.options?.map(option => option.value)).toEqual(['spouse', 'child']);
    const products = getActiveClientCoverages().filter(product => product.applicants.includes('child'));
    expect(products.map(product => product.id).sort()).toEqual(childProducts);
    for (const product of products) expect(getCoverageAmountChoices(product, 'child').some(amount => amount > 0)).toBe(true);
    expect(library.fieldCollections.children.mapping.fields.length).toBeGreaterThan(0);
  }
});

it('uses WAEPA rider base thresholds and disables standalone CIR across Library and prototype', () => {
  for (const data of [catalog.data, publishedLibrary().data]) {
    const library = resolvePrototypeLibrary(data, 'waepa', 'waepa-rider-policy');
    installPrototypeLibrary(library);
    const product = library.products.find(product => product.id === 'li-group-term')!;
    for (const applicant of ['member', 'spouse'] as const) {
      expect(getRiderOnlyOptions(product, applicant)).toEqual([]);
      for (const [amount, cir, abi] of [[25000, false, false], [50000, true, false], [75000, true, false], [100000, true, true]] as const) {
        const values = { 'birth-date': '1990-01-01', 'spouse-birth-date': '1990-01-01', 'state-province': 'VA', coverageAmounts: { [`${product.id}:${applicant}`]: amount } };
        for (const purpose of [undefined, 'quote'] as const) {
          const facts = purpose === 'quote' ? { coverageAmounts: values.coverageAmounts } : values;
          expect(applicationRiderOptions(product, product.riders!.find(rider => rider.id === 'cir')!, applicant, facts, { purpose }).available).toBe(cir);
          expect(applicationRiderOptions(product, product.riders!.find(rider => rider.id === 'abi')!, applicant, facts, { purpose }).available).toBe(abi);
        }
      }
    }
    const values = { coverageAmounts: { 'li-group-term:member': 50000 }, coverageRiders: { 'li-group-term:cir:member': true, 'li-group-term:abi:member': true } };
    expect(reconcileApplicationRiders([product], values, { purpose: 'quote' }).coverageRiders).toEqual({ 'li-group-term:cir:member': true });
    expect(reconcileApplicationRiders([product], { ...values, coverageAmounts: { 'li-group-term:member': 25000 } }, { purpose: 'quote' }).coverageRiders).toEqual({});
  }
});

it('assigns optional WAEPA beneficiaries and the exclusive $5,000 member DI financial threshold', () => {
  for (const data of [catalog.data, publishedLibrary().data]) {
    const library = resolvePrototypeLibrary(data, 'waepa', 'waepa-page-policies');
    const requirement = library.site.configuration.pages.find(page => page.key === 'beneficiary')!.requirement;
    expect(requirement).toBe('optional');
    expect(beneficiaryQuestionsEnabled(requirement, {})).toBe(false);
    expect(beneficiaryQuestionsEnabled(requirement, { 'beneficiary-information-opt-in': 'yes' })).toBe(true);
    const check = (amount: number, selected = true) => {
      const values = { coverageSelections: selected ? ['di-short-term'] : [], productApplicants: { 'di-short-term': selected ? ['member'] : [] }, coverageAmounts: { 'di-short-term:member': amount } };
      return financialQuestionnaireForApplication(library.site.configuration, buildSelectedCoverageEntries(values, library.products), values);
    };
    expect(check(4999)).toBe(false);
    expect(check(5000)).toBe(false);
    expect(check(5001)).toBe(true);
    expect(check(6000, false)).toBe(false);
  }
  for (const site of ['asce', 'ama', 'waepa-gi']) expect(resolvePrototypeLibrary(catalog.data, site, 'unchanged-financial-policy').site.configuration.financialQuestionnairePolicies).toEqual([]);
});

it('projects the supplied WAEPA Membership note through the existing page-note slot', () => {
  const note = 'Note: Receipt of Accelerated Death Benefits may affect eligibility for Public Assistance Programs and may be taxable\nNOTICE FOR NEW YORK RESIDENTS, THE POLICY CONTAINS A WAR RESTRICTION';
  const projected = publishedLibrary();
  for (const data of [catalog.data, projected.data])
    expect(resolvePrototypeLibrary(data, 'waepa', 'membership-note').content.pages.membership?.infoNote).toBe(note);
  expect(resolvePrototypeLibrary(catalog.data, 'waepa-gi', 'membership-note').content.pages.membership?.infoNote).not.toBe(note);
});

it.each(['waepa', 'waepa-gi'])('shares %s question participation across Quote and Coverage', site => {
  const library = resolvePrototypeLibrary(catalog.data, site, 'site-question-participation');
  const sections = library.site.configuration.pages.find(page => page.key === 'coverage')!.sections.map(section => section.definition.value);
  const coverageFields = resolveCoverageQuestionSections({ sections, selectedCategories: ['LI', 'DI'], coverageQuestions: library.client.coverageQuestions }, library).flatMap(section => section.fieldIds);
  const quoteFields = getQuoteQuestionFieldIds(library.client, ['LI', 'DI'], library);
  for (const fields of [coverageFields, quoteFields]) {
    expect(fields).toContain('gender');
    for (const id of ['smoker', 'tobacco-last-used', 'tobacco-products', 'spouse-smoker', 'spouse-tobacco-last-used', 'spouse-tobacco-products', 'self-employed-under-one-year'])
      expect(fields).not.toContain(id);
  }
  const asce = resolvePrototypeLibrary(catalog.data, 'asce', 'asce-question-participation');
  const asceSections = asce.site.configuration.pages.find(page => page.key === 'coverage')!.sections.map(section => section.definition.value);
  expect(resolveCoverageQuestionSections({ sections: asceSections, selectedCategories: ['DI'] }, asce).flatMap(section => section.fieldIds)).toContain('self-employed-under-one-year');
  expect(resolveCoverageQuestionSections({ sections: asceSections, selectedCategories: ['LI'] }, asce).flatMap(section => section.fieldIds)).toContain('smoker');
});

it.each(Object.keys(freshStartSource().fields.sites))('projects %s from authored assignments across Library and prototype', site => {
  const products = expected[site as keyof typeof expected];
  const library = publishedLibrary();
  const prototype = resolvePrototypeLibrary(portalLibraryData(catalog.data), site, 'restored-sites');
  const reconstructed = resolvePrototypeLibrary(library.data, site, 'restored-sites');
  if (products) expect(prototype.products.map(product => product.id).sort()).toEqual([...products].sort());
  expect(prototype.products.length).toBeGreaterThan(0);
  for (const product of prototype.products) for (const amount of product.coverageAmounts ?? [])
    if (amount.scope?.applicantType) expect(product.applicants).toContain(amount.scope.applicantType);
  expect(reconstructed.products).toEqual(prototype.products);
  expect(reconstructed.client).toEqual(prototype.client);
  expect(reconstructed.content).toEqual(prototype.content);
  expect(reconstructed.fieldSurfaces).toEqual(prototype.fieldSurfaces);
  expect(prototype.pages.some(page => ['health-li', 'health-di', 'health-ci'].includes(page.id))).toBe(false);
  if (products) expect(prototype.site.configuration.pages.find(page => page.key === 'payment')?.requirement).toBe(site === 'ama-gi' ? 'none' : 'required');
  if (products) expect(prototype.client.tpaIntegration?.mode).toBe(site === 'ama' || site === 'ama-gi' ? 'coverage-verification' : 'membership-auto-approval');
});

it('keeps GI assignments independent from standard WAEPA and the global template', () => {
  const source = freshStartSource();
  expect(Object.keys(source.fields.sites).sort()).toEqual(['abe', 'ama', 'ama-gi', 'asce', 'avma', 'csea', 'isitrust', 'nso', 'waepa', 'waepa-gi']);
  const standard = resolvePrototypeLibrary(catalog.data, 'waepa', 'restored-sites');
  const gi = resolvePrototypeLibrary(catalog.data, 'waepa-gi', 'restored-sites');
  expect(standard.site.configuration.products.find(product => product.productKey === 'li-group-term')?.applicantRules.length).toBeGreaterThan(1);
  expect(gi.products[0].applicants).toEqual(['member']);
  expect(gi.client.features?.defaultTemplate).toBe('single');
  expect(gi.products[0].riders).toEqual([]);
  expect(gi.products[0].coverageAmounts).toEqual([{ scope: { applicantType: 'member' }, selections: [{ type: 'amountList', values: [100000] }] }]);
});

it('preserves conditional physician and federal-membership follow-ups through the shared fields', () => {
  window.history.replaceState(null, '', '/membership?site=ama');
  installPrototypeLibrary(resolvePrototypeLibrary(catalog.data, 'ama', 'restored-membership'));
  expect(getClientPageFields('membership', { membership: 'physician' }).some(field => field.id === 'ama-physician-first-name')).toBe(false);
  expect(getClientPageFields('membership', { membership: 'spouse' }).some(field => field.id === 'ama-physician-first-name')).toBe(true);

  window.history.replaceState(null, '', '/membership?site=waepa');
  installPrototypeLibrary(resolvePrototypeLibrary(catalog.data, 'waepa', 'restored-membership'));
  const former = getClientPageFields('membership', { membership: 'new', 'waepa-attestation': 'former-federal' });
  expect(former.some(field => field.id === 'waepa-declaration')).toBe(true);
  expect(former.some(field => field.id === 'waepa-employer' || field.id === 'waepa-retired-employer')).toBe(false);
  const employee = getClientPageFields('membership', { membership: 'new', 'waepa-attestation': 'federal-active' });
  expect(employee.some(field => field.id === 'waepa-employer')).toBe(true);
  const current = getClientPageFields('membership', { membership: 'current', 'waepa-attestation': 'federal-active' });
  expect(current.some(field => field.id === 'waepa-employer' || field.id === 'waepa-declaration')).toBe(false);
  expect(current.some(field => field.id === 'active-military')).toBe(true);
  expect(current.find(field => field.id === 'active-military')?.label).toBe('Are you on active duty in the Armed Forces?');
  const spouse = getClientPageFields('eligibility', { dependents: ['spouse'] }).find(field => field.id === 'spouse-membership');
  expect(spouse?.options?.map(option => option.value)).toEqual(['yes', 'no']);
  window.history.replaceState(null, '', '/membership?site=waepa-gi');
  installPrototypeLibrary(resolvePrototypeLibrary(catalog.data, 'waepa-gi', 'restored-membership'));
  expect(getClientPageFields('membership', { membership: 'yes' }).some(field => field.id === 'active-military')).toBe(true);
});

it('collects AMA disability inputs through shared questions and isolates existing benefits by product', () => {
  const library = resolvePrototypeLibrary(catalog.data, 'ama', 'restored-disability');
  installPrototypeLibrary(library);
  const sections = library.site.configuration.pages.find(page => page.key === 'coverage')!.sections.map(section => section.definition.value);
  const questions = resolveCoverageQuestionSections({ sections, selectedCategories: ['DI'] }, library).flatMap(section => section.fieldIds);
  expect(questions).toEqual(expect.arrayContaining(['actively-at-work', 'applicant-class', 'existing-step-rated-monthly-benefit', 'existing-level-rated-monthly-benefit']));
  expect(questions).not.toContain('hours-worked-per-week');
  const values = {
    membership: 'physician', 'birth-date': '1990-01-01', 'state-province': 'NY',
    'actively-at-work': 'yes', 'average-monthly-income': 15000, 'applicant-class': 'practicing',
    'existing-step-rated-monthly-benefit': 500, 'existing-level-rated-monthly-benefit': 0,
    coverageSelections: ['di-step-rated'], productApplicants: { 'di-step-rated': ['member'] },
    coverageAmounts: { 'di-step-rated:member': 2000 }, coverageWaitingPeriods: { 'di-step-rated:member': '60-days' },
  };
  expect(prototypeApplicantOperand(library, 'di-step-rated', 'member', values, 'existingMonthlyBenefit')).toBe(500);
  expect(prototypeApplicantOperand(library, 'di-level-rated', 'member', values, 'existingMonthlyBenefit')).toBe(0);
  const result = prototypeCoverageDecision('di-step-rated', 'member', values, []);
  expect(result?.messages).toEqual([]);
  expect(result?.amounts).toContain(2000);
});

it('reconstructs authored enrollment without saved Site rows and honors explicit inspection scope', () => {
  const missing = { ...catalog, data: { ...catalog.data, sites: [] } };
  const restored = projectLibraryCatalog(missing);
  expect(restored.data.sites.map(site => site.key).sort()).toEqual(Object.keys(freshStartSource().fields.sites).sort());
  expect(resolvePrototypeLibrary(restored.data, 'asce', 'restored-enrollment').products).toEqual(resolvePrototypeLibrary(missing.data, 'asce', 'restored-enrollment').products);
  const scoped = projectLibraryCatalog(missing, ['ama']);
  expect(scoped.data.sites.map(site => site.key)).toEqual(['ama']);
  expect(templateSourceLibraries(scoped).map(library => library.site.siteKey)).toEqual(['ama']);
  expect(scoped.data.configurationDefinitions.some(row => row.key === 'shared.review-policy')).toBe(true);
  expect(projectLibraryCatalog(missing, []).data.sites).toEqual([]);
  expect(projectLibraryCatalog(missing, ['asce-default']).data.sites.map(site => site.key)).toEqual(['asce']);
  expect(templateSourceLibraries(missing).map(library => library.site.siteKey).sort()).toEqual(restored.data.sites.map(site => site.key).sort());
});
