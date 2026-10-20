import { useEffect, useState } from 'react';
import { Alert, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useAccount, useCanManageAccounts } from '../../admin/AccountContext';
import { mockRequest } from '../../mock/client';
import AccountTabs from '../../components/admin/AccountTabs';
import { Workspace, WorkspaceHeader } from '../../components/admin/AdminPrimitives';
import ResponsiveTableContainer from '../../components/docs/ResponsiveTableContainer';
type Group = { id: string; label: string; story: string; administrative?: boolean };
type Member = { username: string; displayName: string; email: string; groupId: string; groupIds?: string[]; canManageAccounts?: boolean; canEdit: boolean; provisioned: boolean; disabled?: boolean };
export type AccountDirectory = { groups: Group[]; accounts: Member[] };
const emptyForm = { username: '', displayName: '', email: '', groupId: 'portal-team', password: '', masterAdmin: false };
export default function AdministrationWorkspace({ previewData }: { previewData?: AccountDirectory } = {}) {
  const canManage = useCanManageAccounts(), account = useAccount();
  const [data, setData] = useState<AccountDirectory | null>(previewData ?? null), [error, setError] = useState(''), [busy, setBusy] = useState(false), [open, setOpen] = useState(false), [form, setForm] = useState(emptyForm), [editing, setEditing] = useState(false), [notice, setNotice] = useState('');
  const load = async () => setData(await mockRequest<AccountDirectory>('/auth/accounts', {}));
  useEffect(() => { if (canManage && import.meta.env.VITE_MOCK_PLATFORM_ENABLED && !previewData) void load().catch(e => setError(e.message)); }, [previewData, canManage]);
  const run = async (action: () => Promise<void>) => { setBusy(true); setError(''); setNotice(''); try { await action(); await load(); await account?.refresh(); } catch(e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); } };
  const save = () => void run(async () => {
    if (editing) await mockRequest('/auth/accounts/update', { username: form.username, displayName: form.displayName, email: form.email, groupId: form.groupId, masterAdmin: form.masterAdmin });
    else await mockRequest('/auth/accounts/provision', form);
    setOpen(false); setForm(emptyForm); setNotice(editing ? 'Account updated.' : 'Account created. The user can now sign in and set up their own verification method.');
  });
  const openMember = (member: Member, edit: boolean) => { setError(''); setEditing(edit); setForm({ username: member.username, displayName: member.displayName, groupId: member.groupId, email: member.email, password: '', masterAdmin: !!member.canManageAccounts }); setOpen(true); };
  const interactive = canManage && !previewData && !!import.meta.env.VITE_MOCK_PLATFORM_ENABLED;
  if (!canManage) return <Workspace><WorkspaceHeader title="Account management" description="Manage access to the Administration Center." /><AccountTabs value="profile" /><Alert severity="info">Account management requires Portal Master Admin membership.</Alert></Workspace>;
  return <Workspace><WorkspaceHeader title="Account management" description="Individual accounts, group membership, and access to the Administration Center." actions={interactive ? <Button variant="contained" onClick={() => { setError(''); setEditing(false); setForm(emptyForm); setOpen(true); }}>Add account</Button> : undefined} />
    <AccountTabs value="management" />
    {error && <Alert severity="error">{error}</Alert>}{notice && <Alert severity="success">{notice}</Alert>}
    <Alert severity="info">Portal Master Admins control account setup, profiles, group membership, and suspension. Caroline belongs to Portal Team and Portal Master Admin and remains the only portal editor.</Alert>
    {!canManage && <Typography variant="body2" color="text.secondary">You can view this directory. Account changes require Portal Master Admin membership.</Typography>}
    <Stack sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>{data?.groups.map(group => <Paper key={group.id} variant="outlined" sx={{ p: 2 }}><Stack spacing={1}><Typography component="h2" variant="h6">{group.label}</Typography><Typography variant="body2">{group.story}</Typography><Typography variant="caption" color="text.secondary">{data.accounts.filter(a => (a.groupIds ?? [a.groupId]).includes(group.id)).length} accounts · {group.administrative ? 'account management' : 'shared portal views'}</Typography></Stack></Paper>)}</Stack>
    {!previewData && !import.meta.env.VITE_MOCK_PLATFORM_ENABLED && <Alert severity="info">Connect the account service to manage individual sign-in accounts.</Alert>}
    {data && <ResponsiveTableContainer><Table><TableHead><TableRow><TableCell>Account</TableCell><TableCell>Username</TableCell><TableCell>Groups</TableCell><TableCell>Portal access</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead><TableBody>{data.accounts.map(member => <TableRow key={member.username}><TableCell>{member.displayName}</TableCell><TableCell>{member.username}</TableCell><TableCell><Stack spacing={0.5}>{(member.groupIds ?? [member.groupId]).map(id => <Typography key={id} variant="body2">{data.groups.find(g => g.id === id)?.label ?? id}</Typography>)}</Stack></TableCell><TableCell><Chip size="small" label={member.canEdit ? 'Editor' : 'Read only'} color={member.canEdit ? 'primary' : 'default'} /></TableCell><TableCell>{member.disabled ? 'Suspended' : member.provisioned ? 'Active' : 'Awaiting setup'}</TableCell><TableCell>{interactive && <Stack direction="row" useFlexGap flexWrap="wrap" gap={1}>
      {!member.provisioned && <Button disabled={busy} onClick={() => openMember(member, false)}>Set up account</Button>}
      <Button disabled={busy} onClick={() => openMember(member, true)}>Edit account</Button>
      <Button color={member.disabled ? 'primary' : 'warning'} disabled={busy || member.username === account?.status.username} onClick={() => void run(async () => { await mockRequest('/auth/accounts/status', { username: member.username, disabled: !member.disabled }); setNotice(member.disabled ? 'Account enabled.' : 'Account suspended. Its sessions have been signed out.'); })}>{member.disabled ? 'Enable' : 'Suspend'}</Button>
    </Stack>}</TableCell></TableRow>)}</TableBody></Table></ResponsiveTableContainer>}
    <Dialog open={open} onClose={() => !busy && setOpen(false)} fullWidth maxWidth="sm"><DialogTitle>{editing ? 'Edit account' : 'Set up account'}</DialogTitle><DialogContent><Stack component="form" id="account-form" spacing={2} sx={{ pt: 1 }} onSubmit={e => { e.preventDefault(); if (!busy) save(); }}>
      {error && <Alert severity="error">{error}</Alert>}<TextField required label="Display name" value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} /><TextField required label="Username" disabled={editing} value={form.username} onChange={e => setForm({ ...form, username: e.target.value.toLowerCase() })} helperText="3–64 lowercase letters, numbers, periods, or hyphens." /><TextField label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /><TextField select label="Portal group" value={form.groupId} onChange={e => setForm({ ...form, groupId: e.target.value })}>{data?.groups.filter(g => !g.administrative).map(g => <MenuItem key={g.id} value={g.id}>{g.label}</MenuItem>)}</TextField>
      <FormControlLabel label="Portal Master Admin membership" control={<Checkbox checked={form.masterAdmin} onChange={(_, checked) => setForm({ ...form, masterAdmin: checked })} />} />
      <Typography variant="body2" color="text.secondary">Portal Master Admin membership permits managing accounts. Portal editing remains limited to Caroline.</Typography>
      {!editing && <TextField required type="password" autoComplete="new-password" label="Initial password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} slotProps={{ htmlInput: { minLength: 12, maxLength: 256 } }} helperText="Share credentials privately. The user registers their own passkey or authenticator on first sign-in." />}
    </Stack></DialogContent><DialogActions><Button disabled={busy} onClick={() => setOpen(false)}>Cancel</Button><Button form="account-form" type="submit" variant="contained" disabled={busy || (!editing && form.password.length < 12) || !form.username || !form.displayName}>{editing ? 'Save account' : 'Create account'}</Button></DialogActions></Dialog>
  </Workspace>;
}
