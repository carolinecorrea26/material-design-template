import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeAll, expect, it, vi } from 'vitest';
import { AccountContext } from '../../admin/AccountContext';
import type { MockAuthStatus } from '../../mock/client';
import { adminNavigation } from '../../admin/navigation';
import AdminCenterShell from './AdminCenterShell';
vi.mock('./MockAdminGate', () => ({ default: ({ children }: { children: React.ReactNode }) => children }));
beforeAll(() => vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true));
afterEach(() => { vi.clearAllMocks(); localStorage.clear(); });
const status = { username: 'reviewer', displayName: 'Reviewer', email: '', canManageAccounts: false, canEdit: false } as MockAuthStatus;
it('uses distinct section icons and hides account management from reviewers', async () => {
  expect(new Set(adminNavigation.flatMap(group => group.items.map(item => item.icon))).size).toBe(adminNavigation.flatMap(group => group.items).length);
  const node = document.createElement('div'); document.body.append(node); const root = createRoot(node);
  const signOut = vi.fn();
  try {
    await act(async () => root.render(<MemoryRouter initialEntries={['/admin-center']}><AccountContext.Provider value={{ status, refresh: async () => {}, changePassword: vi.fn(), signOut }}><Routes><Route path="/admin-center" element={<AdminCenterShell />} /></Routes></AccountContext.Provider></MemoryRouter>));
    expect(node.querySelector('nav a[href="/admin-center/administration"]')).toBeNull();
    expect(node.textContent).toContain('TPA Admin');
    await act(async () => node.querySelector<HTMLButtonElement>('button[aria-label="Collapse sidebar"]')!.click());
    expect(localStorage.getItem('adminRailCollapsed')).toBe('true');
    expect(node.querySelector('nav a[aria-label="Sites"]')).not.toBeNull();
    const separator = node.querySelector('[role="separator"]')!;
    await act(async () => separator.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })));
    expect(localStorage.getItem('adminRailCollapsed')).toBe('false');
    await act(async () => node.querySelector<HTMLButtonElement>('button[aria-label="Account menu"]')!.click());
    const menu = document.querySelector('[role="menu"]')!;
    expect(menu.querySelector('a[href="/admin-center/account/profile"]')).not.toBeNull();
    expect(menu.querySelector('a[href="/admin-center/account/settings"]')).not.toBeNull();
    expect(menu.textContent).not.toContain('Account Management');
    await act(async () => [...menu.querySelectorAll('[role="menuitem"]')].find(item => item.textContent === 'Sign out')!.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(signOut).toHaveBeenCalledOnce();
  } finally { await act(async () => root.unmount()); node.remove(); }
});
