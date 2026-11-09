import { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import EligibilityFields, { validateEligibility, type EligibilityValues } from './EligibilityFields';
import { installPrototypeLibrary } from '../../domain/prototypeLibrary';
import { resolveMappedFields } from '../../domain/requirementFields';

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
it('uses ZIP / State / Birthday order and displays complete validation messages', async () => {
  expect([...container.querySelectorAll('[data-analytics-field]')].map(field => field.getAttribute('data-analytics-field')))
    .toEqual(['elig-zip-postal-code', 'elig-state-province', 'elig-birth-date']);
  await act(async () => [...container.querySelectorAll('button')].find(button => button.textContent === 'Validate quote')!.click());
  expect(container.textContent).toContain('Zip / Postal Code is required.');
  expect(container.textContent).toContain('State / Province is required.');
  expect(container.textContent).toContain('Date of Birth is required.');
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
it('uses standard field checks and one message for configured age ineligibility', () => {
  expect(validateEligibility({ birthday: '1990-05', state: 'NY', zipCode: '10001' }).errors.birthday).toBe('Enter a valid date.');
  const values = { birthday: '1950-01-01', state: 'NY', zipCode: '10001' };
  const result = validateEligibility(values, { maxAge: 65 });
  expect(result.errors).toEqual({});
  expect(result.eligibilityError).toBe('Unfortunately you are ineligible for coverage. Please contact the Administrator for more information about eligibility.');
  expect(validateEligibility(values, { maxAge: null }).isValid).toBe(true);
});
it('allows a manual state when lookup has no available match, including eligible-only lists', async () => {
  const fields = resolveMappedFields({ component: 'eligibility' }).filter(field => ['zip-postal-code', 'state-province', 'birth-date'].includes(field.id))
    .map(field => field.id === 'state-province' ? { ...field, options: field.options?.filter(option => ['NY', 'NJ'].includes(option.value)) } : field);
  const values = { zipCode: '90001', state: 'NY', birthday: '1990-01-01' };
  const result = validateEligibility(values, { fields, eligibleStatesOnly: true, maxAge: null });
  expect(result.isValid).toBe(true);
  expect(result.eligibilityError).toBe('');
  await act(async () => root.render(<EligibilityFields fields={fields} values={values} eligibleStatesOnly attempted eligibilityError={result.eligibilityError} onChange={() => {}} />));
  expect(container.querySelector('[role="alert"]')).toBeNull();
  expect(container.querySelector<HTMLInputElement>('input[name="elig-state-province"]')?.value).toBe('New York');
  await enter('elig-state-province', 'New');
  const options = [...document.querySelectorAll<HTMLElement>('[role="option"]')].map(option => option.textContent);
  expect(options).toContain('New York');
  expect(options).toContain('New Jersey');
  expect(options).not.toContain('New Hampshire');
});

it('retains ZIP+4 and Canadian postal formatting and preserves manual selection for unknown codes', async () => {
  const zip = () => container.querySelector<HTMLInputElement>('input[name="elig-zip-postal-code"]')!;
  expect(zip().inputMode).toBe('text');
  await enter('elig-zip-postal-code', '100011234');
  expect(zip().value).toBe('10001-1234');
  expect(container.querySelector('output')!.textContent).toBe('NY');
  await enter('elig-zip-postal-code', 'k1a0b1');
  expect(zip().value).toBe('K1A 0B1');
  expect(container.querySelector('output')!.textContent).toBe('ON');
  await enter('elig-zip-postal-code', '00000');
  expect(container.querySelector('output')!.textContent).toBe('ON');
  await enter('elig-state-province', 'California');
  await act(async () => [...document.querySelectorAll<HTMLElement>('[role="option"]')].find(option => option.textContent === 'California')!.click());
  expect(container.querySelector('output')!.textContent).toBe('CA');
  expect(validateEligibility({ zipCode: '00000', state: 'CA', birthday: '1990-01-01' }, { maxAge: null }).isValid).toBe(true);
});
