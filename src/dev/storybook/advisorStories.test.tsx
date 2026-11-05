import { readFileSync } from 'node:fs';
import { act, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterAll, afterEach, expect, it, vi } from 'vitest';
import { getPrototypeLibrary } from '../../domain/prototypeLibrary';
import * as stories from '../../components/layout/AdvisorPages.stories';

const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
const originalScroll = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView');
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: () => {} });
afterAll(() => {
  if (originalScroll) Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', originalScroll);
  else Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
it.each(Object.entries(stories).filter(([key]) => key !== 'default'))('renders Advisor %s with actual fields and navigation', async (name, story) => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubEnv('VITE_MOCK_PLATFORM_ENABLED', '');
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  const network = vi.fn();
  vi.stubGlobal('fetch', network);
  const previous = getPrototypeLibrary(), original = JSON.stringify(catalog);
  const container = document.createElement('div'), root = createRoot(container);
  document.body.append(container);
  const render = stories.default.render as unknown as (args: object, context: object) => ReactNode;
  const field = (id: string) => container.querySelector<HTMLInputElement>(`input[name="${id}"]`);
  try {
    const example = story as typeof stories.Start;
    await act(async () => root.render(<MemoryRouter initialEntries={example.parameters!.router.initialEntries}>{render(example.args!, { id: name, loaded: { catalog } })}</MemoryRouter>));
    if (['Start', 'RestoredAdvisorDetails', 'ContinueSaved'].includes(name)) {
      expect(container.querySelector('[aria-label="Advisor login type"]')).not.toBeNull();
      expect(container.querySelector('button[type="submit"]')?.textContent).toContain('Log in');
      if (name === 'ContinueSaved') {
        expect(field('applicant-email')?.value).toBe('jordan.rivera@example.com');
        expect(field('advisor-email')).toBeNull();
      } else {
        for (const id of ['advisor-email', 'advisor-phone', 'advisor-code']) expect(field(id)).not.toBeNull();
        expect(field('applicant-email')).toBeNull();
      }
      if (name === 'RestoredAdvisorDetails') {
        expect(field('advisor-email')?.value).toBe('advisor@example.com');
        expect(field('advisor-code')?.value).toBe('EXAMPLE');
        expect(field('advisor-phone')?.value.replace(/\D/g, '')).toBe('2125550123');
      }
      if (name === 'Start') {
        await act(async () => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
        expect(container.querySelector('[aria-invalid="true"]')).not.toBeNull();
        await act(async () => [...container.querySelectorAll<HTMLButtonElement>('[role="tab"]')].find(tab => tab.textContent === 'Continue')!.click());
        expect(field('applicant-email')).not.toBeNull();
        expect(field('advisor-email')).toBeNull();
      }
    } else {
      expect(container.querySelector('button[type="submit"]')).toBeNull();
      if (name === 'SentToApplicant') {
        expect(container.textContent).toContain('Jordan Rivera');
        expect(container.textContent).toContain('jordan.rivera@example.com');
      }
      if (name === 'MissingApplicantDetails') expect(container.textContent).toContain('—');
      if (name === 'EditRequestSent') expect(container.textContent).toContain('advisor@example.com');
      const action = [...container.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent === (name === 'EditRequestSent' ? 'Return to Home' : 'Start new application'))!;
      await act(async () => action.click());
      expect(container.textContent).toContain(name === 'EditRequestSent' ? 'The application would now open /' : 'The application would now open /advisor-login');
    }
    expect(network).not.toHaveBeenCalled();
    expect(JSON.stringify(catalog)).toBe(original);
  } finally { await act(async () => root.unmount()); container.remove(); }
  expect(getPrototypeLibrary()).toBe(previous);
});
