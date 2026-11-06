import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Routes, Route, useNavigate } from "react-router-dom";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import QuoteCalculator from "../../app/workflows/QuoteCalculator";
import { ApplicationFormProvider, useApplicationForm } from "../../app/ApplicationFormContext";
import { ApplicationSessionProvider } from "../../app/ApplicationSessionContext";
import Eligibility from "../../pages/Eligibility";
import Coverage from "../../pages/Coverage";
import Contact from "../../pages/Contact";
import Membership from "../../pages/Membership";
import { createReviewedMigrationDatabase } from "../../migration/fixtures";
import { installPrototypeLibrary, resolvePrototypeLibrary, getPrototypeLibrary } from "../../domain/prototypeLibrary";
import { getSurfaceField } from "../../config/fields/storedSurfaces";
import { resolveMappedFields } from "../../domain/requirementFields";
import type { DatabaseSchema } from "../../persistence/types";

let db: DatabaseSchema;
let root: Root | undefined;
let container: HTMLDivElement;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  root = undefined; container?.remove(); installPrototypeLibrary(null); vi.useRealTimers(); vi.unstubAllGlobals(); window.sessionStorage.clear();
});
function Navigation() {
  const navigate = useNavigate(), { values } = useApplicationForm();
  return <><button onClick={() => navigate('/eligibility')}>Inspect Eligibility</button><button onClick={() => navigate('/coverage')}>Inspect Coverage</button><button onClick={() => navigate('/contact')}>Inspect Contact</button><output data-application-values>{JSON.stringify(values)}</output></>;
}
const button = (text: string) => [...document.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.trim() === text)!;
function labeledInput(label: string) {
  const element = [...document.querySelectorAll<HTMLLabelElement>('label')].find(element => element.textContent?.toLowerCase().includes(label.toLowerCase()));
  const input = element?.htmlFor ? document.getElementById(element.htmlFor) : element?.closest('.MuiFormControl-root')?.querySelector('input');
  if (!(input instanceof HTMLInputElement)) throw new Error(`Missing input: ${label}`);
  return input;
}
async function type(input: HTMLInputElement, value: string) {
  await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); });
}
const radio = (field: string, label: string) => [...document.querySelectorAll<HTMLElement>(`[role="radiogroup"][aria-labelledby="${field}-label"] label.SelectionGroup-root`)].find(option => option.textContent?.trim() === label)!;
const currentValues = () => JSON.parse(document.querySelector('[data-application-values]')!.textContent!);

