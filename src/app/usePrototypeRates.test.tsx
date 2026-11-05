import { readFileSync } from 'node:fs';
import { act, useEffect, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { usePrototypeRates } from './usePrototypeRates';
import { useCoverageState } from './useCoverageState';
import { ApplicationFormContext, type ApplicationFormValues } from './ApplicationFormContext';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../domain/prototypeLibrary';
import { candidateMockRatingService } from '../mock/client';
import EstimatedRate from '../components/coverage/EstimatedRate';
import { coverageStoryBaseValues } from '../components/coverage/coverageStoryScenarios';

const data = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')).data;
const response = (premiumCents = 12000) => ({ mode: 'mock', premiumCents, expiresAt: Date.now() + 60000, authority: 'Synthetic test rates' });
let root: Root, container: HTMLDivElement;
const quote = vi.spyOn(candidateMockRatingService, 'quote');
let rates: ReturnType<typeof usePrototypeRates>;
let coverage: ReturnType<typeof useCoverageState>;
function Consumer({ amount = 100000, values = coverageStoryBaseValues, productKey = 'li-term' }: { amount?: number; values?: ApplicationFormValues; productKey?: string }) {
  const current = usePrototypeRates([{ productKey, applicant: 'member', amount }], values, 'monthly', 'coverage');
  useEffect(() => { rates = current; });
  return <EstimatedRate display={current.display(`${productKey}:member`)} suffix="/mo" />;
}
function CoverageConsumer() { const current = useCoverageState(); useEffect(() => { coverage = current; }); return null; }
function CoverageForm() {
  const [values, setValues] = useState<ApplicationFormValues>({ ...coverageStoryBaseValues, selectedCategoryChips: ['LI'] });
  return <ApplicationFormContext.Provider value={{ values, setPageValues: patch => setValues(current => ({ ...current, ...patch })), resetValues: () => {} }}><CoverageConsumer /></ApplicationFormContext.Provider>;
}
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  installPrototypeLibrary(resolvePrototypeLibrary(data, 'abe', 'test:rates'));
  quote.mockReset().mockResolvedValue(response());
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); installPrototypeLibrary(null); quote.mockReset(); vi.unstubAllGlobals(); });
it('shows loading rather than unavailable before the initial mock response', async () => {
  let complete!: (value: ReturnType<typeof response>) => void;
  quote.mockImplementation(() => new Promise(resolve => { complete = resolve; }));
  await act(async () => root.render(<Consumer />));
  expect(container.querySelector('[role="status"]')).not.toBeNull();
  expect(container.textContent).not.toContain('Estimate unavailable');
  await act(async () => complete(response()));
  expect(rates.display('li-term:member').status).toBe('available');
  expect(container.textContent).toContain('$');
});
it('uses unavailable for an actual mock service failure', async () => {
  quote.mockRejectedValue(new Error('offline'));
  await act(async () => root.render(<Consumer />));
  expect(container.textContent).toContain('Estimate unavailable');
  expect(rates.display('li-term:member').status).toBe('unavailable');
});
it('keeps missing inputs separate from a failed request', async () => {
  await act(async () => root.render(<Consumer values={{ ...coverageStoryBaseValues, 'birth-date': '' }} />));
  expect(quote).not.toHaveBeenCalled();
  expect(rates.display('li-term:member').status).toBe('needs-information');
  expect(container.textContent).not.toContain('Estimate unavailable');
});
it('does not let a stale response replace the newer rate', async () => {
  const pending: Array<(value: ReturnType<typeof response>) => void> = [];
  quote.mockImplementation(() => new Promise(resolve => pending.push(resolve)));
  await act(async () => root.render(<Consumer amount={100000} />));
  await act(async () => root.render(<Consumer amount={200000} />));
  expect(pending).toHaveLength(2);
  await act(async () => pending[1](response(24000)));
  const current = container.textContent;
  await act(async () => pending[0](response(12000)));
  expect(container.textContent).toBe(current);
  expect(rates.display('li-term:member').status).toBe('available');
});
it('quotes displayed eligible products before any are added to the cart', async () => {
  await act(async () => root.render(<CoverageForm />));
  await act(async () => coverage.revealProducts());
  expect(coverage.selectedCoverageIds).toEqual([]);
  const requested = quote.mock.calls.map(([request]) => request.productKey);
  expect(requested).toContain('li-term');
  expect(requested).toContain('li-10yr');
  expect(requested).not.toContain('li-50plus');
  expect(coverage.getRateDisplay('li-term', 'member').status).toBe('available');
});
it('uses configured reference or hidden presentation without requesting a calculated rate', async () => {
  installPrototypeLibrary(resolvePrototypeLibrary(data, 'csea', 'test:reference'));
  await act(async () => root.render(<Consumer productKey="di-ltd" amount={1000} />));
  expect(quote).not.toHaveBeenCalled();
  expect(['reference-table', 'hidden']).toContain(rates.display('di-ltd:member').status);
  expect(container.textContent).not.toContain('Estimate unavailable');
});
