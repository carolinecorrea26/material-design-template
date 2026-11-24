import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { expect, it, vi } from 'vitest';
import ApplicantAdminWorkspace from './ApplicantAdminWorkspace';
vi.mock('../../data/activeSite', async importOriginal => ({ ...await importOriginal<typeof import('../../data/activeSite')>(), resolveSiteId: () => 'asce' }));
it('tracks review stages and unlocks the canonical forms only for an approved example', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const store = new Map<string,string>();
  vi.stubGlobal('sessionStorage', { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => store.set(key, value) });
  const node = document.createElement('div'); document.body.append(node); const root = createRoot(node);
  try {
    await act(async () => root.render(<ThemeProvider theme={createTheme()}><MemoryRouter><ApplicantAdminWorkspace /></MemoryRouter></ThemeProvider>));
    expect(node.textContent).toContain('Member Review'); expect(node.textContent).toContain('Underwriting'); expect(node.textContent).toContain('Final Decision Status');
    const button = (text: string) => [...document.querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent === text)!;
    expect(button('Add payment information').disabled).toBe(true);
    await act(async () => node.querySelector('[role="combobox"]')!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })));
    await act(async () => document.querySelector<HTMLElement>('[role="option"][data-value="fast-track-approved"]')!.click());
    expect(button('Add payment information').disabled).toBe(false);
    await act(async () => button('Add payment information').click());
    expect(document.querySelector('iframe')?.getAttribute('src')).toContain('page=payment');
    expect(document.querySelector('iframe')?.getAttribute('src')).toContain('record=fast-track-approved');
    await act(async () => window.dispatchEvent(new MessageEvent('message', { origin: 'https://untrusted.invalid', data: { type: 'applicant-demo-saved', record: 'fast-track-approved', pageId: 'payment' } })));
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  } finally { await act(async () => root.unmount()); node.remove(); vi.unstubAllGlobals(); }
});