it.each([
  { collectEligibility: false, oldSurface: false },
  { collectEligibility: true, oldSurface: false },
  { collectEligibility: false, oldSurface: true },
  { collectEligibility: true, oldSurface: true },
])('collects and carries tobacco with collectEligibility=$collectEligibility oldSurface=$oldSurface', async ({ collectEligibility, oldSurface }) => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.useFakeTimers();
  vi.stubGlobal('requestAnimationFrame', () => 0);
  vi.stubGlobal('cancelAnimationFrame', (id: number) => window.clearTimeout(id));
  window.history.replaceState(null, '', '/?site=asce');
  const library = resolvePrototypeLibrary(structuredClone(db), 'asce', 'test:tobacco');
  if (oldSurface) library.fieldSurfaces.quoteInputs.mapping.fields = library.fieldSurfaces.quoteInputs.mapping.fields.filter(field => !['tobacco-last-used', 'tobacco-products'].includes(field.id));
  installPrototypeLibrary(library);
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  await act(async () => root!.render(<ApplicationFormProvider><ApplicationSessionProvider><MemoryRouter initialEntries={['/quote']}><Navigation /><Routes>
    <Route path="/quote" element={<QuoteCalculator open onClose={() => {}} collectEligibility={collectEligibility} initialEligibility={{ birthday: '1990-01-15', zipCode: '10001', state: 'NY' }} />} />
    <Route path="/membership" element={<Membership />} />
    <Route path="/coverage" element={<Coverage />} />
  </Routes></MemoryRouter></ApplicationSessionProvider></ApplicationFormProvider>));
  const category = document.querySelector<HTMLInputElement>('input[name="coverage-categories"][value="LI"]');
  if (category) await act(async () => category.click());
  await act(async () => radio('gender', 'Female').click());
  await act(async () => radio('smoker', 'No').click());
  expect(document.body.textContent).not.toContain('Last Used');
  await act(async () => radio('smoker', 'Yes').click());
  expect(document.body.textContent).toContain('Last Used');
  await act(async () => button('See my quote').click());
  expect(document.body.textContent).toContain('Last Used is required.');
  expect(document.body.textContent).toContain('Select at least one option.');
  await type(labeledInput('Last Used'), '01152020');
  const products = document.querySelector<HTMLElement>('[aria-labelledby="tobacco-products-label"]')!;
  await act(async () => products.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })));
  expect([...document.querySelectorAll<HTMLElement>('[role="option"]')].map(element => element.textContent?.trim())).toEqual(
    resolveMappedFields({ component: "quote-calculator" }, { siteId: "asce" }).find(field => field.id === "tobacco-products")!.options!.map(option => option.label),
  );
  const option = document.querySelector<HTMLElement>('[role="option"]')!;
  const optionLabel = option.textContent!;
  await act(async () => option.click());
  await act(async () => button('See my quote').click());
  await act(async () => { await vi.advanceTimersByTimeAsync(1100); });
  const select = document.querySelector<HTMLInputElement>('input[name="li-term-selection"]')!;
  expect(select).not.toBeNull();
  await act(async () => select.click());
  await act(async () => button('Apply for coverage').click());
  expect(currentValues()['tobacco-last-used']).toBe('2020-01-15');
  expect(currentValues()['tobacco-products']).toHaveLength(1);
  await act(async () => button('Inspect Coverage').click());
  expect(labeledInput('Last Used').value).toBe('01/15/2020');
  expect(document.body.textContent).toContain(optionLabel);
}, 120000);

