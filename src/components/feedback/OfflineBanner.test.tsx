import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import OfflineBanner from './OfflineBanner';

let root: Root, container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  container = document.createElement('div'); document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it.each([true, false])('reflects initial browser connectivity (online=%s)', async online => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(online);
  await act(async () => root.render(<OfflineBanner />));
  expect(container.querySelector('[role="alert"]') !== null).toBe(!online);
});

it('shows on disconnect, clears on reconnect and preserves the current form answer and focus', async () => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  await act(async () => root.render(<><OfflineBanner /><input aria-label="Current answer" defaultValue="Kept answer" /></>));
  const input = container.querySelector('input')!; input.focus();
  await act(async () => window.dispatchEvent(new Event('offline')));
  const notice = container.querySelector('[role="alert"]')!;
  expect(notice.textContent).toContain('Any changes you make may not be saved.');
  expect(notice.textContent).not.toContain('Support reference');
  expect(notice.querySelector('a, button')).toBeNull();
  expect(document.activeElement).toBe(input);
  await act(async () => window.dispatchEvent(new Event('online')));
  expect(container.querySelector('[role="alert"]')).toBeNull();
  expect(input.value).toBe('Kept answer');
  expect(document.activeElement).toBe(input);
});

it('also shows for a reported offline operation and clears on the next online event', async () => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  await act(async () => root.render(<OfflineBanner />));
  await act(async () => window.dispatchEvent(new CustomEvent('application:technical-error', { detail: { code: 'OFFLINE', reference: 'REQ-7C2F91AB' } })));
  expect(container.textContent).toContain('You’re offline');
  expect(container.textContent).not.toContain('REQ-7C2F91AB');
  await act(async () => window.dispatchEvent(new Event('online')));
  expect(container.querySelector('[role="alert"]')).toBeNull();
});
