import { Alert, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useState, type FormEvent, type ReactNode } from 'react';
import { PortalUserContext } from '../../admin/AccountContext';
import { useServiceData } from '../../hooks/useServiceData';
import { portalRequest, type PortalUser } from '../../services/portalClient';

const currentUser = () => portalRequest<PortalUser | null>('/session');

export default function PortalAdminGate({ children }: { children: ReactNode }) {
  const { data: user, loading, error, refresh } = useServiceData(currentUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  async function changeSession(action: 'login' | 'logout') {
    setBusy(true);
    setActionError('');
    try {
      await portalRequest('/session', action === 'login' ? { action, email, password } : { action });
      setPassword('');
      await refresh();
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!busy) void changeSession('login');
  }

  if (loading) return <Typography role="status" sx={{ p: 3 }}>Loading Portal Admin…</Typography>;
  if (error) return <Alert severity="error" action={<Button onClick={() => void refresh()}>Retry</Button>}>{error.message}</Alert>;
  if (user) return <PortalUserContext.Provider value={user}>
    <Stack direction="row" gap={2} alignItems="center" justifyContent="flex-end" sx={{ px: 3, py: 0.5 }}>
      <Typography variant="body2">{user.displayName}</Typography>
      <Button size="small" disabled={busy} onClick={() => void changeSession('logout')}>Sign out</Button>
    </Stack>
    {actionError && <Alert severity="error">{actionError}</Alert>}
    {children}
  </PortalUserContext.Provider>;
  return <Paper variant="outlined" sx={{ mx: 'auto', mt: 6, p: 3, maxWidth: 440 }}>
    <Stack component="form" onSubmit={submit} spacing={2}>
      <Typography variant="h3" component="h1">Portal Admin sign in</Typography>
      {actionError && <Alert severity="error">{actionError}</Alert>}
      <TextField label="Email" type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} />
      <TextField label="Password" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} />
      <Button type="submit" variant="contained" disabled={busy}>Sign in</Button>
    </Stack>
  </Paper>;
}
