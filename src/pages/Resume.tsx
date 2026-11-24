import StandaloneFormPage from "../components/layout/StandaloneFormPage";
import { isAdvisorReviewQuery } from '../config/reviewExperience';
import { getResumePolicy } from '../config/resumePolicy';
import { resumeFailureMessage, resumePageIssue, resumeIssueMessage, type ResumePageIssue } from '../domain/resumeFeedback';
import useDeadline from '../hooks/useDeadline';
import { useApplicationForm } from '../app/ApplicationFormContext';
import { requirementText } from "../domain/requirementContent";
import { useEffect, useState, type FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import FieldRenderer from '../components/forms/FieldRenderer';
import { getPageFieldDefinition } from '../config/fields/resolvedFieldRegistry';
import { Button, CircularProgress, Stack, Typography } from '@mui/material';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { getPagePath, getPageSubhead, getPageTitle } from '../config/pages';
import { resolveSiteId } from '../data/activeSite';
import { applicantRecovery, readAdvisorRecoveryLookup, readSavedApplication, recoveryFromSearch, forgetResumeSession, resumeEntryQuery } from '../services/applicantSaveService';
import ApplicantMockOutbox from '../components/demo/ApplicantMockOutbox';
import useCountdown from '../hooks/useCountdown';
import ExpiringCodeAlert from '../components/feedback/ExpiringCodeAlert';
import PageAlert from '../components/feedback/PageAlert';
import ResendCountdownRow from '../components/feedback/ResendCountdownRow';


/** Explicit preview inputs do not perform lookup or delivery. */
export default function Resume({ initialError, initialConfirmation }: { initialError?: ResumePageIssue; initialConfirmation?: { recipient: string; secondsLeft: number } }) {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const siteKey = resolveSiteId();
  const location = useLocation();
  const { values } = useApplicationForm();
  const [saved] = useState(() => readSavedApplication(siteKey));
  const advisorLookup = values?.['advisor-flow-type'] === 'saved' && typeof values['applicant-email'] === 'string' ? values['applicant-email'] : isAdvisorReviewQuery(search) ? '' : readAdvisorRecoveryLookup(siteKey);
  const phoneField = advisorLookup ? getPageFieldDefinition('resume', siteKey, 'resume-phone') : null;
  const field = getPageFieldDefinition('resume', siteKey, 'resume-email');
  const incomingIssue = initialError ?? (location.state as { resumeIssue?: ResumePageIssue } | null)?.resumeIssue;
  const form = useForm<Record<string, string | boolean | string[]>>({ defaultValues: { [field.id]: incomingIssue?.recipient ?? (initialConfirmation ? initialConfirmation.recipient : advisorLookup ? '' : saved?.recipient ?? '') } });
  const recipient = String(form.watch(field.id) ?? '');
  const [error, setError] = useState('');
  const [issue, setIssue] = useState<ResumePageIssue | undefined>(incomingIssue);
  const cooldown = useDeadline(issue?.retryAt);
  const blocked = cooldown !== null && cooldown > 0 && (!issue?.recipient || issue.recipient.trim().toLowerCase() === recipient.trim().toLowerCase());
  const visibleIssue = issue && (issue.retryAt === undefined || blocked) ? issue : undefined;
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<{ applicationId: string; recipient: string } | null>(initialConfirmation ? { applicationId: '', recipient: initialConfirmation.recipient } : null);
  const { secondsLeft, start, restart } = useCountdown(initialConfirmation?.secondsLeft ?? getResumePolicy().linkValiditySeconds);
  useEffect(() => { if (initialConfirmation) start(); }, [initialConfirmation, start]);
  useEffect(() => { if (issue?.kind === 'mfa-expired') forgetResumeSession(siteKey); }, [issue?.kind, siteKey]);
  async function request(event?: FormEvent) {
    event?.preventDefault();
    if (busy || blocked) return;

    setError(''); setIssue(undefined); setBusy(true);
    try {
      if (!import.meta.env.VITE_MOCK_PLATFORM_ENABLED) throw new Error(requirementText("application.ui.application-recovery-is-unavailable-please-try-again-later"));
      const hint = search.get('applicationId') ?? (saved?.recipient === recipient.trim().toLowerCase() ? saved.applicationId : '');
      const result = advisorLookup ? await applicantRecovery.request('', siteKey, recipient.trim(), undefined, { applicantEmail: advisorLookup, phone: String(form.getValues('resume-phone') ?? '') }) : isAdvisorReviewQuery(search) ? await applicantRecovery.request(hint, siteKey, recipient.trim(), 'advisor') : await applicantRecovery.request(hint, siteKey, recipient.trim());
      restart(Math.max(0, Math.ceil((result.expiresAt - Date.now()) / 1000)));
      setSent({ applicationId: saved?.recipient === recipient.trim().toLowerCase() ? saved.applicationId : '', recipient: recipient.trim().toLowerCase() });
    } catch (reason) {
      const pageIssue = resumePageIssue(reason, recipient);
      if (pageIssue) { setIssue(pageIssue); setSent(null); } else setError(resumeFailureMessage(reason));
    }
    finally { setBusy(false); }
  }
  if (!visibleIssue && isAdvisorReviewQuery(search) && recoveryFromSearch(search, siteKey)) return <Navigate replace to={`${getPagePath('resume-method')}?${search}`} />;
  if (issue?.kind === 'mfa-expired') return <Navigate replace to={`${getPagePath('session-expired')}?${resumeEntryQuery(siteKey, isAdvisorReviewQuery(search))}`} />;
  return <StandaloneFormPage title={getPageTitle('resume')} subhead={getPageSubhead('resume')} onBack={() => navigate(-1)}>

      {visibleIssue && <PageAlert severity="error" message={resumeIssueMessage(visibleIssue, cooldown)} />}
      <Stack component="form" spacing={3} onSubmit={form.handleSubmit(() => void request())} noValidate sx={{ py: 1 }}>
        {sent ? <>
          <ExpiringCodeAlert secondsLeft={secondsLeft} kind="link" disabled={busy} onResend={() => void request()}>{requirementText("application.ui.a-secure-link-has-been-sent-to")}<strong>{sent.recipient}</strong>{requirementText("application.ui.open-your-email-and-click-the-link-to-continue")}</ExpiringCodeAlert>
          <ResendCountdownRow secondsLeft={secondsLeft} kind="link" disabled={busy} onResend={() => void request()} />
          {sent.applicationId && <ApplicantMockOutbox applicationId={sent.applicationId} siteKey={siteKey} recipient={sent.recipient} />}
        </> : <>
          {advisorLookup && <Typography variant="body2">{requirementText("resume.advisor.identity")}</Typography>}
          <FieldRenderer field={{ ...field, ...(values?.['advisor-flow-type'] === 'saved' ? { autoComplete: 'off' } : {}), disabled: field.disabled || busy }} control={form.control} errors={error ? { ...form.formState.errors, [field.id]: { type: 'manual', message: error } } : form.formState.errors} onValueChange={() => setError('')} />
          {phoneField && <FieldRenderer field={{ ...phoneField, disabled: busy }} control={form.control} errors={form.formState.errors} onValueChange={() => setError('')} />}
        </>}
        {sent && <PageAlert message={error} />}
        {(!sent || busy) && <Button fullWidth size="large" type="submit" variant="contained" disabled={busy || blocked}>{busy ? <CircularProgress size={24} color="inherit" aria-label={requirementText("application.ui.sending-secure-link")} /> : requirementText("navigation.next")}</Button>}
      </Stack>
  </StandaloneFormPage>;
}
