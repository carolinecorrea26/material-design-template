import { useState, type FormEvent } from 'react';
import { Alert, Box, Button, CircularProgress, Stack, TextField } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader';
import PageShell from '../components/layout/PageShell';
import FormShell from '../components/layout/FormShell';
import { getPageSubhead, getPageTitle } from '../config/pages';
import { resolveSiteId } from '../data/activeSite';
import { applicantRecovery, readSavedApplication } from '../services/applicantSaveService';
import ApplicantMockOutbox from '../components/ui/ApplicantMockOutbox';
import useCountdown from '../hooks/useCountdown';
import ExpiringCodeAlert from '../components/feedback/ExpiringCodeAlert';
import ResendCountdownRow from '../components/feedback/ResendCountdownRow';

export default function Resume() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const siteKey = resolveSiteId();
  const [saved] = useState(() => readSavedApplication(siteKey));
  const [recipient, setRecipient] = useState(saved?.recipient ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<{ applicationId: string; recipient: string } | null>(null);
  const { secondsLeft, restart } = useCountdown(600);
  async function request(event?: FormEvent) {
    event?.preventDefault();
    if (busy) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.trim())) { setError('Enter a valid email address.'); return; }
    setError(''); setBusy(true);
    try {
      if (!import.meta.env.VITE_MOCK_PLATFORM_ENABLED) throw new Error('Application recovery is unavailable. Please try again later.');
      const result = await applicantRecovery.request(search.get('applicationId') ?? (saved?.recipient === recipient.trim().toLowerCase() ? saved.applicationId : ''), siteKey, recipient.trim());
      restart(Math.max(0, Math.ceil((result.expiresAt - Date.now()) / 1000)));
      setSent({ applicationId: result.applicationId, recipient: recipient.trim().toLowerCase() });
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Resume request failed'); }
    finally { setBusy(false); }
  }
  return <Box sx={{ flex: 1, px: { xs: 2, sm: 3 }, py: { xs: 4, sm: 6 } }}>
    <PageShell title={getPageTitle('resume')} maxWidth={600} noTitle><FormShell sx={{ px: { xs: 2, sm: 4 }, py: 6 }}>
      <PageHeader title={getPageTitle('resume')} subhead={getPageSubhead('resume')} onBack={() => navigate(-1)} />
      <Stack component="form" spacing={3} onSubmit={event => void request(event)} noValidate sx={{ py: 1 }}>
        {sent ? <>
          <ExpiringCodeAlert secondsLeft={secondsLeft} kind="link" onResend={() => void request()}>A secure link has been sent to <strong>{sent.recipient}</strong>. Open your email and click the link to continue.</ExpiringCodeAlert>
          <ResendCountdownRow secondsLeft={secondsLeft} kind="link" disabled={busy} onResend={() => void request()} />
          <ApplicantMockOutbox applicationId={sent.applicationId} siteKey={siteKey} recipient={sent.recipient} />
        </> : <TextField fullWidth required type="email" label="Email" value={recipient} disabled={busy} onChange={event => { setRecipient(event.target.value); setError(''); }} error={!!error} helperText={error || undefined} />}
        {sent && error && <Alert severity="error">{error}</Alert>}
        {(!sent || busy) && <Button fullWidth size="large" type="submit" variant="contained" disabled={busy}>{busy ? <CircularProgress size={24} color="inherit" aria-label="Sending secure link" /> : 'Next'}</Button>}
      </Stack>
    </FormShell></PageShell>
  </Box>;
}