it.each([
  { site: 'asce', product: 'li-term', radios: { gender: 'Female', smoker: 'No' }, inputs: {}, contextualInputs: [] },
  { site: 'asce', product: 'di-ltd', radios: { gender: 'Female' }, inputs: { 'average-monthly-income': '9000', 'hours-worked-per-week': '45' }, contextualInputs: [{ label: 'Years Self-Employed', value: '3' }] },
  { site: 'abe', product: 'oo-professional', radios: {}, inputs: { 'hours-worked-per-week': '45', 'monthly-business-expenses': '4000', 'business-expense-responsibility': '75' }, contextualInputs: [{ label: 'How many members are in your firm?', value: '3' }] },
  { site: 'avma', product: 'li-term', radios: { gender: 'Female', smoker: 'No' }, inputs: {}, contextualInputs: [{ label: '# Hours You Work/Week', value: '20' }] },
])("pre-fills $site/$product quote answers in the actual application controls", async ({ site, product, radios, inputs, contextualInputs }) => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.useFakeTimers();
  vi.stubGlobal('requestAnimationFrame', () => 0);
  vi.stubGlobal('cancelAnimationFrame', (id: number) => window.clearTimeout(id));
  window.history.replaceState(null, '', `/?site=${site}`);
  const data = structuredClone(db);
  // AVMA's baseline hides Home quote fields. Exercise an explicitly enabled
  // Library quote surface without changing the baseline Site presentation.
  if (site === 'avma') for (const field of data.siteFieldConfigurations.filter(row => row.siteKey === site && row.pageKey === 'home')) field.hidden = false;

  installPrototypeLibrary(resolvePrototypeLibrary(data, site, 'test:quote-prefill'));
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  await act(async () => root!.render(<ApplicationFormProvider><ApplicationSessionProvider><MemoryRouter initialEntries={['/quote']}><Navigation /><Routes>
    <Route path="/quote" element={<QuoteCalculator open onClose={() => {}} collectEligibility />} />
    <Route path="/membership" element={<Membership />} />
    <Route path="/eligibility" element={<Eligibility />} /><Route path="/coverage" element={<Coverage />} /><Route path="/contact" element={<Contact />} />
  </Routes></MemoryRouter></ApplicationSessionProvider></ApplicationFormProvider>));
  await type(labeledInput(getSurfaceField('quoteInputs', 'birth-date')!.label), '01151990');
  await type(labeledInput(getSurfaceField('quoteInputs', 'zip-postal-code')!.label), '10001');
  const category = getPrototypeLibrary()!.products.find(item => item.id === product)!.categoryId;
  const categoryInput = document.querySelector<HTMLInputElement>(`input[name="coverage-categories"][value="${category}"]`);
  if (categoryInput) await act(async () => categoryInput.click());
  for (const [field, choice] of Object.entries(radios)) {
    if (choice) await act(async () => radio(field, choice).click());
  }
  for (const [field, value] of Object.entries(inputs)) {
    if (value) await type(labeledInput(getSurfaceField('quoteInputs', field)!.label), value);
  }
  await act(async () => button('See my quote').click());
  await act(async () => { await vi.advanceTimersByTimeAsync(1100); });
  // Contextual questions come from the installed product requirements.
  const contextualValues: Record<string, string> = {};
  for (const group of document.querySelectorAll<HTMLElement>('[role="radiogroup"]')) {
    const id = group.getAttribute('aria-labelledby') ?? '';
    if (id === 'is-self-employed-label') {
      await act(async () => radio('is-self-employed', 'Yes').click());
      contextualValues['is-self-employed'] = 'yes';
      continue;
    }
    if (!id.startsWith('prototype-fact:')) continue;
    const choice = [...group.querySelectorAll<HTMLElement>('label.SelectionGroup-root')].find(row => row.textContent?.trim() === (id.includes('membership') ? 'Yes' : 'No'));
    if (choice) {
      await act(async () => choice.click());
      contextualValues[id.slice(0, -'-label'.length)] = choice.textContent!.trim().toLowerCase();
    }
  }
  if (site === 'abe') expect(document.querySelector<HTMLInputElement>(`input[type="checkbox"][name="${product}-selection"]`)?.disabled).toBe(true);
  for (const { label, value } of contextualInputs) {
    const input = labeledInput(label);
    contextualValues[input.name] = value;
    await type(input, value);
  }
  const select = document.querySelector<HTMLInputElement>(`input[type="checkbox"][name="${product}-selection"]`);
  expect(select).not.toBeNull();
  expect(select!.disabled).toBe(false);
  await act(async () => select!.click());
  await act(async () => button('Apply for coverage').click());
  expect(currentValues()).toMatchObject({ 'birth-date': '1990-01-15', 'zip-postal-code': '10001', 'state-province': 'NY', ...inputs, ...contextualValues, ...Object.fromEntries(Object.entries(radios).filter(([, value]) => value).map(([field, value]) => [field, value!.toLowerCase()])), coverageSelections: [product], productApplicants: { [product]: ['member'] } });
  await act(async () => button('Inspect Eligibility').click());
  expect(labeledInput('Date of birth').value).toBe('01/15/1990');
  expect(labeledInput('ZIP').value).toBe('10001');
  expect(document.querySelector<HTMLInputElement>('input[name="state-province"]')?.value).toBe('New York');
  await act(async () => button('Inspect Coverage').click());
  for (const [field, choice] of Object.entries(radios)) {
    if (choice) expect(radio(field, choice).querySelector<HTMLInputElement>('input[type="radio"]')?.checked).toBe(true);
  }
  for (const [field, value] of Object.entries(inputs)) {
    if (value) expect(labeledInput(getSurfaceField('quoteInputs', field)!.label).value.replace(/[^0-9]/g, '')).toBe(value);
  }
  for (const [field, value] of Object.entries(contextualValues)) {
    if (radio(field, value === 'yes' ? 'Yes' : 'No')) expect(radio(field, value === 'yes' ? 'Yes' : 'No').querySelector<HTMLInputElement>('input[type="radio"]')?.checked).toBe(true);
    else expect(document.querySelector<HTMLInputElement>(`input[name="${field}"]`)?.value).toBe(value);
  }
  expect(currentValues().coverageAmounts[`${product}:member`]).toBeGreaterThan(0);
  await act(async () => button('Inspect Contact').click());
  expect(labeledInput('ZIP').value).toBe('10001');
  expect(document.querySelector<HTMLInputElement>('input[name="state"]')?.value).toBe('New York');
}, 120000);

