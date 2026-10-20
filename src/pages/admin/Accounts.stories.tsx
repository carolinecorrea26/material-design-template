import type { Meta, StoryObj } from '@storybook/react-vite';
import { AccountContext } from '../../admin/AccountContext';
import AdministrationWorkspace, { type AccountDirectory } from './AdministrationWorkspace';
import AccountSettings, { type AccountDetails } from './AccountSettings';
import type { MockAuthStatus } from '../../mock/client';
const groups = [
  { id: 'portal-master-admin', label: 'Portal Master Admin', administrative: true, story: 'Manage individual accounts, group membership, and account access.' },
  { id: 'portal-team', label: 'Portal Team', story: 'Review portal configuration, site builds, changes, and releases.' },
  { id: 'account-managers', label: 'Account Managers', story: 'Review client sites, requests, and release progress.' },
  { id: 'majesco', label: 'Majesco', story: 'Review configuration and release details for implementation.' },
  { id: 'tpa', label: 'TPA', story: 'Review sites, applications, and operational reporting.' },
];
const directory: AccountDirectory = { groups, accounts: [
  { username: 'caroline', displayName: 'Caroline', email: 'caroline@example.invalid', groupId: 'portal-team', groupIds: ['portal-team', 'portal-master-admin'], canManageAccounts: true, canEdit: true, provisioned: true },
  ...groups.filter(g => !g.administrative).map(g => ({ username: `${g.id}-viewer`, displayName: `${g.label} reviewer`, email: '', groupId: g.id, groupIds: [g.id], canManageAccounts: false, canEdit: false, provisioned: false })),
] };
const meta = { title: 'Admin Center/Accounts & groups', component: AdministrationWorkspace, parameters: { layout: 'fullscreen' }, args: { previewData: directory } } satisfies Meta<typeof AdministrationWorkspace>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Directory: Story = { render: () => <AccountContext.Provider value={{ status: { ...directory.accounts[0], mode: 'mock', authenticated: true, mfaVerified: true, passwordAccepted: true, passwordExpired: false, passwordExpiresAt: null, sessionExpiresAt: null, setupNeeded: false, recoveryRequired: false, enrollmentNeeded: false }, refresh: async () => {}, signOut: () => {}, changePassword: () => {} }}><AdministrationWorkspace previewData={directory} /></AccountContext.Provider> };
function accountStory(groupId: string, owner = false): Story {
  const member = directory.accounts.find(a => owner ? a.username === 'caroline' : a.groupId === groupId && !a.canEdit)!;
  const details: AccountDetails = { ...member, totpEnrolled: true, passkeys: [{ id: 'preview-passkey', label: 'Work laptop', createdAt: Date.UTC(2026, 9, 5, 12) }], groups };
  const status: MockAuthStatus = { ...member, mode: 'mock', authenticated: true, mfaVerified: true, passwordAccepted: true, passwordExpired: false, passwordExpiresAt: Date.UTC(2026, 10, 4, 12), sessionExpiresAt: null, setupNeeded: false, recoveryRequired: false, enrollmentNeeded: false, passkeyCount: 1, totpEnrolled: true };
  return { render: () => <AccountContext.Provider value={{ status, refresh: async () => {}, signOut: () => {}, changePassword: () => {} }}><AccountSettings previewDetails={details} /></AccountContext.Provider> };
}
export const CarolineEditor = accountStory('portal-team', true);
export const PortalTeamReviewer = accountStory('portal-team');
export const AccountManagerReviewer = accountStory('account-managers');
export const MajescoReviewer = accountStory('majesco');
export const TpaReviewer = accountStory('tpa');
