import { act } from 'react';
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
afterEach(() => { vi.clearAllMocks(); vi.unstubAllGlobals(); });
const status = { username: 'reviewer', displayName: 'Reviewer', email: '', canManageAccounts: false, canEdit: false } as MockAuthStatus;
it('shows only Library and Storybook navigation while retaining sidebar controls', async () => {
  expect(new Set(adminNavigation.flatMap(group => group.items.map(item => item.icon))).size).toBe(adminNavigation.flatMap(group => group.items).length);
  const node = document.createElement('div'); document.body.append(node); const root = createRoot(node);
  const signOut = vi.fn();
  try {
    await act(async () => root.render(<MemoryRouter initialEntries={['/admin-center/library']}><AccountContext.Provider value={{ status, refresh: async () => {}, changePassword: vi.fn(), signOut }}><Routes><Route path="/admin-center/*" element={<AdminCenterShell />} /></Routes></AccountContext.Provider></MemoryRouter>));
    expect(node.querySelector('nav a[href="/admin-center/administration"]')).toBeNull();
    expect(node.textContent).not.toContain('TPA Admin');
    expect([...node.querySelectorAll('nav a')].map(link => link.getAttribute('aria-label'))).toEqual(['Portal Library', 'Storybook']);
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
