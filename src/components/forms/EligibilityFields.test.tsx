import { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import EligibilityFields, { type EligibilityValues } from './EligibilityFields';
import { installPrototypeLibrary } from '../../domain/prototypeLibrary';

let root: Root;
let container: HTMLDivElement;
function QuoteForm() {
  const [values, setValues] = useState<EligibilityValues>({ zipCode: '', state: '', birthday: '' });
  const [attempted, setAttempted] = useState(false);
  return <>
    <EligibilityFields values={values} attempted={attempted} onChange={next => setValues(current => ({ ...current, ...next }))} />
    <button onClick={() => setAttempted(true)}>Validate quote</button>
    <output>{values.state}</output>
  </>;
}
beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  installPrototypeLibrary(null);
  window.history.replaceState(null, '', '/?site=demo');
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(<QuoteForm />));
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
async function enter(id: string, value: string) {
  const input = container.querySelector<HTMLInputElement>(`[data-analytics-field="${id}"] input`)!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
it('uses ZIP / State / Birthday order with helper space present before validation', async () => {
  expect([...container.querySelectorAll('[data-analytics-field]')].map(field => field.getAttribute('data-analytics-field')))
    .toEqual(['elig-zip-postal-code', 'elig-state-province', 'elig-birth-date']);
  const helpers = [...container.querySelectorAll('.MuiFormHelperText-root')];
  expect(helpers).toHaveLength(3);
  expect(helpers.every(helper => parseFloat(getComputedStyle(helper).minHeight) > 0)).toBe(true);
  await act(async () => [...container.querySelectorAll('button')].find(button => button.textContent === 'Validate quote')!.click());
  expect(container.textContent).toContain('ZIP / postal code is required.');
  expect(container.textContent).toContain('State is required.');
  expect(container.textContent).toContain('Date of birth is required.');
  expect([...container.querySelectorAll('.MuiFormHelperText-root')]).toEqual(helpers);
});
it('shares inferred-State feedback and preserves a manual choice until ZIP changes', async () => {
  await enter('elig-zip-postal-code', '10001');
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); });
  expect(container.querySelector('output')!.textContent).toBe('NY');
  expect(container.querySelector('[role="status"]')!.textContent).toContain('Based on your ZIP / postal code');
  await enter('elig-state-province', 'California');
  const option = [...document.querySelectorAll<HTMLElement>('[role="option"]')].find(option => option.textContent === 'California')!;
  await act(async () => option.click());
  expect(container.querySelector('output')!.textContent).toBe('CA');
  expect(container.querySelector('[role="status"]')).toBeNull();
  await enter('elig-birth-date', '05/14/1990');
  expect(container.querySelector('output')!.textContent).toBe('CA');
  await enter('elig-zip-postal-code', '19019');
  expect(container.querySelector('output')!.textContent).toBe('PA');
});
