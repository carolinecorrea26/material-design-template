import { readFileSync } from 'node:fs';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import meta from '../components/layout/AdvisorPages.stories';
import { getPrototypeLibrary } from '../domain/prototypeLibrary';

const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
let container: HTMLDivElement, root: Root;
const scrollIntoView = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollIntoView');
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('scrollTo', vi.fn());
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callback(0); return 0; });
  Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() });
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount()); container.remove(); vi.useRealTimers(); vi.unstubAllGlobals();
  if (scrollIntoView) Object.defineProperty(Element.prototype, 'scrollIntoView', scrollIntoView);
  else delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView;
});
async function render(example: 'start' | 'saved') {
  const renderStory = meta.render as unknown as (args: object, context: object) => ReactNode;
  await act(async () => root.render(<MemoryRouter initialEntries={['/advisor-login']}>{renderStory({ example }, { id: `advisor-${example}`, loaded: { catalog } })}</MemoryRouter>));
}
const fields = () => [...container.querySelectorAll<HTMLInputElement>('input')].map(input => input.name);
it('uses configured mode labels and changes only the active branch of fields', async () => {
  await render('start');
  expect(fields()).toEqual(['advisor-email', 'advisor-phone', 'advisor-code']);
  const modes = getPrototypeLibrary()!.site.configuration.pages.find(page => page.key === 'advisor-login')!.fields.find(field => field.key === 'advisor-flow-type')!.definition.options!;
  const tabs = [...container.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  expect(tabs.map(tab => tab.textContent)).toEqual(modes.map(mode => mode.label));
  expect(container.querySelectorAll('.MuiInputLabel-root')).toHaveLength(3);
  await act(async () => tabs[1].click());
  expect(fields()).toEqual(['applicant-email']);
  expect(container.querySelectorAll('.MuiInputLabel-root')).toHaveLength(1);
  await act(async () => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  expect([...container.querySelectorAll('input[aria-invalid="true"]')].map(input => input.getAttribute('name'))).toEqual(['applicant-email']);
  expect(container.textContent).not.toContain('Advisor email is required');
  await act(async () => tabs[0].click());
  expect(fields()).toEqual(['advisor-email', 'advisor-phone', 'advisor-code']);
});
it('continues a saved application without requiring hidden Start fields', async () => {
  await render('saved');
  expect(fields()).toEqual(['applicant-email']);
  expect(container.querySelector<HTMLInputElement>('input')!.value).toBe('jordan.rivera@example.com');
  vi.useFakeTimers();
  await act(async () => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  await act(async () => vi.advanceTimersByTimeAsync(10000));
  expect(container.textContent).toContain('would now open /resume');
});
