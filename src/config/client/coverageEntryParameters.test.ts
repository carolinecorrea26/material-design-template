import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../../domain/prototypeLibrary';
import { activeCoverageCategoryRestriction, coverageCategoryParameter } from './coverageCategoryScope';
import { activeCoverageApplicantRestriction } from './coverageApplicantScope';
import { activeFeaturedProduct, activeFirstCoverageCategory, captureCoverageAmountParameters, capturedCoverageEntryScope, restoreCoverageEntryScope, withCapturedCoverageEntryScope } from './coverageProductScope';
import { getActiveClientCoverages, getEntryScopedCoverages } from './getActiveClientCoverages';
import { getCoverageAmountControl, orderCoveragePresentation } from '../../domain/coveragePresentation';
import { coveragePreselection } from '../../domain/coveragePreselection';
import { normalizeInitialCoverageEntry } from '../../app/coverageEntryNavigation';
import { resolveCoverageJourneyPolicy, resolveSubmissionMapping } from '../../domain/coverageJourneyPolicy';

const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
const library = resolvePrototypeLibrary(catalog.data, 'asce', 'test:url-contract');
const term = library.products.find(product => product.id === 'li-term')!;
const di = library.products.find(product => product.id === 'di-ltd')!;
beforeEach(() => { window.sessionStorage.clear(); installPrototypeLibrary(library); });
afterEach(() => { installPrototypeLibrary(null); window.sessionStorage.clear(); window.history.replaceState(null, '', '/'); });
function enter(query: string) {
  window.history.replaceState(null, '', `/?site=asce&${query}`);
  const products = getActiveClientCoverages();
  captureCoverageAmountParameters('asce');
  return products;
}

it('uses categories as the same category/product/applicant restriction without expanding Site assignments', () => {
  const products = enter(`categories=li,di&prods=${term.gNumber!.primary},${di.gNumber!.primary}&applicant=member`);
  expect(products.map(row => row.id).sort()).toEqual([di.id, term.id].sort());
  expect(products.every(product => product.applicants.every(person => person === 'member'))).toBe(true);
  expect(capturedCoverageEntryScope('asce')).toMatchObject({ category: 'li,di', applicant: 'member' });
  expect(capturedCoverageEntryScope('asce')).not.toHaveProperty('categories');
  expect(enter(`categories=di&prods=${term.gNumber!.primary}`)).toEqual([]);
  expect(enter('categories=unknown')).toEqual([]);
});

it('gives explicit category precedence and treats empty scope as empty even with a valid alias', () => {
  expect(coverageCategoryParameter(new URLSearchParams('category=&categories=li'))).toBe('');
  expect(enter('category=&categories=li')).toEqual([]);
  expect(enter('category=li&categories=di').every(row => row.categoryId === 'LI')).toBe(true);
  expect(enter('categories=%20ALL%20')).toHaveLength(library.products.length);
});

it('sends invalid product links to the shared 400 page before campaign capture', () => {
  const g = term.gNumber!.primary!;
  enter('categories=di&applicant=member');
  const scope = capturedCoverageEntryScope('asce');
  for (const query of [`prods=${g}`, `prods=${g}&categories=%20`, `prods=${g}&category=&categories=li`]) {
    const url = new URL(`https://portal.example.test/preview/coverage?site=asce&${query}&apply=true`);
    expect(normalizeInitialCoverageEntry(url, '/preview/', false)?.href).toBe('https://portal.example.test/preview/400?site=asce');
  }
  for (const query of ['category=li', 'categories=li,di', 'category=all']) {
    expect(normalizeInitialCoverageEntry(new URL(`https://portal.example.test/?prods=${g}&${query}`), '/', false)).toBeNull();
  }
  expect(normalizeInitialCoverageEntry(new URL(`https://portal.example.test/admin-center?prods=${g}`), '/', false)).toBeNull();
  const file = new URL(`file:///portal.html#/coverage?prods=${g}`);
  expect(normalizeInitialCoverageEntry(file, './', true)?.href).toBe('file:///portal.html#/400');
  expect(capturedCoverageEntryScope('asce')).toEqual(scope);
});

it('uses applicant and membership G-number variants to show one product and resolves its mapping from application facts', () => {
  const associate = 'G-90000-2', spouse = 'G-90000-3';
  const variant = { ...term, gNumber: { ...term.gNumber, scoped: [
    { scope: { applicantType: 'member' as const, applicantClassId: 'associate' }, value: { primary: associate } },
    { scope: { applicantType: 'spouse' as const }, value: { primary: spouse } },
  ] } };
  const offering = { ...library, products: library.products.map(product => product.id === term.id ? variant : product) };
  for (const g of [associate, spouse, `${associate},${spouse}`]) {
    window.history.replaceState(null, '', `/?site=asce&category=li&prods=${g}`);
    expect(getEntryScopedCoverages(offering).map(product => ({ id: product.id, applicants: product.applicants }))).toEqual([
      { id: term.id, applicants: term.applicants },
    ]);
  }
  const original = resolveCoverageJourneyPolicy(library.site, term.id)!;
  const policy = {
    ...original,
    mappings: original.mappings.filter(row => row.when.mode === 'new').map(row => row.when.applicantKey === 'member'
      ? { ...row, when: { ...row.when, applicantClass: 'associate' }, identifiers: { ...row.identifiers, gNumber: { ...row.identifiers.gNumber, display: associate, issue: 'G-90000-0' } } }
      : row),
  };
  expect(resolveSubmissionMapping(policy, { mode: 'new', applicantKey: 'member' }).status).toBe('needs-information');
  expect(resolveSubmissionMapping(policy, { mode: 'new', applicantKey: 'member', applicantClass: 'associate' })).toMatchObject({
    status: 'resolved', mapping: { identifiers: { gNumber: { display: associate, issue: 'G-90000-0' } } },
  });
});

