import PageAlert from "../components/feedback/PageAlert";
import StandaloneFormPage from "../components/layout/StandaloneFormPage";
import { resumeFailureMessage, resumePageIssue, type ResumePageIssue } from '../domain/resumeFeedback';
import { isAdvisorReviewQuery } from '../config/reviewExperience';
import { requirementText } from '../domain/requirementContent';
import { useEffect, useRef, useState } from 'react';
import { Button, Stack } from '@mui/material';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import FieldRenderer from '../components/forms/FieldRenderer';
import { getPageFieldDefinition } from '../config/fields/resolvedFieldRegistry';
import { getPagePath, getPageTitle, getPageSubhead } from '../config/pages';
import { resolveSiteId } from '../data/activeSite';
import { applicantRecovery, recoveryFromSearch, resumeSessionFromSearch, resumeMfaParameter, rememberResumeSession, forgetResumeSession, mfaDetails, resumeSessionQuery, resumeSessionForChallenge, resumeEntryQuery } from '../services/applicantSaveService';
import useResumeMfaDeadline from '../hooks/useResumeMfaDeadline';
import ResumeSessionWarning from '../components/feedback/ResumeSessionWarning';

export default function ResumeMethod() {
  const navigate = useNavigate();
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const [search] = useSearchParams();
  const siteKey = resolveSiteId();
  const session = resumeSessionFromSearch(search, siteKey);
  const details = session ? mfaDetails(session) : recoveryFromSearch(search, siteKey);
  const remaining = useResumeMfaDeadline(session);
  const field = getPageFieldDefinition('resume-method', siteKey, 'resume-delivery-method');
  const form = useForm<Record<string, string | boolean | string[]>>({ defaultValues: { [field.id]: session?.method === 'phone' ? 'call' : session?.method ?? '' } });
  const method = String(form.watch(field.id) ?? '');
  const [error, setError] = useState('');
  const [terminalIssue, setTerminalIssue] = useState<ResumePageIssue | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (!details || !field.options?.some(option => option.value === method) || busy || remaining === 0 || !import.meta.env.VITE_MOCK_PLATFORM_ENABLED) return;
    setBusy(true); setError('');
    try {
      const challenge = await applicantRecovery.challenge(details, method === 'call' ? 'phone' : method);
      if (!mounted.current) return;
      if (challenge.sessionExpiresAt <= Date.now()) throw Object.assign(new Error('MFA expired'), { code: 'RESUME_MFA_EXPIRED' });
      const next = resumeSessionForChallenge(details, challenge, session?.advisorFlow ?? isAdvisorReviewQuery(search));
      rememberResumeSession(next);
      navigate(`${getPagePath('resume-code')}?${resumeSessionQuery(next)}`, { replace: true });
    } catch (reason) {
      const issue = resumePageIssue(reason, details.recipient);
      if (issue) { setTerminalIssue(issue); forgetResumeSession(siteKey); }
      else setError(resumeFailureMessage(reason));
    } finally { setBusy(false); }
  }
  if (terminalIssue) return <Navigate replace to={`${getPagePath(terminalIssue.kind === 'mfa-expired' ? 'session-expired' : 'resume')}?${resumeEntryQuery(siteKey, session?.advisorFlow ?? isAdvisorReviewQuery(search))}`} state={terminalIssue.kind === 'mfa-expired' ? undefined : { resumeIssue: terminalIssue }} />;
  if (!details) return <Navigate replace to={`${getPagePath(search.has(resumeMfaParameter) ? 'session-expired' : 'resume')}?${resumeEntryQuery(siteKey, session?.advisorFlow ?? isAdvisorReviewQuery(search))}`} state={{ resumeIssue: { kind: search.has(resumeMfaParameter) ? 'mfa-expired' : 'link' } }} />;
  return <StandaloneFormPage title={getPageTitle('resume-method')} subhead={getPageSubhead('resume-method')} onBack={() => navigate(-1)}>

      <ResumeSessionWarning secondsLeft={remaining} />
      <Stack component="form" spacing={2} onSubmit={form.handleSubmit(() => void submit())}>
        <FieldRenderer field={{ ...field, disabled: field.disabled || busy }} control={form.control} errors={form.formState.errors} onValueChange={() => setError('')} />
        <PageAlert message={error} />
        <Button type="submit" fullWidth size="large" variant="contained" disabled={busy || !method || remaining === 0 || !import.meta.env.VITE_MOCK_PLATFORM_ENABLED}>{busy ? requirementText('application.ui.sending-code') : requirementText('navigation.next')}</Button>
      </Stack>
  </StandaloneFormPage>;
}
