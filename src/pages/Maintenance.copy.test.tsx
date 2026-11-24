import { readFileSync } from 'node:fs';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import ApplicationErrorState from '../components/feedback/ApplicationErrorState';
import { ComponentContentContext } from '../components/content/ComponentContentContext';
import { freshStartSource } from '../domain/freshStartCatalog';
import { getPrototypeLibrary, installPrototypeLibrary, resolvePrototypeLibrary } from '../domain/prototypeLibrary';

vi.mock('../app/ApplicationFormContext', () => ({ useApplicationForm: () => ({ resetValues: vi.fn() }) }));
vi.mock('../app/ApplicationSessionContext', () => ({ useApplicationSession: () => ({ resetApplicationSession: vi.fn() }) }));
const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
let root: Root | undefined, host: HTMLDivElement;
afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  root = undefined; host?.remove(); installPrototypeLibrary(null);
  vi.restoreAllMocks(); vi.unstubAllGlobals();
});
it.each([false, true])('uses effective Maintenance copy without changing recovery behavior (standalone context: %s)', async standalone => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  window.history.replaceState(null, '', '/maintenance?site=asce');
  const source = structuredClone(freshStartSource());
  const copy = { 'recovery.maintenance.title': 'Configured maintenance title', 'recovery.maintenance.message': 'Configured maintenance explanation', 'recovery.maintenance.guidance': standalone ? '' : 'Configured maintenance guidance' };
  source.fields.sitePages!.asce.maintenance = { ...source.fields.sitePages!.asce.maintenance as object, content: copy };
  const model = resolvePrototypeLibrary(catalog.data, 'asce', 'maintenance-copy', source);
  installPrototypeLibrary(standalone ? null : model);
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  const wrap = (node: ReactNode) => <MemoryRouter><ComponentContentContext value={standalone ? model.content : undefined}>{node}</ComponentContentContext></MemoryRouter>;
  await act(async () => root!.render(wrap(standalone
    ? <ApplicationErrorState incident={{ code: 'MAINTENANCE', operation: 'page', outcome: 'failed' }} />
    : <ApplicationErrorState status="maintenance" />)));
  expect(host.querySelector('h1')?.textContent).toBe(copy['recovery.maintenance.title']);
  expect(host.textContent).toContain(copy['recovery.maintenance.message']);
  expect(host.textContent).not.toContain(String(source.content['recovery.maintenance.guidance']));
  if (!standalone) expect(host.textContent).toContain(copy['recovery.maintenance.guidance']);
  expect(host.querySelector('[data-recovery-family]')?.getAttribute('data-recovery-family')).toBe('maintenance');
  expect(host.textContent).not.toContain('Resume application');
  expect(host.textContent).not.toContain('Start new application');
  expect(host.textContent).toContain('Questions? We’re here to help.');
  await act(async () => root!.render(wrap(<ApplicationErrorState status={404} />)));
  expect(host.querySelector('h1')?.textContent).toBe(source.content['recovery.404.title']);
  expect(host.textContent).not.toContain(copy['recovery.maintenance.title']);
  expect(host.textContent).toContain('Resume application');
  if (standalone) expect(getPrototypeLibrary()).toBeNull();
});
