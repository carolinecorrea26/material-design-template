import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import AppModal from './AppModal';
import SessionExpiryAlert from '../feedback/SessionExpiryAlert';

let root: Root, container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });

it('keeps inactivity expiry nondismissable, named, described and focused on extension', async () => {
  const extend = vi.fn();
  await act(async () => root.render(<SessionExpiryAlert secondsLeft={61} onKeepActive={extend} />));
  const dialog = document.querySelector<HTMLElement>('[role="alertdialog"]')!;
  expect(dialog).not.toBeNull();
  expect(document.getElementById(dialog.getAttribute('aria-labelledby')!)?.textContent).toBe('Your session is about to expire');
  expect(document.getElementById(dialog.getAttribute('aria-describedby')!)?.textContent).toContain('last saved progress');
  expect(dialog.querySelector('[role="timer"]')?.textContent).toContain('1:01');
  expect(dialog.querySelector('[aria-label="Close"]')).toBeNull();
  expect(dialog.classList.contains('MuiDialog-paperFullScreen')).toBe(false);
  const action = [...dialog.querySelectorAll('button')].find(button => button.textContent === 'Keep session active')!;
  expect(document.activeElement).toBe(action);
  await act(async () => dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
  expect(extend).not.toHaveBeenCalled();
  const backdrop = document.querySelector('.MuiDialog-container')!;
  await act(async () => { backdrop.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  expect(extend).not.toHaveBeenCalled();
  await act(async () => action.click());
  expect(extend).toHaveBeenCalledOnce();
});

it('keeps a staged header outside the scrolling content and supports normal dismissal', async () => {
  const close = vi.fn();
  await act(async () => root.render(<AppModal open title="Verification" onClose={close} headerContent={<nav aria-label="Current verification step">Step 2</nav>}><p>Questions</p></AppModal>));
  const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!;
  expect(dialog.querySelector('.MuiDialogContent-root nav')).toBeNull();
  expect(dialog.querySelector('nav')?.textContent).toBe('Step 2');
  expect(dialog.classList.contains('MuiDialog-paperFullScreen')).toBe(true);
  await act(async () => dialog.querySelector<HTMLButtonElement>('[aria-label="Close"]')!.click());
  expect(close).toHaveBeenCalledOnce();
});
