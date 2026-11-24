import { readFileSync } from 'node:fs';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import QuoteCalculator from '../../app/workflows/QuoteCalculator';
import { ApplicationFormProvider } from '../../app/ApplicationFormContext';
import { ApplicationSessionProvider } from '../../app/ApplicationSessionContext';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../../domain/prototypeLibrary';
import { resolveApplicationCoverage, validateApplicationCoverages } from '../../domain/coverageRuntime';
import { applicationRiderOptions } from '../../domain/applicationRiders';

const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
afterEach(() => { installPrototypeLibrary(null); vi.useRealTimers(); vi.unstubAllGlobals(); sessionStorage.clear(); });

it.each(['waepa', 'waepa-gi', 'ama'])('keeps %s quote selections available without application-only eligibility facts', site => {
  const library = resolvePrototypeLibrary(catalog.data, site, 'quote-scope');
  installPrototypeLibrary(library);
  for (const product of library.products) {
    const facts = { 'birth-date': '1990-01-15', 'state-province': 'NY' };
    const result = resolveApplicationCoverage(product, 'member', facts, library.products, { purpose: 'quote' });
    expect(result.messages).toEqual([]);
    expect(result.amounts.length).toBeGreaterThan(0);
    expect(result.selectable).toBe(true);
    // Riders may depend on the elected base amount; application-only facts
    // must not block an otherwise valid rider quote.
    for (const rider of product.riders ?? []) {
      expect(result.amounts.some(amount => applicationRiderOptions(product, rider, 'member', {
        ...facts, coverageAmounts: { [`${product.id}:member`]: amount },
      }, { purpose: 'quote' }).available)).toBe(true);
    }
    const election = { ...facts, coverageSelections: [product.id], productApplicants: { [product.id]: ['member'] }, coverageAmounts: { [`${product.id}:member`]: result.amounts[0] } };
    expect(validateApplicationCoverages(library.products, election, { purpose: 'quote' })).toBeUndefined();
  }
  if (site === 'waepa') expect(resolveApplicationCoverage(library.products[0], 'member', { 'birth-date': '1990-01-15', 'state-province': 'NY' }, library.products).messages.join(' ')).toContain('military');
});

it('reveals WAEPA estimates and hands off to Membership using only the quote fields', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.useFakeTimers();
  vi.stubGlobal('requestAnimationFrame', () => 0);
  window.history.replaceState(null, '', '/?site=waepa');
  installPrototypeLibrary(resolvePrototypeLibrary(catalog.data, 'waepa', 'quote-ui'));
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host);
  const button = (name: string) => [...document.querySelectorAll('button')].find(node => node.textContent?.trim() === name)!;
  try {
    await act(async () => root.render(<ApplicationFormProvider><ApplicationSessionProvider><MemoryRouter initialEntries={['/quote']}><Routes>
      <Route path="/quote" element={<QuoteCalculator open onClose={() => {}} initialEligibility={{ birthday: '1990-01-15', zipCode: '10001', state: 'NY' }} />} />
      <Route path="/membership" element={<h1>Membership handoff</h1>} />
    </Routes></MemoryRouter></ApplicationSessionProvider></ApplicationFormProvider>));
    const category = document.querySelector<HTMLInputElement>('input[name="coverage-categories"][value="LI"]');
    if (category) await act(async () => category.click());
    const gender = [...document.querySelectorAll<HTMLElement>('[aria-labelledby="gender-label"] label')].find(node => node.textContent?.trim() === 'Female')!;
    await act(async () => gender.click());
    await act(async () => button('See my quote').click());
    await act(async () => { await vi.advanceTimersByTimeAsync(1100); });
    const select = document.querySelector<HTMLInputElement>('input[name="li-group-term-selection"]')!;
    expect(select).not.toBeNull(); expect(select.disabled).toBe(false);
    expect(document.body.textContent).not.toContain('Jurisdiction and any required military status must be supplied');
    expect(document.querySelector('input[name="active-military"]')).toBeNull();
    expect(document.querySelector('[name^="prototype-fact:"]')).toBeNull();
    expect(document.querySelector('input[name="li-group-term-cir-member-selected"]')).toBeNull();
    await act(async () => select.click());
    const rider = (id: string) => document.querySelector<HTMLInputElement>(`input[name="li-group-term-${id}-member-selected"]`)!;
    const chooseAmount = async (label: string) => {
      await act(async () => document.getElementById('li-group-term-member-amount')!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })));
      await act(async () => [...document.querySelectorAll<HTMLElement>('[role="option"]')].find(option => option.textContent?.trim() === label)!.click());
    };
    expect(rider('cir').disabled).toBe(true);
    expect(rider('abi').disabled).toBe(true);
    await chooseAmount('$50,000');
    expect(rider('cir').disabled).toBe(false);
    expect(rider('abi').disabled).toBe(true);
    await chooseAmount('$100,000');
    expect(rider('cir').disabled).toBe(false);
    expect(rider('abi').disabled).toBe(false);
    await act(async () => rider('cir').click());
    expect(rider('cir').checked).toBe(true);
    await chooseAmount('$25,000');
    expect(rider('cir').checked).toBe(false);
    await act(async () => select.click());
    expect(document.querySelector('input[name="li-group-term-cir-member-selected"]')).toBeNull();
    await act(async () => select.click());
    await act(async () => button('Apply for coverage').click());
    expect(host.textContent).toContain('Membership handoff');
  } finally { await act(async () => root.unmount()); host.remove(); }
}, 30000);
