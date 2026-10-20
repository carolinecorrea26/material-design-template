import { Link as RouterLink, useLocation } from "react-router-dom";
import { useEffect, useState } from 'react';
import { Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Stack, TextField, Typography } from '@mui/material';
import { useAccount } from '../../admin/AccountContext';
import { mockRequest } from '../../mock/client';
import { supportsPasskeys, performPasskey } from '../../mock/passkeys';
import AccountTabs from '../../components/admin/AccountTabs';
import { Workspace, WorkspaceHeader } from '../../components/admin/AdminPrimitives';
export type AccountDetails = { username: string; displayName: string; email: string; groupId: string; groupIds?: string[]; canManageAccounts?: boolean; canEdit: boolean; totpEnrolled: boolean; passkeys: { id: string; label: string; createdAt: number }[]; groups: { id: string; label: string }[] };
export default function AccountSettings({ previewDetails }: { previewDetails?: AccountDetails } = {}) {
  const account = useAccount();
  const location = useLocation();
  const section = location.pathname.endsWith('/profile') || location.pathname === '/admin-center/account' ? 'profile' : 'settings';
  const [changingUsername, setChangingUsername] = useState(false), [newUsername, setNewUsername] = useState('');
  const [deactivating, setDeactivating] = useState(false);
  const [details, setDetails] = useState<AccountDetails | null>(previewDetails ?? null), [error, setError] = useState(''), [busy, setBusy] = useState(false), [label, setLabel] = useState(''), [notice, setNotice] = useState('');
  const [addingPasskey, setAddingPasskey] = useState(false);
  const load = async () => setDetails(await mockRequest<AccountDetails>('/auth/account', {}));
  const username = account?.status.username;
  useEffect(() => { if (username && !previewDetails) void mockRequest<AccountDetails>('/auth/account', {}).then(setDetails).catch(e => setError(e.message)); }, [username, previewDetails]);
  const run = async (action: () => Promise<void>) => { setBusy(true); setError(''); setNotice(''); try { await action(); await load(); await account?.refresh(); } catch(e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); } };
  if (!account) return <Workspace><WorkspaceHeader title="Your account" description="Sign in to manage your account." /></Workspace>;
  const status = account.status;
  return <Workspace><WorkspaceHeader title="Your account" description="Your profile, access, and sign-in methods." />
    <AccountTabs value={section} />
    {error && <Alert severity="error">{error}</Alert>}{notice && <Alert severity="success">{notice}</Alert>}
    <Stack spacing={3} sx={{ maxWidth: 820 }}>
      {section === 'profile' && <Paper variant="outlined" sx={{ p: 3 }}><Stack spacing={1}><Typography component="h2" variant="h6">Profile</Typography><Typography>Name: {status.displayName ?? status.username}</Typography><Typography color="text.secondary">Username: {status.username}</Typography><Typography color="text.secondary">Email: {status.email || 'Not provided'}</Typography><Typography variant="subtitle2" sx={{ pt: 1 }}>Teams</Typography><Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">{(status.groupIds ?? [status.groupId ?? 'portal-team']).map(groupId => <Chip key={groupId} label={details?.groups.find(g => g.id === groupId)?.label ?? (groupId === 'portal-master-admin' ? 'Portal Master Admin' : groupId === 'portal-team' ? 'Portal Team' : groupId)} />)}<Chip label={status.canEdit ? 'Editor' : 'Read only'} color={status.canEdit ? 'primary' : 'default'} /></Stack><Typography variant="body2" color="text.secondary">Portal editing is limited to Caroline. Portal Master Admins manage accounts and group membership.</Typography><Button color="error" variant="outlined" disabled={busy || !!previewDetails} sx={{ alignSelf: 'flex-start', mt: 2 }} onClick={() => setDeactivating(true)}>Deactivate account</Button></Stack></Paper>}
      {section === 'settings' && <Paper variant="outlined" sx={{ p: 3 }}><Stack spacing={2}><Typography component="h2" variant="h6">Sign-in methods</Typography><Typography variant="body2">After your password, verify with a registered passkey or authenticator app.</Typography><Typography>Authenticator app: {details?.totpEnrolled ? 'Set up' : 'Not set up'}</Typography>
        <Typography variant="subtitle2">Personal passkeys</Typography><Typography variant="body2" color="text.secondary">Passkey expiration: No scheduled expiration. You can remove a passkey at any time.</Typography>{details?.passkeys.map(key => <Stack key={key.id} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}><Typography sx={{ flex: 1 }}>{key.label}<Typography component="span" display="block" variant="caption" color="text.secondary">Added {new Date(key.createdAt).toLocaleDateString()}</Typography></Typography><Button disabled={!!previewDetails || busy || (!details.totpEnrolled && details.passkeys.length <= 1)} onClick={() => void run(async () => { await mockRequest('/auth/passkey/remove', { id: key.id }); setNotice('Passkey removed.'); })}>Remove</Button></Stack>)}
        {!details?.passkeys.length && <Typography color="text.secondary">No passkeys registered.</Typography>}
        <Button variant="outlined" disabled={!!previewDetails || busy || !supportsPasskeys()} onClick={() => { setLabel(''); setError(''); setAddingPasskey(true); }}>Add a device passkey</Button><Typography variant="body2" color="text.secondary">Your device handles fingerprint, face recognition, or PIN verification. Keep a recovery code or another registered device available.</Typography>
      </Stack></Paper>}
      {section === 'settings' && status.canManageAccounts && <Paper variant="outlined" sx={{ p: 3 }}><Stack spacing={2}><Typography component="h2" variant="h6">Account management</Typography><Typography variant="body2">Your Portal Master Admin membership lets you manage individual accounts, group assignments, and account access.</Typography><Button component={RouterLink} to="/admin-center/administration" variant="outlined">Manage accounts</Button></Stack></Paper>}
      {section === 'settings' && <Paper variant="outlined" sx={{ p: 3 }}><Stack spacing={2}><Typography component="h2" variant="h6">Password & username</Typography>{!status.passwordExpiresAt && <Typography variant="body2" color="text.secondary">Password expiration is unavailable.</Typography>}{status.passwordExpiresAt && <Typography variant="body2">Password expires {new Date(status.passwordExpiresAt).toLocaleDateString()}.</Typography>}<Stack direction="row" spacing={1} useFlexGap flexWrap="wrap"><Button variant="outlined" disabled={!!previewDetails || busy || status.signInDisabled} onClick={account.changePassword}>Reset password</Button><Button variant="outlined" disabled={!!previewDetails || busy || status.signInDisabled} onClick={() => { setNewUsername(status.username); setChangingUsername(true); }}>Change username</Button><Button color="warning" disabled={status.signInDisabled} onClick={account.signOut}>Sign out</Button></Stack></Stack></Paper>}
    </Stack>
    <Dialog open={changingUsername} onClose={() => !busy && setChangingUsername(false)} fullWidth maxWidth="sm">
      <DialogTitle>Change username</DialogTitle><DialogContent><Stack component="form" id="username-form" spacing={2} sx={{ pt: 1 }} onSubmit={event => { event.preventDefault(); void run(async () => { await mockRequest('/auth/account/username', { username: newUsername }); setChangingUsername(false); setNotice('Username updated.'); }); }}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField autoFocus required label="New username" value={newUsername} onChange={event => setNewUsername(event.target.value.toLowerCase())} helperText="3–64 lowercase letters, numbers, periods, or hyphens; start with a letter." slotProps={{ htmlInput: { pattern: '[a-z][a-z0-9.-]{2,63}', maxLength: 64 } }} />
        <Typography variant="body2">Use your new username the next time you sign in. Your existing passkeys will continue to work.</Typography>
      </Stack></DialogContent><DialogActions><Button disabled={busy} onClick={() => setChangingUsername(false)}>Cancel</Button><Button type="submit" form="username-form" variant="contained" disabled={busy || !!previewDetails || newUsername === status.username}>Save username</Button></DialogActions>
    </Dialog>
    <Dialog open={deactivating} onClose={() => !busy && setDeactivating(false)} fullWidth maxWidth="sm">
      <DialogTitle>Deactivate your account?</DialogTitle><DialogContent><Stack spacing={2}>{error && <Alert severity="error">{error}</Alert>}<Typography>You will be signed out on all devices and lose access to the Administration Center. A master admin can reactivate your account.</Typography><Typography variant="body2" color="text.secondary">At least one active master admin must remain.</Typography></Stack></DialogContent><DialogActions><Button disabled={busy} onClick={() => setDeactivating(false)}>Cancel</Button><Button color="error" variant="contained" disabled={busy || !!previewDetails} onClick={async () => { setBusy(true); setError(''); try { await mockRequest('/auth/account/deactivate', {}); account.signOut(); } catch (e) { setError(e instanceof Error ? e.message : String(e)); setBusy(false); } }}>Deactivate account</Button></DialogActions>
    </Dialog>
    <Dialog open={addingPasskey} onClose={() => !busy && setAddingPasskey(false)} fullWidth maxWidth="sm">
      <DialogTitle>Add a device passkey</DialogTitle><DialogContent><Stack component="form" id="add-passkey-form" spacing={2} sx={{ pt: 1 }} onSubmit={event => {
        event.preventDefault(); if (busy || previewDetails) return;
        void run(async () => { await performPasskey(true, label); setAddingPasskey(false); setLabel(''); setNotice('Passkey added. You can use it after entering your password.'); });
      }}>
        {error && <Alert severity="error">{error}</Alert>}
        <Typography variant="body2">Give this passkey an optional name, then continue to your device’s verification prompt.</Typography>
        <TextField autoFocus label="Passkey name (optional)" placeholder="e.g. Work laptop" value={label} onChange={e => setLabel(e.target.value)} slotProps={{ htmlInput: { maxLength: 80 } }} />
      </Stack></DialogContent><DialogActions><Button disabled={busy} onClick={() => { setAddingPasskey(false); setLabel(''); setError(''); }}>Cancel</Button><Button type="submit" form="add-passkey-form" variant="contained" disabled={!!previewDetails || busy || status.signInDisabled}>Create passkey</Button></DialogActions>
    </Dialog>
  </Workspace>;
}
