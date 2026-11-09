import { requirementText } from "../domain/requirementContent";
import { useState, type FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import FieldRenderer from '../components/forms/FieldRenderer';
import { getPageFieldDefinition } from '../config/fields/resolvedFieldRegistry';
import { Alert, Box, Button, CircularProgress, Stack } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader';
import PageShell from '../components/layout/PageShell';
import FormShell from '../components/layout/FormShell';
import { getPageSubhead, getPageTitle } from '../config/pages';
import { resolveSiteId } from '../data/activeSite';
import { applicantRecovery, readSavedApplication } from '../services/applicantSaveService';
import ApplicantMockOutbox from '../components/demo/ApplicantMockOutbox';
import useCountdown from '../hooks/useCountdown';
import ExpiringCodeAlert from '../components/feedback/ExpiringCodeAlert';
import ResendCountdownRow from '../components/feedback/ResendCountdownRow';
import prototypeDefaults from '../../requirements/global/prototype-fixtures/application.json';

export default function Resume() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const siteKey = resolveSiteId();
  const [saved] = useState(() => readSavedApplication(siteKey));
  const field = getPageFieldDefinition('resume', siteKey, 'resume-email');
  const form = useForm<Record<string, string | boolean | string[]>>({ defaultValues: { [field.id]: saved?.recipient ?? '' } });
  const recipient = String(form.watch(field.id) ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<{ applicationId: string; recipient: string } | null>(null);
  const { secondsLeft, restart } = useCountdown(prototypeDefaults.resumeLinkValidityMs / 1000);
  async function request(event?: FormEvent) {
    event?.preventDefault();
    if (busy) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.trim())) { setError(requirementText("application.ui.enter-a-valid-email-address")); return; }
    setError(''); setBusy(true);
    try {
      if (!import.meta.env.VITE_MOCK_PLATFORM_ENABLED) throw new Error(requirementText("application.ui.application-recovery-is-unavailable-please-try-again-later"));
      const result = await applicantRecovery.request(search.get('applicationId') ?? (saved?.recipient === recipient.trim().toLowerCase() ? saved.applicationId : ''), siteKey, recipient.trim());
      restart(Math.max(0, Math.ceil((result.expiresAt - Date.now()) / 1000)));
      setSent({ applicationId: result.applicationId, recipient: recipient.trim().toLowerCase() });
    } catch (reason) { setError(reason instanceof Error ? reason.message : requirementText("application.ui.resume-request-failed")); }
    finally { setBusy(false); }
  }
  return <Box sx={{ flex: 1, px: { xs: 2, sm: 3 }, py: { xs: 4, sm: 6 } }}>
    <PageShell title={getPageTitle('resume')} maxWidth={600} noTitle><FormShell sx={{ px: { xs: 2, sm: 4 }, py: 6 }}>
      <PageHeader title={getPageTitle('resume')} subhead={getPageSubhead('resume')} onBack={() => navigate(-1)} />
      <Stack component="form" spacing={3} onSubmit={form.handleSubmit(() => void request())} noValidate sx={{ py: 1 }}>
        {sent ? <>
          <ExpiringCodeAlert secondsLeft={secondsLeft} kind="link" onResend={() => void request()}>{requirementText("application.ui.a-secure-link-has-been-sent-to")}<strong>{sent.recipient}</strong>{requirementText("application.ui.open-your-email-and-click-the-link-to-continue")}</ExpiringCodeAlert>
          <ResendCountdownRow secondsLeft={secondsLeft} kind="link" disabled={busy} onResend={() => void request()} />
          <ApplicantMockOutbox applicationId={sent.applicationId} siteKey={siteKey} recipient={sent.recipient} />
        </> : <FieldRenderer field={{ ...field, disabled: field.disabled || busy }} control={form.control} errors={error ? { ...form.formState.errors, [field.id]: { type: 'manual', message: error } } : form.formState.errors} onValueChange={() => setError('')} />}
        {sent && error && <Alert severity="error">{error}</Alert>}
        {(!sent || busy) && <Button fullWidth size="large" type="submit" variant="contained" disabled={busy}>{busy ? <CircularProgress size={24} color="inherit" aria-label={requirementText("application.ui.sending-secure-link")} /> : requirementText("navigation.next")}</Button>}
      </Stack>
    </FormShell></PageShell>
  </Box>;
}
