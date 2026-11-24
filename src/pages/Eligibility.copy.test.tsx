import { readFileSync } from 'node:fs';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import Eligibility from './Eligibility';
import { freshStartSource } from '../domain/freshStartCatalog';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../domain/prototypeLibrary';
const form = vi.hoisted(() => ({ values: {} as Record<string, unknown>, setPageValues: vi.fn(), saveApplication: vi.fn(async () => null) }));
vi.mock('../app/ApplicationFormContext', () => ({ useApplicationForm: () => form }));
vi.mock('../app/ApplicationSessionContext', () => ({ useApplicationSession: () => ({ reviewSubmitted: false, markReviewSubmitted: vi.fn() }) }));
vi.mock('../app/SinglePageFlowContext', () => ({ useSinglePageFlow: () => null }));
const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
let root: Root | undefined, host: HTMLDivElement;
afterEach(async () => { if (root) await act(async () => root!.unmount()); root = undefined; host?.remove(); installPrototypeLibrary(null); vi.restoreAllMocks(); vi.unstubAllGlobals(); window.sessionStorage.clear(); });
async function render(copy?: Record<string, string>, noticeOnly = false, site = 'asce') {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true); vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  window.history.replaceState(null, '', `/eligibility?site=${site}`);
  const source = structuredClone(freshStartSource());
  source.fields.sitePages![site].eligibility = { ...source.fields.sitePages![site].eligibility as object, ...(copy ? { content: copy } : {}), ...(noticeOnly ? { configurations: { 'child-collection-mode': 'notice-only' } } : {}) };
  installPrototypeLibrary(resolvePrototypeLibrary(catalog.data, site, 'eligibility-copy-page', source));
  form.values = { membership: site === 'ama' ? 'physician' : 'yes', 'birth-date': '1990-01-15', 'zip-postal-code': '10001', 'state-province': 'NY', dependents: ['spouse', 'child'] };
  form.setPageValues.mockImplementation(patch => Object.assign(form.values, patch));
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root!.render(<MemoryRouter><Eligibility /></MemoryRouter>));
}
const custom = { 'eligibility.title': 'Configured eligibility title', 'eligibility.subhead': 'Configured eligibility introduction', 'eligibility.note.self': 'Configured member eligibility note', 'eligibility.note.spouse': 'Configured spouse definition', 'eligibility.note.children': 'Configured child eligibility notice' };
it('offers the AMA child dependent button and uses the inherited child collection', async () => {
  await render(undefined, false, 'ama');
  const child = host.querySelector<HTMLInputElement>('input[name="dependents"][value="child"]')!;
  expect(child).not.toBeNull();
  expect(child.checked).toBe(true);
  const addChild = () => [...host.querySelectorAll('button')].find(button => button.textContent?.includes('Add Child'));
  expect(addChild()).toBeDefined();
  await act(async () => child.click());
  expect(addChild()).toBeUndefined();
  await act(async () => child.click());
  expect(addChild()).toBeDefined();
});
it('renders all five effective values and retains conditional dependent notes without adding a member heading', async () => {
  await render(custom);
  for (const value of Object.values(custom)) expect(host.textContent).toContain(value);
  expect([...host.querySelectorAll('h1,h2,h3,h4,h5,h6')].some(heading => heading.textContent === 'You')).toBe(false);
  expect(host.querySelector<HTMLButtonElement>('button[type="submit"]:not([aria-hidden="true"])')?.disabled).toBe(false);
  await act(async () => host.querySelector<HTMLInputElement>('input[name="dependents"][value="spouse"]')!.click());
  expect(host.textContent).not.toContain(custom['eligibility.note.spouse']);
  expect(host.textContent).toContain(custom['eligibility.note.self']);
  expect(host.textContent).toContain(custom['eligibility.note.children']);
  await act(async () => host.querySelector<HTMLInputElement>('input[name="dependents"][value="child"]')!.click());
  expect(host.textContent).not.toContain(custom['eligibility.note.children']);
  expect(host.textContent).toContain(custom['eligibility.note.self']);
});
it('keeps the empty inherited member note hidden', async () => {
  await render();
  expect(host.querySelectorAll('.MuiAlert-standardInfo')).toHaveLength(2);
  expect(host.textContent).toContain('Only unmarried children are eligible for coverage.');
});
it('renders a configured child notice once without child collection controls in notice-only mode', async () => {
  await render(custom, true);
  expect(host.textContent?.split(custom['eligibility.note.children'])).toHaveLength(2);
  expect([...host.querySelectorAll('button')].some(button => button.textContent?.includes('Add Child'))).toBe(false);
  expect(host.textContent).toContain(custom['eligibility.note.self']);
});