it('starts an alias campaign without carrying previous products, people, amounts, locks or ordering', () => {
  enter(`category=li&prods=${term.gNumber!.primary}&applicant=member&featured_prod=${term.gNumber!.primary}&firstCategory=li&amt=${term.gNumber!.primary}_100000&dprods=${term.gNumber!.primary}&preselect=TRUE`);
  const products = enter('categories=di');
  expect(products.map(row => row.id)).toEqual([di.id]);
  expect(capturedCoverageEntryScope('asce')).toEqual({ category: 'di' });
  expect(activeCoverageApplicantRestriction('asce')).toBeNull();
  expect(activeFeaturedProduct('asce')).toBeNull();
  expect(activeFirstCoverageCategory('asce')).toBeNull();
});

it('restores canonical or alias saved context, isolates Sites and preserves elected answers', () => {
  enter('categories=li&firstCategory=li');
  const answers = { coverageSelections: [term.id], coverageAmounts: { [`${term.id}:member`]: 200000 } };
  const saved = withCapturedCoverageEntryScope('asce', answers);
  expect(saved).toMatchObject({ ...answers, coverageEntryScope: { category: 'li', firstCategory: 'li' } });
  enter('categories=di');
  window.history.replaceState(null, '', '/coverage?site=asce');
  restoreCoverageEntryScope('asce', (saved as Record<string, unknown>).coverageEntryScope);
  expect(activeCoverageCategoryRestriction('asce')).toBe('li');
  restoreCoverageEntryScope('asce', { categories: 'di', prods: di.gNumber!.primary });
  expect(capturedCoverageEntryScope('asce')).toEqual({ category: 'di', prods: di.gNumber!.primary });
  expect(capturedCoverageEntryScope('synthetic-site')).toEqual({});
  expect(answers).not.toHaveProperty('coverageEntryScope');
});

it('retains an explicit all-category marker when restoring a product-scoped application', () => {
  expect(enter(`categories=all&prods=${term.gNumber!.primary}`).map(row => row.id)).toEqual([term.id]);
  const scope = capturedCoverageEntryScope('asce');
  expect(scope).toEqual({ category: 'all', prods: term.gNumber!.primary });
  window.history.replaceState(null, '', '/coverage?site=asce');
  restoreCoverageEntryScope('asce', scope);
  expect(getActiveClientCoverages().map(row => row.id)).toEqual([term.id]);
});

it('requires a valid amt per applicant for URL locking and keeps explicit configured locks separate', () => {
  const g = term.gNumber!.primary!, dprods = g;
  const available = [20000, 100000, 200000];
  for (const amt of [undefined, 'bad', `${g}_0`, `${g}_9999999`, `${g}_100000,${g}_200000`, `${di.gNumber!.primary}_100000`]) {
    expect(getCoverageAmountControl(term, 'member', available, {}, { dprods, amt }).locked).toBe(false);
  }
  const scope = { dprods, amt: `${g}_100000` };
  expect(getCoverageAmountControl(term, 'member', available, {}, scope)).toMatchObject({ defaultAmount: 100000, locked: true });
  expect(getCoverageAmountControl(term, 'spouse', [20000, 50000], {}, scope)).toMatchObject({ defaultAmount: 20000, locked: false });
  expect(getCoverageAmountControl(term, 'child', [10000], {}, scope).locked).toBe(false);
  expect(getCoverageAmountControl(term, 'member', available, { amountSelection: { locked: true } }, { dprods })).toMatchObject({ defaultAmount: 20000, locked: true });
});

it('preserves featured ordering precedence and applies preselection once within the alias scope', () => {
  const products = enter(`categories=li,di&prods=${term.gNumber!.primary},${di.gNumber!.primary}&applicant=member&firstCategory=di&featured_prod=${term.gNumber!.primary}&preselect=TRUE`);
  expect(products[0].id).toBe(term.id);
  expect(orderCoveragePresentation(products, library.client.coverages, null, 'di').products[0].id).toBe(di.id);
  const values = { membership: 'yes', 'birth-date': '1990-01-01', 'state-province': 'VA', gender: 'female', smoker: 'no', 'hours-worked-per-week': 40, 'average-monthly-income': 10000, 'self-employed-under-one-year': 'no', coverageEntryScope: capturedCoverageEntryScope('asce') };
  const patch = coveragePreselection(products, values)!;
  expect(patch.coverageSelections.sort()).toEqual([di.id, term.id].sort());
  expect(patch.productApplicants).toEqual({ [di.id]: ['member'], [term.id]: ['member'] });
  expect(patch).not.toHaveProperty('coverageRiders');
  expect(coveragePreselection(products, { ...values, ...patch, coverageSelections: [] })).toBeNull();
});
