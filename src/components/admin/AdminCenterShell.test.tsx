import { act, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AccountContext } from '../../admin/AccountContext';
import type { MockAuthStatus } from '../../mock/client';
import { adminNavigation } from '../../admin/navigation';
import AdminCenterShell from './AdminCenterShell';
vi.mock('./MockAdminGate', () => ({ default: ({ children }: { children: React.ReactNode }) => children }));
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const storage = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), clear: () => storage.clear() });
});
afterEach(() => { vi.clearAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
const status = { username: 'reviewer', displayName: 'Reviewer', email: '', canManageAccounts: false, canEdit: false } as MockAuthStatus;
it('shows Library, Tutorials and Storybook navigation while retaining sidebar controls', async () => {
  expect(new Set(adminNavigation.flatMap(group => group.items.map(item => item.icon))).size).toBe(adminNavigation.flatMap(group => group.items).length);
  const node = document.createElement('div'); document.body.append(node); const root = createRoot(node);
  const signOut = vi.fn();
  try {
    await act(async () => root.render(<MemoryRouter initialEntries={['/admin-center/library']}><AccountContext.Provider value={{ status, refresh: async () => {}, changePassword: vi.fn(), signOut }}><Routes><Route path="/admin-center/*" element={<AdminCenterShell />} /></Routes></AccountContext.Provider></MemoryRouter>));
    expect(node.querySelector('nav a[href="/admin-center/administration"]')).toBeNull();
    expect(node.textContent).not.toContain('TPA Admin');
    expect([...node.querySelectorAll('nav a')].map(link => link.getAttribute('aria-label'))).toEqual(['Applicant Admin', 'Portal Library', 'Tutorials', 'Storybook']);
    expect(node.querySelector('[aria-label="Account menu"]')).toBeNull();
    await act(async () => node.querySelector<HTMLButtonElement>('button[aria-label="Collapse sidebar"]')!.click());
    expect(localStorage.getItem('adminRailCollapsed')).toBe('true');
    expect(node.querySelector('nav a[aria-label="Portal Library"]')).not.toBeNull();
    const separator = node.querySelector('[role="separator"]')!;
    await act(async () => separator.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })));
    expect(localStorage.getItem('adminRailCollapsed')).toBe('false');
    expect(signOut).not.toHaveBeenCalled();
  } finally { await act(async () => root.unmount()); node.remove(); }
});

it('opens Site Builder from the Library in the local preview', async () => {
  vi.stubEnv('VITE_MOCK_PLATFORM_ENABLED', 'true');
  const node = document.createElement('div');
  document.body.append(node);
  const root = createRoot(node);
  try {
    await act(async () => root.render(<MemoryRouter initialEntries={['/admin-center/library']}>
      <Routes><Route path="/admin-center" element={<AdminCenterShell />}>
        <Route path="library" element={<h1>Library workspace</h1>} />
        <Route path="site-builder" element={<h1>Site Builder workspace</h1>} />
      </Route></Routes>
    </MemoryRouter>));
    const builderLink = node.querySelector<HTMLAnchorElement>('nav a[aria-label="Site Builder"]');
    expect(builderLink?.getAttribute('href')).toBe('/admin-center/site-builder');
    await act(async () => builderLink!.click());
    expect(node.querySelector('h1')?.textContent).toBe('Site Builder workspace');
  } finally { await act(async () => root.unmount()); node.remove(); }
});

it('keeps Admin navigation available while the selected workspace loads', async () => {
  let finish!: () => void;
  const DeferredWorkspace = lazy(() => new Promise<{ default: () => React.ReactNode }>(resolve => {
    finish = () => resolve({ default: () => <h1>Library workspace</h1> });
  }));
  const node = document.createElement('div');
  document.body.append(node);
  const root = createRoot(node);
  try {
    await act(async () => root.render(<MemoryRouter initialEntries={['/admin-center/library']}>
      <Routes><Route path="/admin-center" element={<AdminCenterShell />}>
        <Route path="library" element={<DeferredWorkspace />} />
      </Route></Routes>
    </MemoryRouter>));
    expect(node.querySelector('nav a[aria-label="Portal Library"]')).not.toBeNull();
    expect(node.querySelector('[role="status"]')?.getAttribute('aria-label')).toBe('Loading page');
    await act(async () => finish());
    expect(node.querySelector('h1')?.textContent).toBe('Library workspace');
    expect(node.querySelector('[role="status"]')).toBeNull();
  } finally { await act(async () => root.unmount()); node.remove(); }
});
