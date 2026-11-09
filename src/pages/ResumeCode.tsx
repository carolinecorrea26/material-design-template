import { requirementText } from "../domain/requirementContent";
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import FieldRenderer from '../components/forms/FieldRenderer';
import { getPageFieldDefinition } from '../config/fields/resolvedFieldRegistry';
import { Alert, Box, Button, CircularProgress, Stack } from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader';
import PageShell from '../components/layout/PageShell';
import FormShell from '../components/layout/FormShell';
import { getPagePath, getPageTitle } from '../config/pages';
import { resolveSiteId } from '../data/activeSite';
import { applicantRecovery, recoveryFromSearch } from '../services/applicantSaveService';
import { useApplicationForm } from '../app/ApplicationFormContext';
import { useApplicationSession } from '../app/ApplicationSessionContext';
import ApplicantMockOutbox from '../components/demo/ApplicantMockOutbox';
import useCountdown from '../hooks/useCountdown';
import ExpiringCodeAlert from '../components/feedback/ExpiringCodeAlert';
import ResendCountdownRow from '../components/feedback/ResendCountdownRow';
import prototypeDefaults from '../../requirements/global/prototype-fixtures/application.json';

export default function ResumeCode() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const siteKey = resolveSiteId();
  const details = recoveryFromSearch(search, siteKey);
  const { restoreApplication } = useApplicationForm();
  const { resetApplicationSession } = useApplicationSession();
  const field = getPageFieldDefinition('resume-code', siteKey, 'resume-security-code');
  const form = useForm<Record<string, string | boolean | string[]>>({ defaultValues: { [field.id]: '' } });
  const code = String(form.watch(field.id) ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resent, setResent] = useState(false);
  const expiresAt = Number(search.get('codeExpiresAt'));
  const codeDuration = prototypeDefaults.resumeCodeValidityMs / 1000;
  const duration = expiresAt > 0 ? Math.max(0, Math.min(codeDuration, Math.ceil((expiresAt - Date.now()) / 1000))) : codeDuration;
  const { secondsLeft, start, restart } = useCountdown(duration);
  useEffect(() => { start(); }, [start]);
  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => navigate(`${getPagePath('eligibility')}?site=${encodeURIComponent(siteKey)}`, { replace: true, state: { resumeLoaded: true } }), prototypeDefaults.resumeTransitionMs);
    return () => window.clearTimeout(timer);
  }, [success, navigate, siteKey]);
  async function resend() {
    if (!details || busy || success || !import.meta.env.VITE_MOCK_PLATFORM_ENABLED) return;
    setBusy(true); setError('');
    try {
      const challenge = await applicantRecovery.challenge(details, search.get('method') ?? 'email');
      restart(Math.max(0, Math.ceil((challenge.expiresAt - Date.now()) / 1000)));
      form.setValue(field.id, ''); setResent(true);
    } catch (reason) { setError(reason instanceof Error ? reason.message : requirementText("application.ui.resend-failed")); }
    finally { setBusy(false); }
  }
  async function verify() {
    if (!details || !restoreApplication || busy || success || secondsLeft === 0 || !import.meta.env.VITE_MOCK_PLATFORM_ENABLED) return;
    if (!/^\d{6}$/.test(code.trim())) { setError(requirementText("application.ui.enter-your-six-digit-verification-code")); return; }
    setBusy(true); setError('');
    try {
      const application = await applicantRecovery.verify(details, code.trim());
      restoreApplication(application); resetApplicationSession(); setSuccess(true);
    } catch (reason) { setError(reason instanceof Error ? reason.message : requirementText("application.ui.recovery-failed")); }
    finally { setBusy(false); }
  }
  const unavailable = !details || !import.meta.env.VITE_MOCK_PLATFORM_ENABLED;
  const method = search.get('method') ?? 'email';
  const subhead = method === 'email' ? <>{requirementText("application.ui.please-enter-the-verification-code-sent-to")}<strong>{details?.recipient ?? requirementText("application.ui.your-email-address")}</strong>{"."}</> : search.get('deliveryTarget') ? <>{requirementText("application.ui.please-enter-the-verification-code-sent-to-the-phone-number")}<strong>{search.get('deliveryTarget')}</strong>{"."}</> : 'Please enter the verification code sent to your saved phone number.';
  return <Box sx={{ flex: 1, px: { xs: 2, sm: 3 }, py: { xs: 4, sm: 6 } }}>
    <PageShell title={getPageTitle('resume-code')} maxWidth={600} noTitle><FormShell sx={{ px: { xs: 2, sm: 4 }, py: 6 }}>
      <PageHeader title={getPageTitle('resume-code')} subhead={subhead} onBack={() => navigate(`${getPagePath('resume-method')}?${search}`)} />
      <Stack component="form" spacing={2} onSubmit={form.handleSubmit(() => void verify())} noValidate sx={{ py: 1 }}>
        {!details && <Alert severity="error">{requirementText("application.ui.open-a-valid-resume-link-to-continue")}</Alert>}
        <ExpiringCodeAlert secondsLeft={secondsLeft} kind="code" onResend={() => void resend()} showConfirmation={resent} confirmationMessage={requirementText("application.ui.a-new-verification-code-has-been-sent")} />
        <FieldRenderer field={{ ...field, disabled: field.disabled || busy || success || secondsLeft === 0 }} control={form.control} errors={error ? { ...form.formState.errors, [field.id]: { type: 'manual', message: error } } : form.formState.errors} onValueChange={() => { setError(''); setResent(false); }} />
        <ResendCountdownRow secondsLeft={secondsLeft} kind="code" disabled={busy || success || unavailable} onResend={() => void resend()} />
        <Button type="submit" fullWidth size="large" variant="contained" disabled={busy || success || unavailable || secondsLeft === 0} sx={{ mt: '24px !important', ...(success ? { '&.Mui-disabled': { bgcolor: 'success.main', color: 'common.white' } } : {}) }}>
          {success ? <CheckRoundedIcon aria-label={requirementText("application.ui.verified-successfully")} /> : busy ? <CircularProgress size={24} color="inherit" aria-label={requirementText("application.ui.verifying-code")} /> : requirementText("navigation.next")}
        </Button>
        {details && <ApplicantMockOutbox applicationId={details.applicationId} siteKey={siteKey} recipient={details.recipient} />}
      </Stack>
    </FormShell></PageShell>
  </Box>;
}
