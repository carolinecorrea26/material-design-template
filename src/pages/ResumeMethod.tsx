import { requirementText } from "../domain/requirementContent";
import { useState } from 'react';
import { Alert, Box, Button, Stack } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader';
import PageShell from '../components/layout/PageShell';
import FormShell from '../components/layout/FormShell';
import { useForm } from 'react-hook-form';
import FieldRenderer from '../components/forms/FieldRenderer';
import { getPageFieldDefinition } from '../config/fields/resolvedFieldRegistry';
import { getPagePath, getPageTitle } from '../config/pages';
import { resolveSiteId } from '../data/activeSite';
import { applicantRecovery, recoveryFromSearch } from '../services/applicantSaveService';

export default function ResumeMethod() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const siteKey = resolveSiteId();
  const details = recoveryFromSearch(search, siteKey);
  const field = getPageFieldDefinition('resume-method', siteKey, 'resume-delivery-method');
  const form = useForm<Record<string, string | boolean | string[]>>({ defaultValues: { [field.id]: '' } });
  const method = String(form.watch(field.id) ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit() { if (!details || !method || busy || !import.meta.env.VITE_MOCK_PLATFORM_ENABLED) return;
    setBusy(true); setError('');
    try {
      const challenge = await applicantRecovery.challenge(details, method === 'call' ? 'phone' : method);
      const query = new URLSearchParams(search); query.set('method', method === 'call' ? 'phone' : method); if (challenge.deliveryTarget) query.set('deliveryTarget', challenge.deliveryTarget); query.set('codeExpiresAt', String(challenge.expiresAt));
      navigate(`${getPagePath('resume-code')}?${query}`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : requirementText("application.ui.challenge-failed")); }
    finally { setBusy(false); }
  }
  return <Box sx={{ flex: 1, px: { xs: 2, sm: 3 }, py: { xs: 4, sm: 6 } }}>
    <PageShell title={getPageTitle('resume-method')} maxWidth={600} noTitle><FormShell sx={{ px: { xs: 2, sm: 4 }, py: 6 }}>
      <PageHeader title={getPageTitle('resume-method')} subhead={requirementText("application.ui.choose-how-you-would-like-to-receive-your-verification-code")} onBack={() => navigate(-1)} />
      <Stack component="form" spacing={2} onSubmit={form.handleSubmit(() => void submit())}>
        {!details && <Alert severity="error">{requirementText("application.ui.open-a-valid-link-from-your-resume-request-no-application-has-been-loaded")}</Alert>}
        <FieldRenderer field={{ ...field, disabled: field.disabled || busy }} control={form.control} errors={form.formState.errors} onValueChange={() => setError('')} />
        {error && <Alert severity="error">{error}</Alert>}
        <Button type="submit" fullWidth size="large" variant="contained" disabled={busy || !method || !details || !import.meta.env.VITE_MOCK_PLATFORM_ENABLED}>{busy ? requirementText("application.ui.sending-code") : requirementText("navigation.next")}</Button>
      </Stack>
    </FormShell></PageShell>
  </Box>;
}
