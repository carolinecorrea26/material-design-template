export const accountGroups = [
  { id: 'portal-master-admin', label: 'Portal Master Admin', administrative: true, story: 'Manage individual accounts, group membership, and account access.' },
  { id: 'portal-team', label: 'Portal Team', story: 'Review portal configuration, site builds, changes, and releases.' },
  { id: 'account-managers', label: 'Account Managers', story: 'Review client sites, requests, and release progress.' },
  { id: 'majesco', label: 'Majesco', story: 'Review configuration and release details for implementation.' },
  { id: 'tpa', label: 'TPA', story: 'Review sites, applications, and operational reporting.' },
];
export const memberAccounts = () => accountGroups.filter(group => !group.administrative).map(group => ({ username: `${group.id}-viewer`, displayName: `${group.label} reviewer`, groupId: group.id, groupIds: [group.id], email: '', passkeys: [], recoveryHashes: [], totpVerified: false, disabled: false }));
export function publicAccount(account) {
  const groupId = account?.groupId ?? 'portal-team';
  const groupIds = account?.groupIds ?? [groupId];
  return { username: account?.username ?? 'caroline', displayName: account?.displayName ?? 'Caroline', email: account?.email ?? 'caroline@example.invalid', groupId, groupIds, canManageAccounts: groupIds.includes('portal-master-admin'), canEdit: account?.portalEditor === true || account?.username === 'caroline', provisioned: !!account?.passwordHash, disabled: !!account?.disabled };
}
