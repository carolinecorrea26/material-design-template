import StandaloneFormPage from "../components/layout/StandaloneFormPage";
import { isAdvisorReviewQuery } from '../config/reviewExperience';
import { resumeFailure, resumeFailureMessage, resumePageIssue, type ResumePageIssue } from '../domain/resumeFeedback';
import { requirementText } from "../domain/requirementContent";
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import FieldRenderer from '../components/forms/FieldRenderer';
import { getPageFieldDefinition } from '../config/fields/resolvedFieldRegistry';
import { Button, CircularProgress, Stack } from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { getPagePath, getPageTitle, getPageSubhead } from '../config/pages';
import { resolveSiteId } from '../data/activeSite';
import { applicantRecovery, forgetAdvisorRecoveryLookup, resumeSessionFromSearch, resumeMfaParameter, rememberResumeSession, forgetResumeSession, mfaDetails, resumeSessionQuery, resumeSessionForChallenge, resumeEntryQuery, type ResumeSession } from '../services/applicantSaveService';
import { useApplicationForm } from '../app/ApplicationFormContext';
import { useApplicationSession } from '../app/ApplicationSessionContext';
import ApplicantMockOutbox from '../components/demo/ApplicantMockOutbox';
import useDeadline from '../hooks/useDeadline';
import useResumeMfaDeadline from '../hooks/useResumeMfaDeadline';
import ResumeSessionWarning from '../components/feedback/ResumeSessionWarning';
import ExpiringCodeAlert from '../components/feedback/ExpiringCodeAlert';
import ResendCountdownRow from '../components/feedback/ResendCountdownRow';
import prototypeDefaults from '../../requirements/global/prototype-fixtures/application.json';

