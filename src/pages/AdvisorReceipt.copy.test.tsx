import { readFileSync } from 'node:fs';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import AdvisorLogin from './AdvisorLogin';
import Receipt from './Receipt';
import { freshStartSource } from '../domain/freshStartCatalog';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../domain/prototypeLibrary';

const form = vi.hoisted(() => ({ values: {} as Record<string, unknown>, setPageValues: vi.fn(), resetValues: vi.fn(), saveApplication: vi.fn(async () => null) }));
vi.mock('../app/ApplicationFormContext', () => ({ useApplicationForm: () => form }));
vi.mock('../app/ApplicationSessionContext', () => ({ useApplicationSession: () => ({ reviewSubmitted: false, markReviewSubmitted: vi.fn(), resetApplicationSession: vi.fn() }) }));
vi.mock('../app/SinglePageFlowContext', () => ({ useSinglePageFlow: () => null }));
const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
const originalScroll = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollIntoView');
let root: Root | undefined, host: HTMLDivElement;
afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  root = undefined; host?.remove(); installPrototypeLibrary(null);
  vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.clearAllMocks();
  window.sessionStorage.clear();
  if (originalScroll) Object.defineProperty(Element.prototype, 'scrollIntoView', originalScroll);
  else Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
});

it.each(['new', 'saved', 'receipt'] as const)('renders effective header copy with existing %s structure and behavior', async mode => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callback(0); return 0; });
  Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() });
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  const page = mode === 'receipt' ? 'receipt' : 'advisor-login';
  window.history.replaceState(null, '', `/${page}?site=asce`);
  const source = structuredClone(freshStartSource());
  const title = `Configured ${page} heading`, subhead = `Configured ${page} introduction`;
  source.fields.sitePages!.asce[page] = { ...source.fields.sitePages!.asce[page] as object, content: { [`page.${page}.title`]: title, [`page.${page}.subhead`]: subhead } };
  installPrototypeLibrary(resolvePrototypeLibrary(catalog.data, 'asce', `header-copy-${mode}`, source));
  form.values = mode === 'receipt' ? { 'mock-submission-id': 'COPY-RECEIPT' } : { 'advisor-flow-type': mode };
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root!.render(<MemoryRouter>{mode === 'receipt' ? <Receipt /> : <AdvisorLogin />}</MemoryRouter>));
  expect(host.querySelector('h1')?.textContent).toBe(title);
  expect(host.textContent).toContain(subhead);
  if (mode === 'receipt') {
    expect(host.textContent).toContain('COPY-RECEIPT');
    expect(host.textContent).toContain(String(source.content['receipt.documents-note']));
    expect(host.querySelector('button[type="submit"]')).toBeNull();
  } else {
    const expectedFields = mode === 'saved' ? ['applicant-email'] : ['advisor-email', 'advisor-phone', 'advisor-code'];
    expect([...host.querySelectorAll('input')].map(input => input.name)).toEqual(expectedFields);
    expect(host.querySelector('#advisor-mode-instructions')?.textContent).toBe(source.content[`page.advisor-login.section-notes.advisor-login-${mode}`]);
    await act(async () => host.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect([...host.querySelectorAll('input[aria-invalid="true"]')].map(input => input.getAttribute('name')).sort()).toEqual([...expectedFields].sort());
    expect(form.saveApplication).not.toHaveBeenCalled();
  }
});
