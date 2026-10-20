import { MemoryRouter } from 'react-router-dom';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeAll, expect, it, vi } from 'vitest';
import { AccountContext } from '../../admin/AccountContext';
import { mockRequest, type MockAuthStatus } from '../../mock/client';
import AdministrationWorkspace from './AdministrationWorkspace';
vi.mock('../../mock/client', () => ({ mockRequest: vi.fn() }));
beforeAll(() => vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true));
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
const status: MockAuthStatus = { username: 'account-admin', email: '', groupId: 'portal-team', canEdit: false, canManageAccounts: true, mode: 'mock', authenticated: true, mfaVerified: true, passwordAccepted: true, passwordExpired: false, passwordExpiresAt: null, sessionExpiresAt: null, setupNeeded: false, recoveryRequired: false, enrollmentNeeded: false };
const member = { username: 'viewer', displayName: 'Viewer', email: '', groupId: 'tpa', groupIds: ['tpa'], canEdit: false, canManageAccounts: false, provisioned: true, disabled: false };
it('restricts account-management controls by membership independently of portal editing', async () => {
  vi.stubEnv('VITE_MOCK_PLATFORM_ENABLED', 'true');
  vi.mocked(mockRequest).mockResolvedValue({ groups: [{ id: 'tpa', label: 'TPA', story: 'Review applications.' }], accounts: [member] });
  const node = document.createElement('div'), root = createRoot(node);
  const render = (canManageAccounts: boolean, canEdit: boolean) => root.render(<MemoryRouter><AccountContext.Provider value={{ status: { ...status, canManageAccounts, canEdit }, refresh: async () => {}, signOut: () => {}, changePassword: () => {} }}><AdministrationWorkspace /></AccountContext.Provider></MemoryRouter>);
  try {
    await act(async () => render(true, false));
    expect([...node.querySelectorAll('button')].some(button => button.textContent === 'Add account')).toBe(true);
    expect([...node.querySelectorAll('button')].some(button => button.textContent === 'Edit account')).toBe(true);
    await act(async () => [...node.querySelectorAll('button')].find(button => button.textContent === 'Suspend')!.click());
    expect(mockRequest).toHaveBeenCalledWith('/auth/accounts/status', { username: 'viewer', disabled: true });
    await act(async () => render(false, true));
    expect(node.textContent).toContain('requires Portal Master Admin membership');
    expect(node.textContent).not.toContain('Viewer');
    expect([...node.querySelectorAll('button')].some(button => button.textContent === 'Add account')).toBe(false);
    expect([...node.querySelectorAll('button')].some(button => button.textContent === 'Edit account')).toBe(false);
  } finally { await act(async () => root.unmount()); }
});
