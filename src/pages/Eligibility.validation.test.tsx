import { readFileSync } from 'node:fs';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import Eligibility from './Eligibility';
import { buildGlobalTemplate, type EligibilityExampleConfiguration } from '../dev/storybook/globalTemplate';
import { installPrototypeLibrary } from '../domain/prototypeLibrary';
import { validateSharedCatalog } from '../persistence/sharedCatalog';
const form = vi.hoisted(() => ({ values: {} as Record<string, unknown>, setPageValues: vi.fn(), saveApplication: vi.fn(async () => null) }));
vi.mock('../app/ApplicationFormContext', () => ({ useApplicationForm: () => form }));
vi.mock('../app/ApplicationSessionContext', () => ({ useApplicationSession: () => ({ reviewSubmitted: false, markReviewSubmitted: vi.fn() }) }));
vi.mock('../app/SinglePageFlowContext', () => ({ useSinglePageFlow: () => null }));
const catalog = validateSharedCatalog(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')));
let root: Root | undefined, container: HTMLDivElement;
afterEach(async () => { if (root) await act(async () => root!.unmount()); root = undefined; container?.remove(); installPrototypeLibrary(null); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.clearAllMocks(); });
const child = { 'child-first-name': 'Avery', 'child-last-name': 'Rivera', 'child-birth-date': '2015-05-14', 'child-gender': 'female', 'child-full-time-student': '' };
it.each([
  ['details', {}, [child], true],
  ['maximum', { childMaximum: 1 }, [{ ...child, 'child-full-time-student': 'yes' }, { ...child, 'child-full-time-student': 'yes' }], true],
  ['notice only', { childMode: 'notice-only' }, [child], false],
] as const)('uses current collection policy on Next: %s', async (_name, configuration, children, blocked) => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true); vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  installPrototypeLibrary(buildGlobalTemplate(catalog, 'standard', undefined, configuration as EligibilityExampleConfiguration));
  form.values = { membership: 'yes', 'first-name': 'Jordan', 'last-name': 'Rivera', 'birth-date': '1990-01-15', 'zip-postal-code': '10001', 'state-province': 'NY', dependents: ['child'], children };
  form.setPageValues.mockImplementation(patch => Object.assign(form.values, patch));
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  await act(async () => root!.render(<MemoryRouter><Eligibility /></MemoryRouter>));
  expect(container.querySelector<HTMLButtonElement>('button[type="submit"]:not([aria-hidden="true"])')?.disabled).toBe(false);
  await act(async () => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  expect(container.textContent?.includes('Please review the Child entries.')).toBe(blocked);
  expect(form.saveApplication).toHaveBeenCalledTimes(blocked ? 0 : 1);
});

it('blocks an applicant with no eligible products using the resolved Site contact', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true); vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  const library = buildGlobalTemplate(catalog, 'standard', undefined, { tpaMode: 'none' });
  installPrototypeLibrary(library);
  form.values = { membership: 'yes', 'first-name': 'Jordan', 'last-name': 'Rivera', 'birth-date': '1910-01-15', 'zip-postal-code': '10001', 'state-province': 'NY', dependents: [] };
  form.setPageValues.mockImplementation(patch => Object.assign(form.values, patch));
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  await act(async () => root!.render(<MemoryRouter><Eligibility /></MemoryRouter>));
  await act(async () => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  expect(container.textContent).toContain('Unfortunately, you are not eligible for any products. For questions, contact:');
  expect(container.textContent).toContain(library.client.branding.name);
  expect(container.textContent).toContain(library.client.support.email);
  expect(form.saveApplication).not.toHaveBeenCalled();
});