it('offers member riders, prices them, and restores them on Coverage after Apply (CHG-002)', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.useFakeTimers();
  vi.stubGlobal('requestAnimationFrame', () => 0);
  vi.stubGlobal('cancelAnimationFrame', (id: number) => window.clearTimeout(id));
  window.history.replaceState(null, '', '/?site=asce');
  installPrototypeLibrary(resolvePrototypeLibrary(structuredClone(db), 'asce', 'test:quote-riders'));
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  await act(async () => root!.render(<ApplicationFormProvider><ApplicationSessionProvider><MemoryRouter initialEntries={['/quote']}><Navigation /><Routes>
    <Route path="/quote" element={<QuoteCalculator open onClose={() => {}} initialEligibility={{ birthday: '1990-01-15', zipCode: '10001', state: 'NY' }} />} />
    <Route path="/membership" element={<Membership />} />
    <Route path="/coverage" element={<Coverage />} />
  </Routes></MemoryRouter></ApplicationSessionProvider></ApplicationFormProvider>));
  const category = document.querySelector<HTMLInputElement>('input[name="coverage-categories"][value="LI"]');
  if (category) await act(async () => category.click());
  await act(async () => radio('gender', 'Female').click());
  await act(async () => radio('smoker', 'No').click());
  await act(async () => button('See my quote').click());
  await act(async () => { await vi.advanceTimersByTimeAsync(1100); });
  await act(async () => document.querySelector<HTMLInputElement>('input[name="li-term-selection"]')!.click());
  const rider = document.querySelector<HTMLInputElement>('input[name="li-term-cir-member-selected"]')!;
  expect(rider).not.toBeNull();
  expect(rider.disabled).toBe(true);
  await act(async () => document.getElementById("li-term-member-amount")!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })));
  await act(async () => [...document.querySelectorAll<HTMLElement>('[role="option"]')].find(option => option.textContent?.trim() === '$100,000')!.click());
  expect(rider.disabled).toBe(false);
  expect(document.querySelector('input[name="li-term-spouse-cir-selected"]')).toBeNull();
  const totalBefore = document.body.textContent;
  await act(async () => document.querySelector<HTMLInputElement>('input[name="li-term-cir-member-selected"]')!.click());
  expect(document.querySelector<HTMLInputElement>('input[name="li-term-cir-member-selected"]')?.checked).toBe(true);
  const amount = document.querySelector<HTMLElement>('[role="combobox"][aria-labelledby~="li-term-cir-member-amount-label"]')!;
  await act(async () => amount.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })));
  expect([...document.querySelectorAll<HTMLElement>('[role="option"]')].map(option => option.textContent?.trim()).filter(label => label?.startsWith('$'))).toEqual(['$50,000', '$100,000']);
  await act(async () => [...document.querySelectorAll<HTMLElement>('[role="option"]')].find(option => option.textContent?.trim() === '$100,000')!.click());
  await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
  expect(document.body.textContent).not.toBe(totalBefore);
  await act(async () => button('Apply for coverage').click());
  expect(currentValues().coverageRiders).toEqual({ 'li-term:cir:member': true });
  expect(currentValues().coverageRiderAmounts).toEqual({ 'li-term:cir:member': 100000 });
  await act(async () => button('Inspect Coverage').click());
  await act(async () => { await vi.advanceTimersByTimeAsync(1100); });
  expect(currentValues().coverageRiders).toEqual({ 'li-term:cir:member': true });
  expect(document.querySelector<HTMLInputElement>('input[name="li-term:cir:member-selected"]')?.checked).toBe(true);
}, 120000);

