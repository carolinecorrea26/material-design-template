import { readFileSync } from 'node:fs';
import { act, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import * as stories from '../components/payment/PaymentPage.stories';
vi.mock('../app/usePrototypeRates', () => ({ usePrototypeRates: () => ({ premium: () => 10, display: () => ({ status: 'available', amount: 10 }) }) }));
const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
it('preselects ASCE defaults, hides a member-only label, collects bank consent and proceeds to DocuSign', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  const host = document.createElement('div'), root = createRoot(host); document.body.append(host);
  const render = stories.Empty.render as unknown as (args: object, context: object) => ReactNode;
  const set = async (name: string, text: string) => { const input = host.querySelector<HTMLInputElement>(`input[name="${name}"]`)!; await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, text); input.dispatchEvent(new Event('input', { bubbles: true })); }); };
  try {
    await act(async () => root.render(<MemoryRouter>{render({}, { id: 'final-payment', loaded: { catalog } })}</MemoryRouter>));
    expect(host.querySelector('input[name="bank-name-on-account"]')).toBeNull();
    await act(async () => host.querySelector<HTMLInputElement>('input[name="payment-information-opt-in"][value="yes"]')!.click());
    expect(host.querySelector<HTMLInputElement>('input[name="payment-method:li-term"][value="bank-account"]')?.checked).toBe(true);
    expect(host.querySelector<HTMLInputElement>('input[name="payment-frequency:li-term"]')?.value).toBe('monthly');
    expect(host.textContent).toContain('Ontario and Manitoba');
    expect(host.textContent).not.toMatch(/Authorize payment|Try declined payment/);
    expect([...host.querySelectorAll('[role="status"]')].some(element => /Your Spouse|Your Child|^You$/.test(element.textContent ?? ''))).toBe(false);
    await set('bank-name-on-account', 'Jordan Morgan'); await set('bank-institution', 'Example Bank');
    await set('bank-routing-number', '021000021'); await set('bank-account-number', '000123456');
    await act(async () => host.querySelector<HTMLInputElement>('input[name="bank-authorization"]')!.click());
    await act(async () => [...host.querySelectorAll('button')].find(button => button.textContent === 'Next')!.click());
    expect(host.textContent).toContain('/docusign');
  } finally { await act(async () => root.unmount()); host.remove(); scroll.mockRestore(); vi.unstubAllGlobals(); }
});

it('allows ASCE to decline payment collection and continue to DocuSign without bank details', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  const host = document.createElement('div'), root = createRoot(host); document.body.append(host);
  const render = stories.Empty.render as unknown as (args: object, context: object) => ReactNode;
  try {
    await act(async () => root.render(<MemoryRouter>{render({}, { id: 'asce-optional-payment', loaded: { catalog } })}</MemoryRouter>));
    await act(async () => host.querySelector<HTMLInputElement>('input[name="payment-information-opt-in"][value="no"]')!.click());
    expect(host.querySelector('input[name="bank-account-number"]')).toBeNull();
    await act(async () => [...host.querySelectorAll('button')].find(button => button.textContent === 'Next')!.click());
    expect(host.textContent).toContain('/docusign');
  } finally { await act(async () => root.unmount()); host.remove(); scroll.mockRestore(); vi.unstubAllGlobals(); }
});
