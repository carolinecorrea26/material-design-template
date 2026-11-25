import { readFileSync } from 'node:fs';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import AppFooter from './AppFooter';
import { getActiveClient } from '../../config/client/getActiveClient';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../../domain/prototypeLibrary';
import { validateSharedCatalog } from '../../persistence/sharedCatalog';
let root: Root | undefined, container: HTMLDivElement;
afterEach(async () => { if (root) await act(async () => root!.unmount()); root = undefined; container?.remove(); installPrototypeLibrary(null); vi.unstubAllGlobals(); });
it('renders legal disclosures and offers shared Print actions in both legal modals', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  window.history.replaceState(null, '', '/?site=asce');
  const catalog = validateSharedCatalog(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')));
  installPrototypeLibrary(resolvePrototypeLibrary(catalog.data, 'asce', 'footer-print'));
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  await act(async () => root!.render(<AppFooter client={getActiveClient()} />));
  expect(container.querySelector('footer')?.textContent).toContain('trademarks');
  for (const label of ['NYL Terms of Use', 'NYL Privacy Notice']) {
    await act(async () => [...container.querySelectorAll('a')].find(link => link.textContent === label)!.click());
    const actions = document.querySelector('.MuiDialogActions-root')!;
    expect(actions.textContent).toContain('Print');
    expect(actions.textContent).toContain('Close');
    await act(async () => [...actions.querySelectorAll('button')].find(button => button.textContent === 'Close')!.click());
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 250)); });
  }
});
