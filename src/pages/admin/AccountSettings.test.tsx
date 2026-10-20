import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeAll, expect, it, vi } from 'vitest';
import { AccountContext } from '../../admin/AccountContext';
import { performPasskey } from '../../mock/passkeys';
import { mockRequest, type MockAuthStatus } from '../../mock/client';
import AccountSettings from './AccountSettings';
vi.mock('../../mock/client', () => ({ mockRequest: vi.fn() }));
vi.mock('../../mock/passkeys', () => ({ supportsPasskeys: () => true, performPasskey: vi.fn() }));
beforeAll(() => vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true));
afterEach(() => vi.clearAllMocks());
const status: MockAuthStatus = { username: 'caroline', displayName: 'Caroline', email: '', groupId: 'portal-team', groupIds: ['portal-team', 'portal-master-admin'], canManageAccounts: true, canEdit: true, mode: 'mock', authenticated: true, mfaVerified: true, passwordAccepted: true, passwordExpired: false, passwordExpiresAt: null, sessionExpiresAt: null, setupNeeded: false, recoveryRequired: false, enrollmentNeeded: false };
it('shows naming only after Add is selected and waits for explicit submission before device registration', async () => {
  vi.mocked(mockRequest).mockResolvedValue({ ...status, groups: [{ id: 'portal-team', label: 'Portal Team' }, { id: 'portal-master-admin', label: 'Portal Master Admin' }], passkeys: [], totpEnrolled: true });
  vi.mocked(performPasskey).mockResolvedValue({});
  const node = document.createElement('div'), root = createRoot(node);
  const session = { status, refresh: vi.fn(async () => {}), signOut: vi.fn(), changePassword: vi.fn() };
  try {
    await act(async () => root.render(<MemoryRouter initialEntries={['/admin-center/account/settings']}><AccountContext.Provider value={session}><AccountSettings /></AccountContext.Provider></MemoryRouter>));
    expect(node.textContent).toContain('Portal Master Admin');
    expect([...node.querySelectorAll('a[href="/admin-center/administration"]')].some(link => link.textContent === 'Manage accounts')).toBe(true);
    expect(document.querySelector('input[placeholder="e.g. Work laptop"]')).toBeNull();
    await act(async () => [...node.querySelectorAll('button')].find(button => button.textContent === 'Add a device passkey')!.click());
    const input = document.querySelector<HTMLInputElement>('input[placeholder="e.g. Work laptop"]')!;
    expect(input).not.toBeNull(); expect(performPasskey).not.toHaveBeenCalled();
    await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'My laptop'); input.dispatchEvent(new Event('input', { bubbles: true })); });
    await act(async () => document.querySelector('#add-passkey-form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(performPasskey).toHaveBeenCalledWith(true, 'My laptop');
    expect(node.textContent).toContain('Passkey added.');
  } finally { await act(async () => root.unmount()); }
});
it('separates profile details from settings and hides management tabs from reviewers', async () => {
  vi.mocked(mockRequest).mockResolvedValue({ ...status, groups: [{ id: 'tpa', label: 'TPA' }], passkeys: [], totpEnrolled: true });
  const node = document.createElement('div'), root = createRoot(node);
  const session = { status: { ...status, displayName: 'Reviewer', username: 'tpa-viewer', email: 'reviewer@example.invalid', groupId: 'tpa', groupIds: ['tpa'], canManageAccounts: false }, refresh: vi.fn(async () => {}), signOut: vi.fn(), changePassword: vi.fn() };
  try {
    await act(async () => root.render(<MemoryRouter initialEntries={['/admin-center/account/profile']}><AccountContext.Provider value={session}><AccountSettings /></AccountContext.Provider></MemoryRouter>));
    expect(node.textContent).toContain('Name: Reviewer');
    expect(node.textContent).toContain('Username: tpa-viewer');
    expect(node.textContent).toContain('Email: reviewer@example.invalid');
    expect(node.textContent).toContain('TPA');
    expect(node.textContent).toContain('Deactivate account');
    expect(node.querySelector('a[href="/admin-center/administration"]')).toBeNull();
    expect(node.textContent).not.toContain('Reset password');
    await act(async () => node.querySelector<HTMLAnchorElement>('a[href="/admin-center/account/settings"]')!.click());
    expect(node.textContent).toContain('Reset password');
    expect(node.textContent).toContain('No scheduled expiration');
    expect(node.textContent).not.toContain('Deactivate account');
  } finally { await act(async () => root.unmount()); }
});
