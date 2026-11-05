import { readFileSync } from 'node:fs';
import { act, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { getPrototypeLibrary } from '../../domain/prototypeLibrary';
import * as stories from '../../components/payment/PaymentPage.stories';
import * as sharedStories from '../../components/forms/SharedPaymentControls.stories';
import * as sectionStories from '../../components/payment/PaymentSections.stories';
vi.mock('../../app/usePrototypeRates', () => ({ usePrototypeRates: () => ({ premium: () => NaN, display: () => ({ status: 'needs-information' }) }) }));
const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
afterEach(() => vi.unstubAllGlobals());
it.each(Object.entries(stories).filter(([key]) => key !== 'default'))('renders Payment %s using the real frame and cleans up its fixture', async (name, story) => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const previous = getPrototypeLibrary(), original = JSON.stringify(catalog);
  const container = document.createElement('div'), root = createRoot(container); document.body.append(container);
  const render = (story as typeof stories.Empty).render as unknown as (args: object, context: object) => ReactNode;
  try {
    await act(async () => root.render(<MemoryRouter>{render({}, { id: name, loaded: { catalog } })}</MemoryRouter>));
    expect(container.textContent).toContain('Quoted cost is the best rate available');
    if (name === 'RestoredBankAccount') {
      expect(container.querySelector<HTMLInputElement>('input[name="bank-name-on-account"]')?.value).toBe('Jordan Morgan');
      expect(container.querySelector<HTMLInputElement>('input[name="bank-routing-number"]')?.value).toBe('021000021');
      expect(container.querySelector<HTMLInputElement>('input[name="bank-account-number"]')?.value).toBe('123456789');
      expect(container.querySelector<HTMLInputElement>('input[name="payment-method:li-term"][value="bank-account"]')?.checked).toBe(true);
    }
    if (name === 'BillMe') {
      expect(container.textContent).not.toContain('Banking Information');
      expect(container.querySelector<HTMLInputElement>('input[name="payment-method:li-group-term"][value="bill-me"]')?.checked).toBe(true);
    }
    if (name === 'OptionalDeferred') {
      expect(container.textContent).not.toContain('You will not be charged yet.');
      const yes = container.querySelector<HTMLInputElement>('input[name="payment-information-opt-in"][value="yes"]')!;
      await act(async () => yes.click());
      expect(container.textContent).toContain('You will not be charged yet.');
    }
    if (name === 'NoProducts') expect(container.textContent).toContain('No applied-for products were found');
    if (name === 'SharedChoices') expect(container.querySelectorAll('input[name="payment-method:all"]')).not.toHaveLength(0);
    expect(JSON.stringify(catalog)).toBe(original);
  } finally { await act(async () => root.unmount()); container.remove(); }
  expect(getPrototypeLibrary()).toBe(previous);
});
it.each([...Object.entries(sharedStories), ...Object.entries(sectionStories)].filter(([key]) => key !== 'default'))('renders standalone Payment example %s without an active Site', async (_name, story) => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const container = document.createElement('div'), root = createRoot(container); document.body.append(container);
  const render = (story as typeof sharedStories.SharedMethodAndFrequency).render as unknown as () => ReactNode;
  try { await act(async () => root.render(<MemoryRouter>{render()}</MemoryRouter>)); expect(container.textContent).not.toBe(''); }
  finally { await act(async () => root.unmount()); container.remove(); }
});
