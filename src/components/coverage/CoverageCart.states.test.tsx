import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import CoverageCart from "../../app/sections/ConfiguredCoverageCart";
import CoverageCartView from './CoverageCart';
import { getActiveClientCoverages } from '../../config/client/getActiveClientCoverages';
import { installPrototypeLibrary } from '../../domain/prototypeLibrary';
let root: Root, container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true); installPrototypeLibrary(null);
  window.history.replaceState(null, '', '/coverage?site=demo');
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
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