export default function ResumeCode() {
  const navigate = useNavigate();
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const [search] = useSearchParams();
  const siteKey = resolveSiteId();
  const [verifiedSession, setVerifiedSession] = useState<ResumeSession | null>(null);
  const session = resumeSessionFromSearch(search, siteKey) ?? verifiedSession;
  const details = session ? mfaDetails(session) : null;
  const { restoreApplication } = useApplicationForm();
  const { resetApplicationSession, setAdvisorApplicantFlow } = useApplicationSession();
  const field = getPageFieldDefinition('resume-code', siteKey, 'resume-security-code');
  const form = useForm<Record<string, string | boolean | string[]>>({ defaultValues: { [field.id]: '' } });
  const code = String(form.watch(field.id) ?? '');
  const [error, setError] = useState('');
  const [terminalIssue, setTerminalIssue] = useState<ResumePageIssue | null>(null);
  const [busy, setBusy] = useState(false);
  const [returnPage, setReturnPage] = useState<'eligibility' | 'review' | 'docusign'>('eligibility');
  const [success, setSuccess] = useState(false);
  const [resent, setResent] = useState(false);
  const remaining = useResumeMfaDeadline(session, !success);
  const codeSeconds = useDeadline(session?.codeExpiresAt);
  const [codeExpired, setCodeExpired] = useState(false);
  const secondsLeft = codeExpired ? 0 : codeSeconds ?? 0;
  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => navigate(`${getPagePath(returnPage)}?site=${encodeURIComponent(siteKey)}`, { replace: true, state: { resumeLoaded: true } }), prototypeDefaults.resumeTransitionMs);
    return () => window.clearTimeout(timer);
  }, [success, navigate, siteKey, returnPage]);
  function failure(reason: unknown) {
    const kind = resumeFailure(reason);
    const issue = resumePageIssue(reason, session?.recipient);
    if (issue) { setTerminalIssue(issue); forgetResumeSession(siteKey); }
    else { if (kind === 'code-expired') setCodeExpired(true); setError(kind === 'code-expired' ? '' : resumeFailureMessage(reason)); }
  }

  async function resend() {
    if (!details || !session || remaining === 0 || busy || success || !import.meta.env.VITE_MOCK_PLATFORM_ENABLED) return;
    setBusy(true); setError('');
    try {
      const challenge = await applicantRecovery.challenge(details, session.method);
      if (!mounted.current) return;
      if (!resumeSessionFromSearch(search, siteKey) || challenge.sessionExpiresAt <= Date.now()) throw Object.assign(new Error('MFA expired'), { code: 'RESUME_MFA_EXPIRED' });
      rememberResumeSession(resumeSessionForChallenge(details, challenge, session.advisorFlow));
      setCodeExpired(false);
      form.setValue(field.id, ''); setResent(true);
    } catch (reason) { failure(reason); }
    finally { setBusy(false); }
  }
  async function verify() {
    if (!details || !session || remaining === 0 || !restoreApplication || busy || success || secondsLeft === 0 || !import.meta.env.VITE_MOCK_PLATFORM_ENABLED) return;

    setBusy(true); setError('');
    try {
      const application = await applicantRecovery.verify(details, code.trim());
      if (!mounted.current) return;
      if (!resumeSessionFromSearch(search, siteKey) || session.sessionExpiresAt <= Date.now()) throw Object.assign(new Error('MFA expired'), { code: 'RESUME_MFA_EXPIRED' });
      restoreApplication(application); forgetAdvisorRecoveryLookup(siteKey); resetApplicationSession(); setAdvisorApplicantFlow?.(application.advisorFlow); setReturnPage(application.resumePage); setVerifiedSession(session); forgetResumeSession(siteKey); setSuccess(true);
    } catch (reason) { failure(reason); }
    finally { setBusy(false); }
  }
  const unavailable = !details || !import.meta.env.VITE_MOCK_PLATFORM_ENABLED;
  const subhead = session?.deliveryTarget ? <>{requirementText('application.ui.please-enter-the-verification-code-sent-to-the-phone-number')}<strong>{session.deliveryTarget}</strong>{'.'}</> : getPageSubhead('resume-code');
  if (terminalIssue) return <Navigate replace to={`${getPagePath(terminalIssue.kind === 'mfa-expired' ? 'session-expired' : 'resume')}?${resumeEntryQuery(siteKey, session?.advisorFlow ?? isAdvisorReviewQuery(search))}`} state={terminalIssue.kind === 'mfa-expired' ? undefined : { resumeIssue: terminalIssue }} />;
  if (!details || !session) return <Navigate replace to={`${getPagePath(search.has(resumeMfaParameter) ? 'session-expired' : 'resume')}?${resumeEntryQuery(siteKey, session?.advisorFlow ?? isAdvisorReviewQuery(search))}`} state={{ resumeIssue: { kind: search.has(resumeMfaParameter) ? 'mfa-expired' : 'link' } }} />;
  return <StandaloneFormPage title={getPageTitle('resume-code')} subhead={subhead} onBack={() => navigate(`${getPagePath('resume-method')}?${resumeSessionQuery(session)}`)}>

      {!success && <ResumeSessionWarning secondsLeft={remaining} />}
      <Stack component="form" spacing={2} onSubmit={form.handleSubmit(() => void verify())} noValidate sx={{ py: 1 }}>
        <ExpiringCodeAlert secondsLeft={secondsLeft} kind="code" disabled={busy || success || !details || !import.meta.env.VITE_MOCK_PLATFORM_ENABLED} onResend={() => void resend()} showConfirmation={resent} confirmationMessage={requirementText("application.ui.a-new-verification-code-has-been-sent")} />
        <FieldRenderer field={{ ...field, disabled: field.disabled || busy || success || secondsLeft === 0 }} control={form.control} errors={error ? { ...form.formState.errors, [field.id]: { type: 'manual', message: error } } : form.formState.errors} onValueChange={() => { setError(''); setResent(false); }} />
        <ResendCountdownRow secondsLeft={secondsLeft} kind="code" disabled={busy || success || unavailable} onResend={() => void resend()} />
        <Button type="submit" fullWidth size="large" variant="contained" disabled={busy || success || unavailable || secondsLeft === 0} sx={{ mt: '24px !important', ...(success ? { '&.Mui-disabled': { bgcolor: 'success.main', color: 'common.white' } } : {}) }}>
          {success ? <CheckRoundedIcon aria-label={requirementText("application.ui.verified-successfully")} /> : busy ? <CircularProgress size={24} color="inherit" aria-label={requirementText("application.ui.verifying-code")} /> : requirementText("navigation.next")}
        </Button>
        {details && <ApplicantMockOutbox applicationId={details.applicationId} siteKey={siteKey} recipient={details.recipient} />}
      </Stack>
  </StandaloneFormPage>;
}
