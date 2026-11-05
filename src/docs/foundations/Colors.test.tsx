import { readFileSync } from 'node:fs';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import { afterEach, expect, it, vi } from 'vitest';
import { createAppTheme } from '../../app/theme';
import { Colors } from './Colors';
import { readSharedCatalog } from '../../persistence/sharedCatalog';

vi.mock('../../persistence/sharedCatalog', () => ({ readSharedCatalog: vi.fn() }));
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it('keeps the global palette separate from saved client colors and shows every Site in the table', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const catalog = { ...JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')), revision: 'color-test' };
  vi.mocked(readSharedCatalog).mockResolvedValue(catalog);
  const container = document.createElement('div'); document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<ThemeProvider theme={createAppTheme()}><Colors /></ThemeProvider>));
    expect(container.textContent).toContain('Global palette');
    const table = container.querySelector('table')!;
    expect(table.querySelectorAll('tbody tr')).toHaveLength(catalog.data.sites.length);
    for (const siteKey of ['waepa', 'waepa-gi']) {
      const row = table.querySelector(`[data-site="${siteKey}"]`)!;
      expect(row.textContent).toContain('#002c85');
      expect(row.textContent).toContain('#f1b435');
      expect(row.textContent).toContain('Custom');
      expect(row.querySelector('button')).toBeNull();
    }
    const globalOnly = container.cloneNode(true) as HTMLElement;
    globalOnly.querySelector('table')!.remove();
    expect(globalOnly.textContent).toContain('#0668ff');
    expect(globalOnly.textContent).not.toContain('#002c85');
    expect(globalOnly.textContent).not.toContain('#f1b435');
    expect(container.textContent).not.toContain('Reserved');
    expect(container.textContent).not.toContain('secondary.main');
    expect(container.textContent).toContain('text.secondary');
    expect(container.querySelector('button, a, .MuiAlert-root')).toBeNull();
    expect(container.textContent).not.toContain('Borders and applicant labels');
    expect(container.textContent).not.toContain('Support and next steps');
    for (const label of ['Support fill', 'Grouped content', 'Icon tint', 'Notice fill', 'Notice border', 'Status colors']) expect(container.textContent).not.toContain(label);
    for (const label of ['primary.main', 'primary.contrastText', 'background.paper', 'divider']) expect(container.textContent).toContain(label);
  } finally { await act(async () => root.unmount()); container.remove(); }
});

it('shows a client-table load error while retaining the global palette', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.mocked(readSharedCatalog).mockRejectedValue(new Error('Unavailable'));
  const container = document.createElement('div'); document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<ThemeProvider theme={createAppTheme()}><Colors /></ThemeProvider>));
    expect(container.textContent).toContain('Client colors could not be loaded.');
    expect(container.textContent).toContain('#0668ff');
  } finally { await act(async () => root.unmount()); container.remove(); }
});
