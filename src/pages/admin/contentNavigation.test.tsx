import { readFileSync } from 'node:fs';
import { act, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import PortalLibrary from './PortalLibrary';
import { projectLibraryCatalog } from '../../services/libraryCatalogService';

const catalog = projectLibraryCatalog(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')));
vi.mock('./library/LibraryCatalogContext', () => ({ useLibraryCatalog: () => catalog, LibraryCatalogProvider: ({ children }: { children: ReactNode }) => children }));

it.each(['all', 'asce'])('shows unified Content and a separate Emails destination (%s)', async site => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () => root.render(<ThemeProvider theme={createTheme()}><MemoryRouter initialEntries={[`/admin-center/library/content?site=${site}&dataset=documentDefinitions`]}><Routes><Route path="/admin-center/library/:domainId" element={<PortalLibrary />} /></Routes></MemoryRouter></ThemeProvider>));
    const tabs = () => [...host.querySelectorAll<HTMLElement>('[aria-label="Portal Library domains"] [role="tab"]')];
    expect(tabs().find(tab => tab.textContent === 'Content')?.getAttribute('aria-selected')).toBe('true');
    expect(host.querySelector('[aria-label="Content views"]')).toBeNull();
    expect(host.querySelector('table[aria-label="Content"]')).not.toBeNull();
    expect(host.querySelector('input[role="combobox"]')).toBeNull();
    expect(host.textContent).not.toContain('Definitions');
    const emails = tabs().find(tab => tab.textContent === 'Emails')!;
    expect(emails.getAttribute('href')).toBe(`/admin-center/library/emails?site=${site}`);
    await act(async () => emails.click());
    expect(tabs().find(tab => tab.textContent === 'Emails')?.getAttribute('aria-selected')).toBe('true');
    expect(host.querySelector('table[aria-label="Email templates"]')).not.toBeNull();
    expect(host.querySelector('table[aria-label="Content"]')).toBeNull();
  } finally { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); }
});

it.each(['all', 'asce'])('shows the source record and real dialog usage next to the content (%s)', async site => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () => root.render(<ThemeProvider theme={createTheme()}><MemoryRouter initialEntries={[`/admin-center/library/content?site=${site}&q=footer.terms-of-use-content.title`]}><Routes><Route path="/admin-center/library/:domainId" element={<PortalLibrary />} /></Routes></MemoryRouter></ThemeProvider>));
    const table = host.querySelector('table[aria-label="Content"]')!;
    expect(table.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(table.textContent).toContain('Site footer › Terms of Use dialog');
    expect(table.textContent).toContain('After opening Terms of Use');
    expect(table.querySelector(`a[href="/admin-center/library/components?site=${site}&q=AppFooter&table=components"]`)).not.toBeNull();
    const headings = [...table.querySelectorAll('thead th')].map(cell => cell.textContent);
    expect(headings.indexOf('Used in')).toBeLessThan(headings.indexOf('Global default'));
    const details = table.querySelector('details')!;
    expect(details.open).toBe(false);
    await act(async () => details.querySelector('summary')!.click());
    expect(details.open).toBe(true);
    expect(details.textContent).toContain('requirements/global/content/application.json');
    expect(details.textContent).toContain('footer.terms-of-use-content.title');
  } finally { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); }
});
