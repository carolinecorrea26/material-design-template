import { readFileSync } from 'node:fs';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import PrototypeHandoffPage, { prototypeHandoffScreens } from './PrototypeHandoffPage';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../../domain/prototypeLibrary';
import { validateSharedCatalog } from '../../persistence/sharedCatalog';
import { validatePrototypeHandoffs } from '../../domain/prototypeHandoffs.mjs';

const state = vi.hoisted(() => ({ pending: false, error: '', submitted: vi.fn() }));
// Exercise the handoff's submit contract; RoutePage.persistence tests separately
// verify the shared save/error/transition implementation behind that contract.
vi.mock('../../app/RoutePage', () => ({ default: ({ pageId, children }: any) => <form id={`${pageId}-form`} onSubmit={event => { event.preventDefault(); state.submitted(); }}>{children({ pageError: state.error, navigationPending: state.pending })}</form> }));
const catalog = validateSharedCatalog(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')));
let root: Root, host: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  state.pending = false; state.error = ''; state.submitted.mockClear();
  installPrototypeLibrary(resolvePrototypeLibrary(catalog.data, 'asce', 'handoff-final'));
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); installPrototypeLibrary(null); vi.unstubAllGlobals(); });
const render = () => act(async () => root.render(<MemoryRouter><PrototypeHandoffPage pageId="health-qd" /></MemoryRouter>));
const next = () => document.querySelector<HTMLButtonElement>('button[aria-label="Click to continue"]') ?? document.querySelector<HTMLButtonElement>('button[aria-busy]')!;
it('uses effective ASCE images, advances in order and submits only after the final image', async () => {
  await render();
  expect(document.querySelector('img')?.getAttribute('src')).toBe('/prototype/qd-page-1.png');
  await act(async () => next().click());
  expect(document.querySelector('img')?.getAttribute('src')).toBe('/prototype/qd-page-2.png');
  expect(state.submitted).not.toHaveBeenCalled();
  await act(async () => next().click());
  expect(state.submitted).toHaveBeenCalledTimes(1);
  state.pending = true; await render();
  expect(next().disabled).toBe(true);
  await act(async () => next().click());
  expect(state.submitted).toHaveBeenCalledTimes(1);
  state.pending = false; state.error = 'There was a technical issue'; await render();
  expect(document.querySelector('[role="alert"]')?.textContent).toContain(state.error);
  expect(document.querySelector('img')?.getAttribute('src')).toBe('/prototype/qd-page-2.png');
  await act(async () => next().click());
  expect(state.submitted).toHaveBeenCalledTimes(2);
});
it('keeps the prototype action usable after image loading fails', async () => {
  await render();
  await act(async () => document.querySelector('img')!.dispatchEvent(new Event('error')));
  expect(document.body.textContent).toContain('Image unavailable');
  await act(async () => next().click());
  expect(document.querySelector('img')?.getAttribute('src')).toBe('/prototype/qd-page-2.png');
});
it('rejects malformed screen assignments and an installed projection missing its configuration', () => {
  const screens = prototypeHandoffScreens('health-qd');
  expect(validatePrototypeHandoffs({ 'health-qd': screens }, true)['health-qd']).toEqual(screens);
  expect(() => validatePrototypeHandoffs({})).toThrow('Invalid prototype handoff screens');
  for (const value of [{ 'health-qd': [] }, { 'health-qd': [{ alt: 'Missing image' }] }, { 'health-qd': [{ src: '/prototype/a.png', alt: ' ' }] }, { 'health-qd': [{ src: '/prototype/../a.png', alt: 'Invalid' }] }]) expect(() => validatePrototypeHandoffs(value, true)).toThrow('Invalid prototype handoff screens');
  const library = resolvePrototypeLibrary(catalog.data, 'asce', 'missing-handoff');
  delete library.settings.prototypeHandoffs; installPrototypeLibrary(library);
  expect(() => prototypeHandoffScreens('health-qd')).toThrow('Missing fresh-start');
});
