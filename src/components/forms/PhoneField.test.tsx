import { act, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useForm } from 'react-hook-form';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import FieldRenderer from './FieldRenderer';
import PhoneField from './PhoneField';
import { FieldDefinitionsContext } from './FieldDefinitionsContext';
import { fieldCatalog } from '../../config/fields';

const numberIds = ['phone', 'spouse-phone', 'business-phone'] as const;
const definitions = Object.values(fieldCatalog);
const initial = { phone: '2025550123', 'phone-type': 'mobile', 'spouse-phone': '2025550147', 'spouse-phone-type': 'home', 'business-phone': '2025550189', 'business-phone-type': 'business' };
let root: Root, container: HTMLDivElement;
let current: Record<string, string | boolean | string[]>;
function Form({ values = initial }: { values?: Record<string, string> }) {
  const form = useForm<Record<string, string | boolean | string[]>>({ defaultValues: values });
  const watched = form.watch();
  useEffect(() => { current = form.getValues(); }, [form, watched]);
  return <FieldDefinitionsContext value={definitions}>
    {numberIds.map(id => <FieldRenderer key={id} field={fieldCatalog[id]} control={form.control} errors={form.formState.errors} />)}
    <button type="button" onClick={() => void form.trigger()}>Check</button>
  </FieldDefinitionsContext>;
}
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
async function choose(id: string, value: string) {
  await act(async () => document.getElementById(id)!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 })));
  const option = [...document.querySelectorAll<HTMLElement>('[role="option"]')].find(option => option.dataset.value === value);
  expect(option).toBeDefined();
  await act(async () => option!.click());
}
it('stores self, spouse and business number/type edits independently through the real renderer', async () => {
  await act(async () => root.render(<Form />));
  await choose('business-phone-type', 'home');
  expect(current).toMatchObject({ ...initial, 'business-phone-type': 'home' });
  const business = container.querySelector<HTMLInputElement>('input[name="business-phone"]')!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(business, '2125550199');
    business.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await choose('spouse-phone-type', 'business');
  expect(current).toMatchObject({ ...initial, 'business-phone': '(212) 555-0199', 'business-phone-type': 'home', 'spouse-phone-type': 'business' });
});
it('restores each saved type and gives an absent business type its own default', async () => {
  const saved: Record<string, string> = { ...initial };
  delete saved['business-phone-type'];
  await act(async () => root.render(<Form values={{ ...saved, 'phone-type': 'business' }} />));
  expect(current).toMatchObject({ 'phone-type': 'business', 'spouse-phone-type': 'home', 'business-phone-type': 'mobile' });
  await act(async () => root.render(<Form key="restore" values={{ ...initial, 'business-phone-type': 'home' }} />));
  expect(document.getElementById('business-phone-type')?.textContent).toBe('Home');
  expect(document.getElementById('phone-type')?.textContent).toBe('Mobile');
});
it('disables the number and type together in the standalone component', async () => {
  await act(async () => root.render(<PhoneField field={{ ...fieldCatalog.phone, disabled: true }} value="2025550123" onChange={() => {}} typeField={fieldCatalog['phone-type']} typeValue="mobile" onTypeChange={() => {}} />));
  expect(container.querySelector<HTMLInputElement>('input[name="phone"]')?.disabled).toBe(true);
  expect(document.getElementById('phone-type')?.getAttribute('aria-disabled')).toBe('true');
});

it('reports a required type error against its own field without invalidating other phone answers', async () => {
  await act(async () => root.render(<Form values={{ ...initial, 'business-phone-type': '' }} />));
  await act(async () => container.querySelector<HTMLButtonElement>('button')!.click());
  expect(container.textContent).toContain('Business Phone Type is required.');
  expect(container.querySelector<HTMLInputElement>('input[name="phone"]')?.getAttribute('aria-invalid')).toBe('false');
  expect(current['phone-type']).toBe('mobile');
  expect(current['spouse-phone-type']).toBe('home');
});
