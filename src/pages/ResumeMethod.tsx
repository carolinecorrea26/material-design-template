import { useState, type FormEvent } from 'react';
import { Alert, Box, Button, Stack } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader';
import PageShell from '../components/layout/PageShell';
import FormShell from '../components/layout/FormShell';
import RadioSelectionGroup from '../components/forms/RadioSelectionGroup';
import { getPagePath, getPageTitle } from '../config/pages';
import { resolveSiteId } from '../data/activeSite';
import { applicantRecovery, recoveryFromSearch } from '../services/applicantSaveService';

export default function ResumeMethod() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const details = recoveryFromSearch(search, resolveSiteId());
  const [method, setMethod] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!details || !method || busy || !import.meta.env.VITE_MOCK_PLATFORM_ENABLED) return;
    setBusy(true); setError('');
    try {
      const challenge = await applicantRecovery.challenge(details, method === 'call' ? 'phone' : method);
      const query = new URLSearchParams(search); query.set('method', method === 'call' ? 'phone' : method); if (challenge.deliveryTarget) query.set('deliveryTarget', challenge.deliveryTarget); query.set('codeExpiresAt', String(challenge.expiresAt));
      navigate(`${getPagePath('resume-code')}?${query}`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Challenge failed'); }
    finally { setBusy(false); }
  }
  return <Box sx={{ flex: 1, px: { xs: 2, sm: 3 }, py: { xs: 4, sm: 6 } }}>
    <PageShell title={getPageTitle('resume-method')} maxWidth={600} noTitle><FormShell sx={{ px: { xs: 2, sm: 4 }, py: 6 }}>
      <PageHeader title={getPageTitle('resume-method')} subhead="Choose how you would like to receive your verification code." onBack={() => navigate(-1)} />
      <Stack component="form" spacing={2} onSubmit={submit}>
        {!details && <Alert severity="error">Open a valid link from your resume request. No application has been loaded.</Alert>}
        <RadioSelectionGroup name="resume-delivery-method" label="Delivery method" options={[{ value: 'text', label: 'Text' }, { value: 'call', label: 'Call' }]} value={method} onChange={setMethod} />
        {error && <Alert severity="error">{error}</Alert>}
        <Button type="submit" fullWidth size="large" variant="contained" disabled={busy || !method || !details || !import.meta.env.VITE_MOCK_PLATFORM_ENABLED}>{busy ? 'Sending code…' : 'Next'}</Button>
      </Stack>
    </FormShell></PageShell>
  </Box>;
}
