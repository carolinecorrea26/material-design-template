import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import CoverageCart from "../../app/sections/ConfiguredCoverageCart";
import CoverageCartView from './CoverageCart';
import { getActiveClientCoverages } from '../../config/client/getActiveClientCoverages';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../../domain/prototypeLibrary';
import { readFileSync } from 'node:fs';
import { MemoryRouter } from 'react-router-dom';
import { ApplicationFormContext } from '../../app/ApplicationFormContext';
import { withFreshStartCatalog } from '../../domain/freshStartCatalog';
vi.mock('../../app/usePrototypeRates', () => ({ usePrototypeRates: () => ({ enabled: false }) }));
let root: Root, container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true); installPrototypeLibrary(null);
  window.history.replaceState(null, '', '/coverage?site=demo');
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); installPrototypeLibrary(null); vi.unstubAllGlobals(); });

it('keeps the WAEPA cart a summary even when application eligibility facts are incomplete', async () => {
  window.history.replaceState(null, '', '/coverage?site=waepa');
  const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
  const library = resolvePrototypeLibrary(catalog.data, 'waepa', 'cart-summary');
  installPrototypeLibrary(library);
  await act(async () => root.render(<ApplicationFormContext.Provider value={{
    values: { coverageSelections: ['li-group-term'], productApplicants: { 'li-group-term': ['member'] }, coverageAmounts: { 'li-group-term:member': 100000 } },
    resetValues: vi.fn(), setPageValues: vi.fn(), saveApplication: vi.fn(async () => null),
  }}><MemoryRouter><CoverageCart variant="drawer" onClose={() => {}} /></MemoryRouter></ApplicationFormContext.Provider>));
  expect(container.textContent).toContain('Group Term Life Insurance');
  expect(container.querySelector('[role="alert"]')).toBeNull();
  expect(container.querySelector('button[aria-label*="Remove"]')).not.toBeNull();

  // Captured content cannot restore the retired cart messages.
  const keys = ['coverage.coverage-cart.eligibility-concern', 'coverage.coverage-cart.based-on-your-answers-you-may-not-be', 'coverage.coverage-cart.you-may-still-continue-with-your-other-selected'];
  for (const key of keys) {
    catalog.data.contentEntries.push({ ...catalog.data.contentEntries[0], id: key, key });
    catalog.data.contentValues.push({ ...catalog.data.contentValues[0], id: key, key, contentKey: key, value: 'Obsolete cart warning', scope: 'site', siteKey: 'waepa', clientKey: null });
  }
  const rebuilt = withFreshStartCatalog(catalog.data);
  expect(rebuilt.contentEntries.some((row: { key: string }) => keys.includes(row.key))).toBe(false);
  expect(rebuilt.contentValues.some((row: { contentKey: string }) => keys.includes(row.contentKey))).toBe(false);
});
async function render(total: number, selected = true, technicalFailure = false) {
  const product = getActiveClientCoverages()[0];
  await act(async () => root.render(<CoverageCart variant="inline" rateFrequency="monthly" showRateFrequencyToggle={false} grandTotal={total}
    categoryProducts={[product]} selectedCoverageIds={selected ? [product.id] : []} productApplicants={selected ? { [product.id]: ['member'] } : {}}
    calculatingRateKeys={new Set()} frequencyCalculating={false} selectionCalculating={false} onFrequencyToggle={() => {}}
    getCoverageRateDisplay={technicalFailure ? () => ({ status: 'unavailable', reason: 'technical' }) : undefined}
    calcCoveragePremium={() => total} isCoverageCalculating={() => false} />));
}
it('keeps selected products and the summary visible when pricing is unavailable', async () => {
  await render(NaN, true, true);
  expect(container.textContent).toContain('Your requested coverage');
  expect(container.textContent).toContain('Estimate unavailable');
  expect(container.textContent).not.toContain('$0.00');
});
it('retains a selected zero-cost summary while leaving an empty cart hidden', async () => {
  await render(0);
  expect(container.textContent).toContain('Your requested coverage');
  expect(container.textContent).toContain(getActiveClientCoverages()[0].name);
  await render(0, false);
  expect(container.textContent).not.toContain('Your requested coverage');
});

it('uses the shared product heading and shows one estimate per applicant in each drawer card', async () => {
  const product = getActiveClientCoverages()[0];
  await act(async () => root.render(<CoverageCartView variant="drawer" onClose={() => {}} onRemoveCoverage={() => {}} totalMonthly={25}
    entries={[{ coverage: product, applicants: [{ applicantId: 'member', amount: 100000, riders: [], monthlyEstimate: 25, display: { status: 'available', amount: 25 } }] }]} />));
  const title = container.querySelector('h4')!;
  expect(title.textContent).toBe(product.name);
  const card = title.closest('.MuiPaper-root')!;
  expect(card.textContent).toContain('Requested coverage');
  expect(card.textContent).toContain('$100,000');
  expect(card.textContent).toContain('Est. cost');
  expect(card.textContent?.match(/\$25\.00/g)).toHaveLength(1);
  expect(card.querySelector(`button[aria-label="Remove ${product.name}"]`)).not.toBeNull();
});

it('preserves nonnumeric rate states and hides cost labels when drawer pricing is suppressed', async () => {
  const product = getActiveClientCoverages()[0];
  const entries = [{ coverage: product, applicants: [{ applicantId: 'member' as const, amount: 100000, riders: [], monthlyEstimate: NaN, display: { status: 'unavailable' as const, reason: 'technical' as const } }] }];
  const view = (ratesSuppressed = false) => <CoverageCartView variant="drawer" onClose={() => {}} onRemoveCoverage={() => {}} totalMonthly={NaN} entries={entries} ratesSuppressed={ratesSuppressed} />;
  await act(async () => root.render(view()));
  expect(container.textContent).toContain('Estimate unavailable');
  expect(container.textContent).not.toContain('$0.00');
  await act(async () => root.render(view(true)));
  expect(container.textContent).toContain('Requested coverage');
  expect(container.textContent).not.toContain('Est. cost');
  expect(container.textContent).not.toContain('Estimate unavailable');
});

it('keeps member labels on other products when a dependent participates elsewhere in the drawer', async () => {
  const product = getActiveClientCoverages()[0];
  const member = { applicantId: 'member' as const, amount: 100000, riders: [], monthlyEstimate: 25, display: { status: 'available' as const, amount: 25 } };
  const render = (dependent: boolean) => root.render(<CoverageCartView variant="drawer" onClose={() => {}} onRemoveCoverage={() => {}} totalMonthly={25}
    applicantLabels={{ member: 'MemberLabel', spouse: 'SpouseLabel', child: 'ChildLabel' }}
    entries={[{ coverage: product, applicants: [member] }, ...(dependent ? [{ coverage: { ...product, id: 'other-product' }, applicants: [{ ...member, applicantId: 'child' as const }] }] : [])]} />);
  await act(async () => render(true));
  expect(container.textContent).toContain('MemberLabel');
  expect(container.textContent).toContain('ChildLabel');
  await act(async () => render(false));
  expect(container.textContent).not.toContain('MemberLabel');
  expect(container.textContent).not.toContain('ChildLabel');
});
