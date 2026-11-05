import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import RecoveryAlert from './RecoveryAlert';
import ApplicationErrorState from './ApplicationErrorState';
import ProcessingStatusPage from './ProcessingStatusPage';
import type { RecoveryIncident } from '../../domain/recoveryIncident';

vi.mock('../../data/activeSite', async importOriginal => ({ ...await importOriginal<typeof import('../../data/activeSite')>(), resolveSiteId: () => 'abe' }));
const incident: RecoveryIncident = { code: 'TECHNICAL_ERROR', operation: 'save', outcome: 'failed', reference: 'REQ-7C2F91AB', applicationId: 'APP-12345678' };
let root: Root, container: HTMLDivElement;
beforeEach(() => { vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true); vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Component examples must stay local')); container = document.createElement('div'); document.body.append(container); root = createRoot(container); });
afterEach(async () => { expect(globalThis.fetch).not.toHaveBeenCalled(); await act(async () => root.unmount()); container.remove(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it('retains the same approved message and reference in alert, full page and support contact', async () => {
  await act(async () => root.render(<MemoryRouter><RecoveryAlert incident={incident} /><ApplicationErrorState incident={incident} /></MemoryRouter>));
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('There was a technical error.');
  expect(container.querySelector('[role="alert"]')?.textContent).toContain(incident.reference);
  expect(container.querySelector('h1')?.textContent).toBe('We ran into an issue');
  const support = container.querySelector('section')!;
  expect(support.textContent).toContain('Please include your application ID for reference when contacting support: APP-12345678');
  const email = support.querySelector('a[href^="mailto:"]')!.getAttribute('href')!;
  expect(decodeURIComponent(email)).toContain('Application support (APP-12345678)');
  expect(email).not.toContain('token');
});
it('preserves a focused form answer when feedback is shown and only retries through an explicit callback', async () => {
  const retry = vi.fn();
  const render = async (show: boolean) => act(async () => root.render(<MemoryRouter><div>{show && <RecoveryAlert incident={{ ...incident, code: 'SAVE_FAILED' }} onRetry={retry} />}</div><input defaultValue="Kept answer" aria-label="Current answer" /></MemoryRouter>));
  await render(false);
  const input = container.querySelector('input')!; input.focus();
  await render(true);
  expect(document.activeElement).toBe(input);
  expect(input.value).toBe('Kept answer');
  const button = [...container.querySelectorAll('button')].find(button => button.textContent === 'Try saving again')!;
  await act(async () => button.click());
  expect(retry).toHaveBeenCalledOnce();
  expect(input.value).toBe('Kept answer');
});
it('does not add a second generic alert for a field validation incident', async () => {
  await act(async () => root.render(<MemoryRouter><RecoveryAlert incident={{ ...incident, code: 'VALIDATION_FAILED' }} /></MemoryRouter>));
  expect(container.querySelector('[role="alert"]')).toBeNull();
});
it('leaves offline presentation to the application-wide connection bar', async () => {
  await act(async () => root.render(<MemoryRouter><RecoveryAlert incident={{ ...incident, code: 'OFFLINE' }} /></MemoryRouter>));
  expect(container.querySelector('[role="alert"]')).toBeNull();
});
it('changes a local pending status to timeout feedback without a request', async () => {
  vi.useFakeTimers();
  await act(async () => root.render(<MemoryRouter><ProcessingStatusPage heading="Preparing this step" body="Please wait." operation="signature" timeoutMs={1000} reference={incident.reference} /></MemoryRouter>));
  expect(container.querySelector('[role="status"]')?.textContent).toContain('Preparing this step');
  await act(async () => vi.advanceTimersByTime(1000));
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('taking longer than expected');
  expect(container.querySelector('[role="progressbar"]')).toBeNull();
  expect(container.textContent).toContain(incident.reference);
});
it('shows an unconfirmed submission as a full page with support and no repeat actions', async () => {
  await act(async () => root.render(<MemoryRouter><ProcessingStatusPage heading="" body="" operation="submission" phase="timeout" reference={incident.reference} confirmationId="CONF-12345678" /></MemoryRouter>));
  expect(container.querySelector('h1')?.textContent).toBe('We ran into an issue');
  expect(container.textContent).toContain('submission');
  expect(container.querySelectorAll('a.MuiButton-root, button.MuiButton-root')).toHaveLength(0);
  expect(container.textContent).toContain('Please include your confirmation ID for reference when contacting support: CONF-12345678');
});
