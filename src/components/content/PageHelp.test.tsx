import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import PageHelp from './PageHelp';
import { pageHelpExampleItems } from '../../../.storybook/pageHelpExample';
import * as client from '../../config/client/getActiveClient';
import * as library from '../../domain/prototypeLibrary';
let root: Root, host: HTMLDivElement;
beforeEach(() => {
  vi.useFakeTimers(); vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
it('opens the selected source topic and closes its shared drawer without reading a page or Site', async () => {
  vi.spyOn(client, 'getActiveClient').mockImplementation(() => { throw new Error('Shared help must be explicit'); });
  vi.spyOn(library, 'getPrototypeLibrary').mockImplementation(() => { throw new Error('Shared help must be explicit'); });
  await act(async () => root.render(<PageHelp items={pageHelpExampleItems} />));
  const chips = [...host.querySelectorAll<HTMLElement>('[role="button"]')];
  expect(chips.map(chip => chip.textContent)).toEqual(pageHelpExampleItems.map(item => item.label));
  await act(async () => chips[1].click());
  expect(document.body.textContent).toContain('The percentage share determines');
  const titleId = document.querySelector('.MuiDrawer-paper')!.getAttribute('aria-labelledby')!;
  expect(document.getElementById(titleId)?.textContent).toBe(pageHelpExampleItems[1].title);
  await act(async () => document.querySelector<HTMLButtonElement>('[aria-label="Close drawer"]')!.click());
  await act(async () => vi.advanceTimersByTimeAsync(400));
  expect(document.querySelector('.MuiDrawer-paper')).toBeNull();
  await act(async () => chips[0].click());
  expect(document.body.textContent).toContain('A beneficiary is the person');
  expect(document.body.textContent).not.toContain('The percentage share determines');
});
it('renders no chips or drawer when no help topics are assigned', async () => {
  await act(async () => root.render(<PageHelp items={[]} />));
  expect(host.childElementCount).toBe(0);
  expect(document.querySelector('.MuiDrawer-paper')).toBeNull();
});