it.each(["drawer", "inline"] as const)("requires a current product selection before Apply from the %s quote", async displayMode => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.useFakeTimers();
  vi.stubGlobal('requestAnimationFrame', () => 0);
  vi.stubGlobal('cancelAnimationFrame', (id: number) => window.clearTimeout(id));
  window.history.replaceState(null, '', '/?site=asce');
  installPrototypeLibrary(resolvePrototypeLibrary(structuredClone(db), 'asce', 'test:quote-apply'));
  const onClose = vi.fn();
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  await act(async () => root!.render(<ApplicationFormProvider><ApplicationSessionProvider><MemoryRouter initialEntries={['/quote']}><Navigation /><Routes>
    <Route path="/quote" element={<QuoteCalculator open onClose={onClose} displayMode={displayMode} initialEligibility={{ birthday: '1990-01-15', zipCode: '10001', state: 'NY' }} />} />
    <Route path="/membership" element={<Membership />} />
  </Routes></MemoryRouter></ApplicationSessionProvider></ApplicationFormProvider>));
  if (displayMode === "inline") await act(async () => button('Continue').click());
  const category = document.querySelector<HTMLInputElement>('input[name="coverage-categories"][value="LI"]');
  if (category) await act(async () => category.click());
  await act(async () => radio('gender', 'Female').click());
  await act(async () => radio('smoker', 'No').click());
  await act(async () => button(displayMode === "inline" ? 'Continue' : 'See my quote').click());
  await act(async () => { await vi.advanceTimersByTimeAsync(1100); });
  await act(async () => button('Apply for coverage').click());
  expect(document.body.textContent).toContain('Please select at least one coverage to continue.');
  expect(onClose).not.toHaveBeenCalled();
  expect(currentValues().coverageSelections).toBeUndefined();
  await act(async () => document.querySelector<HTMLInputElement>('input[name="li-term-selection"]')!.click());
  await act(async () => button('Apply for coverage').click());
  expect(onClose).toHaveBeenCalledOnce();
  expect(currentValues().coverageSelections).toEqual(['li-term']);
}, 120000);

it("requires newly applicable DI facts before applying an already selected quote", async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.useFakeTimers();
  vi.stubGlobal('requestAnimationFrame', () => 0);
  vi.stubGlobal('cancelAnimationFrame', (id: number) => window.clearTimeout(id));
  window.history.replaceState(null, '', '/?site=asce');
  installPrototypeLibrary(resolvePrototypeLibrary(structuredClone(db), 'asce', 'test:quote-revalidation'));
  const onClose = vi.fn();
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  await act(async () => root!.render(<ApplicationFormProvider><ApplicationSessionProvider><MemoryRouter initialEntries={['/quote']}><Navigation /><Routes>
    <Route path="/quote" element={<QuoteCalculator open onClose={onClose} initialEligibility={{ birthday: '1990-01-15', zipCode: '10001', state: 'NY' }} />} />
    <Route path="/membership" element={<Membership />} />
  </Routes></MemoryRouter></ApplicationSessionProvider></ApplicationFormProvider>));
  await act(async () => document.querySelector<HTMLInputElement>('input[name="coverage-categories"][value="DI"]')!.click());
  await act(async () => radio('gender', 'Female').click());
  await type(labeledInput(getSurfaceField('quoteInputs', 'average-monthly-income')!.label), '9000');
  await type(labeledInput(getSurfaceField('quoteInputs', 'hours-worked-per-week')!.label), '45');
  await act(async () => button('See my quote').click());
  await act(async () => { await vi.advanceTimersByTimeAsync(1100); });
  await act(async () => radio('is-self-employed', 'No').click());
  const select = document.querySelector<HTMLInputElement>('input[name="di-ltd-selection"]')!;
  expect(select.disabled).toBe(false);
  await act(async () => select.click());
  await act(async () => radio('is-self-employed', 'Yes').click());
  await act(async () => button('Apply for coverage').click());
  expect(document.body.textContent).toContain('Please complete the coverage eligibility information before applying.');
  expect(onClose).not.toHaveBeenCalled();
  expect(currentValues().coverageSelections).toBeUndefined();
}, 120000);
