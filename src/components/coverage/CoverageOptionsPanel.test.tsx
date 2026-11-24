import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it } from 'vitest';
import CoverageOptionsPanel from './CoverageOptionsPanel';
import { validateSharedCatalog } from '../../persistence/sharedCatalog';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../../domain/prototypeLibrary';
import { getCoverageCategories } from '../../config/coverageCategories';
import { groupCoveragesByCategory } from '../../utils/groupCoveragesByCategory';
import { getCoverageOfferingRanges } from '../../domain/coveragePresentation';

const catalog = validateSharedCatalog(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')));
const library = resolvePrototypeLibrary(catalog.data, 'asce', 'coverage-summary-test');
const term = library.products.find(product => product.id === 'li-term')!;
afterEach(() => installPrototypeLibrary(null));

it.each(['page', 'drawer'] as const)('shows QuickDecision availability only for assigned QuickDecision products in the %s presentation', variant => {
  installPrototypeLibrary(library);
  const render = (products: typeof library.products) => renderToStaticMarkup(<CoverageOptionsPanel variant={variant} content={library.content} coverages={products} coverageConfig={library.client.coverages} />);
  expect(library.products.some(product => product.underwritingType === 'QD')).toBe(true);
  expect(render(library.products)).toContain(library.content.help.quickDecision.availability);
  expect(render(library.products.filter(product => product.underwritingType !== 'QD'))).not.toContain(library.content.help.quickDecision.availability);
  expect(render([])).not.toContain(library.content.help.quickDecision.availability);
});

it.each(['page', 'drawer'] as const)('shows the configured ASCE amounts beside each applicant in the %s surface', variant => {
  installPrototypeLibrary(library);
  const html = renderToStaticMarkup(<CoverageOptionsPanel variant={variant} content={library.content} coverages={library.products} coverageConfig={library.client.coverages} />);
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const product = doc.querySelector('[data-coverage-summary="li-term"]')!;
  expect(product).not.toBeNull();
  expect(product.textContent).not.toContain('$0');
  expect(product.querySelectorAll('[data-coverage-applicant]')).toHaveLength(term.applicants.length);
  for (const applicant of term.applicants) expect(product.querySelector(`[data-coverage-applicant="${applicant}"] dt`)?.textContent).toBe(library.content.shared.applicantLabels[applicant]);
  // CHG-106 confirmed the $10,000 ASCE minimum for either adult.
  expect(product.querySelector('[data-coverage-applicant="member"] dd')?.textContent).toBe('$10,000 – $1,000,000');
  expect(product.querySelector('[data-coverage-applicant="spouse"] dd')?.textContent).toBe('$10,000 – $1,000,000');
  expect(product.querySelector('[data-coverage-applicant="child"] dd')?.textContent).toBe('$10,000');
});

it('responds to changed amount/minimum assignments without changing stored choices or adding applicants', () => {
  const product = structuredClone(term);
  product.applicants = ['spouse'];
  product.coverageAmounts = [
    { scope: { applicantType: 'member' }, selections: [{ type: 'amountList', values: [0, 1000, 2000000] }] },
    { scope: { applicantType: 'spouse' }, selections: [{ type: 'amountList', values: [0, 20000, 40000, 60000] }] },
    { scope: { applicantType: 'spouse', applicantClassId: 'example-class' }, selections: [{ type: 'amountList', values: [80000] }] },
  ];
  product.requirementPolicy!.find(row => row.configuration === 'coverage-new-application-minimum-amount')!.value = 30000;
  const before = structuredClone(product);
  expect(getCoverageOfferingRanges(product)).toEqual([{ applicant: 'spouse', minAmount: 40000, maxAmount: 80000 }]);
  expect(product).toEqual(before);
});

it('does not turn a zero-only or dependent-derived assignment into a base benefit', () => {
  const product = { ...term, applicants: ['member'] as typeof term.applicants, coverageAmounts: [{ selections: [{ type: 'amountList' as const, values: [0] }] }] };
  expect(getCoverageOfferingRanges(product)).toEqual([{ applicant: 'member', minAmount: undefined, maxAmount: undefined }]);
  expect(getCoverageOfferingRanges({ ...product, coverageAmounts: [{ derivedFrom: { applicantType: 'member', calculation: { type: 'percentage', value: 50 } } }] })).toEqual([{ applicant: 'member', minAmount: undefined, maxAmount: undefined }]);
});

it('shares effective names and descriptions between Home, the menu drawer and Coverage categories', () => {
  const fixture = structuredClone(library);
  fixture.client.coverages.categoryNames = { LI: 'Life protection' };
  fixture.content.coverage.categoryDescriptions.LI = 'Effective category introduction.';
  const product = fixture.products.find(product => product.id === 'li-term')!;
  product.name = 'Effective Term Life'; product.description = 'Effective product introduction.';
  installPrototypeLibrary(fixture);
  expect(groupCoveragesByCategory(fixture.products).find(group => group.category.id === 'LI')?.category.label).toBe('Life protection');
  expect(getCoverageCategories(fixture.client.coverages.categoryNames).find(category => category.id === 'LI')?.label).toBe('Life protection');
  for (const variant of ['page', 'drawer'] as const) {
    const html = renderToStaticMarkup(<CoverageOptionsPanel variant={variant} content={fixture.content} coverages={fixture.products} coverageConfig={fixture.client.coverages} />);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    expect(doc.querySelector('[role="tab"][aria-label="Life protection"]')).not.toBeNull();
    for (const value of ['Effective category introduction.', 'Effective Term Life', 'Effective product introduction.']) expect(doc.body.textContent).toContain(value);
  }
});
