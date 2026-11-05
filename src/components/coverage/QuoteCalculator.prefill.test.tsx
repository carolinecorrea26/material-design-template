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
