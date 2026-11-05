import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ApplicationSessionGuard from './ApplicationSessionGuard';
import { applicationTimeoutKey, readApplicationDeadline, resetApplicationTimeout, timeoutMilliseconds, warningMilliseconds } from './applicationTimeout';
import ApplicationErrorState from '../components/feedback/ApplicationErrorState';

vi.mock('../data/activeSite', async importOriginal => ({ ...await importOriginal<typeof import('../data/activeSite')>(), resolveSiteId: () => 'abe' }));
let root: Root, container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-26T12:00:00Z'));
  sessionStorage.clear();
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); sessionStorage.clear(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const mount = async (active = true, onExpire = vi.fn()) => {
  await act(async () => root.render(<MemoryRouter><Routes>
    <Route path="/technical-error" element={<RecoveryRoute />} />
    <Route path="*" element={<ApplicationSessionGuard active={active} onExpire={onExpire}><input aria-label="Application field" /></ApplicationSessionGuard>} />
  </Routes></MemoryRouter>));
  return onExpire;
};
function RecoveryRoute() {
  const location = useLocation();
  return <><output aria-label="Recovery location">{location.pathname}{location.search}</output><ApplicationErrorState status="technical-error" incident={location.state?.recoveryIncident} /></>;
}
it('shows the countdown at the warning threshold and reloads once on expiry', async () => {
  const onExpire = await mount();
  expect(document.querySelector('[role="alertdialog"]')).toBeNull();
  await act(async () => vi.advanceTimersByTime(timeoutMilliseconds - warningMilliseconds));
  expect(document.querySelector('[role="timer"]')?.textContent).toBe('Time remaining: 2:00');
  await act(async () => vi.advanceTimersByTime(1000));
  expect(document.querySelector('[role="timer"]')?.textContent).toBe('Time remaining: 1:59');
  await act(async () => vi.advanceTimersByTime(warningMilliseconds + 2000));
  expect(onExpire).toHaveBeenCalledTimes(1);
});
it('extends an active session on form activity but never revives an expired deadline', async () => {
  const onExpire = await mount();
  await act(async () => vi.advanceTimersByTime(timeoutMilliseconds - warningMilliseconds - 30_000));
  await act(async () => window.dispatchEvent(new Event('input')));
  expect(document.querySelector('[role="alertdialog"]')).toBeNull();
  expect(readApplicationDeadline('abe')).toBe(Date.now() + timeoutMilliseconds);
  sessionStorage.setItem(applicationTimeoutKey('abe'), String(Date.now() - 1));
  await act(async () => window.dispatchEvent(new Event('keydown')));
  expect(onExpire).toHaveBeenCalledTimes(1);
  expect(readApplicationDeadline('abe')).toBeLessThan(Date.now());
});
it('requires the alert action to renew and refuses renewal after the deadline', async () => {
  const onExpire = await mount();
  await act(async () => vi.advanceTimersByTime(timeoutMilliseconds - warningMilliseconds));
  const deadline = readApplicationDeadline('abe');
  const modal = () => document.querySelector<HTMLElement>('[role="alertdialog"]')!;
  expect(modal().getAttribute('aria-labelledby')).toBeTruthy();
  expect(modal().getAttribute('aria-describedby')).toBeTruthy();
  for (const event of [new Event('pointerdown'), new KeyboardEvent('keydown', { key: 'Escape' }), new Event('input')]) {
    await act(async () => window.dispatchEvent(event));
    expect(readApplicationDeadline('abe')).toBe(deadline);
    expect(modal()).not.toBeNull();
  }
  await act(async () => modal().querySelector('button')!.click());
  expect(readApplicationDeadline('abe')).toBe(Date.now() + timeoutMilliseconds);
  await act(async () => vi.advanceTimersByTime(300));
  expect(modal()).toBeNull();
  await act(async () => vi.advanceTimersByTime(timeoutMilliseconds - warningMilliseconds));
  const expiredDeadline = readApplicationDeadline('abe');
  vi.setSystemTime(expiredDeadline + 1);
  await act(async () => modal().querySelector('button')!.click());
  expect(onExpire).toHaveBeenCalledTimes(1);
  expect(readApplicationDeadline('abe')).toBeLessThan(Date.now());
});
it('retains the original deadline across reloads and checks time after a background pause', async () => {
  const deadline = readApplicationDeadline('abe');
  await mount();
  vi.setSystemTime(deadline + 1000);
  await act(async () => document.dispatchEvent(new Event('visibilitychange')));
  expect(readApplicationDeadline('abe')).toBe(deadline);
  resetApplicationTimeout('abe');
  expect(readApplicationDeadline('abe')).toBe(Date.now() + timeoutMilliseconds);
});
it('leaves utility pages usable and routes technical failures to the shared recovery page with Site context', async () => {
  const onExpire = await mount(false);
  expect(sessionStorage.getItem(applicationTimeoutKey('abe'))).toBeNull();
  await act(async () => window.dispatchEvent(new Event('application:session-expired')));
  expect(onExpire).not.toHaveBeenCalled();
  await mount(true, onExpire);
  await act(async () => window.dispatchEvent(new Event('application:technical-error')));
  expect(container.querySelector('h1')?.textContent).toBe('We ran into an issue');
  expect(container.querySelector('output')?.textContent).toBe('/technical-error?site=abe');
  expect(container.querySelector('input')).toBeNull();
  expect(container.querySelector('a')?.getAttribute('href')).toBe('/resume?site=abe');
});

it.each(['payment', 'submission'] as const)('carries an unconfirmed %s into the same recovery page without repeat actions', async operation => {
  await mount();
  await act(async () => window.dispatchEvent(new CustomEvent('application:technical-error', { detail: { code: 'TECHNICAL_ERROR', operation, outcome: 'unknown', applicationId: 'APP-12345678' } })));
  expect(container.querySelector('h1')?.textContent).toBe('We ran into an issue');
  expect(container.textContent).toContain(`We can’t confirm the result of your ${operation} yet.`);
  expect(container.textContent).toContain('APP-12345678');
  expect(container.querySelector('a[href^="/resume"]')).toBeNull();
  expect(container.querySelector('a[href^="/payment"]')).toBeNull();
  expect(container.querySelector('input')).toBeNull();
});
it.each([404, 500, 'session-expired', 'technical-error'] as const)('offers the shared recovery links for %s', async status => {
  const onStartNew = vi.fn();
  await act(async () => root.render(<MemoryRouter><ApplicationErrorState status={status} onStartNew={onStartNew} /></MemoryRouter>));
  const actions = [...container.querySelectorAll('a')].filter(action => ['Return to home', 'Resume application', 'Start new application'].includes(action.textContent ?? ''));
  expect(actions.map(action => action.textContent)).toEqual(status === 404 ? ['Return to home', 'Resume application'] : ['Resume application', 'Start new application']);
  await act(async () => (actions[1] as HTMLElement).click());
  expect(onStartNew).toHaveBeenCalledTimes(status === 404 ? 0 : 1);
});
