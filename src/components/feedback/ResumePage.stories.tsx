import { getResumePolicy } from '../../config/resumePolicy';
import { useLayoutEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useSearchParams } from 'react-router-dom';
import Resume from '../../pages/Resume';
import ResumeMethod from '../../pages/ResumeMethod';
import ResumeCode from '../../pages/ResumeCode';
import { ApplicationSessionContext } from '../../app/ApplicationSessionContext';
import ApplicationPageExample, { type ApplicationPageScenario } from '../../../.storybook/applicationPageExample';
import { getPrototypeLibrary } from '../../domain/prototypeLibrary';
import { readSharedCatalog, type SharedCatalog } from '../../persistence/sharedCatalog';
import { rememberResumeSession, resumeSessionQuery, resumeSessionStorageKey, type ResumeSession } from '../../services/applicantSaveService';
import type { ResumePageIssue } from '../../domain/resumeFeedback';

type State = 'advisor' | 'email' | 'sent' | 'sent-expired' | 'link-expired' | 'link-limit' | 'code-limit' | 'attempts-locked' | 'method' | 'phone' | 'expired' | 'warning';
const scenario: ApplicationPageScenario = { capability: 'standard', description: 'Recovery pages with explicit fictional context; no delivery or authentication service.', values: {} };
function RecoveryPage({ state }: { state: State }) {
  const [search, setSearch] = useSearchParams();
  const [expectedSearch, setExpectedSearch] = useState<string | null>(null);
  const [initialError, setInitialError] = useState<ResumePageIssue>();
  useLayoutEffect(() => {
    if (expectedSearch !== null) return;
    const siteKey = getPrototypeLibrary()!.site.siteKey;
    const storageKey = resumeSessionStorageKey(siteKey), previous = sessionStorage.getItem(storageKey);
    const policy = getResumePolicy(), query = new URLSearchParams({ site: siteKey });
    if (['phone', 'expired', 'warning'].includes(state)) {
      const sessionDeadline = Date.now() + (state === 'warning' ? policy.mfaWarningSeconds : policy.mfaValiditySeconds) * 1000;
      const session: ResumeSession = { siteKey, applicationId: 'example-saved-application', recipient: 'returning.user@example.com', sessionId: 'example-mfa', mfaToken: 'fictional-review-proof', sessionExpiresAt: sessionDeadline, codeExpiresAt: state === 'expired' ? 1 : Math.min(Date.now() + policy.codeValiditySeconds * 1000, sessionDeadline), deliveryTarget: '(•••)•••1234', method: 'text', advisorFlow: false };
      rememberResumeSession(session);
      setSearch(resumeSessionQuery(session), { replace: true });
      setExpectedSearch(resumeSessionQuery(session).toString());
    } else {
      if (state === 'method') {
        query.set('applicationId', 'example-saved-application'); query.set('recipient', 'returning.user@example.com');
        query.set('recoveryId', 'example-recovery'); query.set('token', 'fictional-link-proof');
      }
      if (['link-expired', 'link-limit', 'code-limit', 'attempts-locked'].includes(state)) {
        const kind = state === 'link-expired' ? 'link' : state as ResumePageIssue['kind'];
        const seconds = state === 'link-limit' ? policy.requestCooldownSeconds : ['code-limit', 'attempts-locked'].includes(state) ? state === 'code-limit' ? policy.codeIssueCooldownSeconds : policy.codeAttemptLockSeconds : undefined;
        setInitialError({ kind, ...(seconds ? { retryAt: Date.now() + seconds * 1000 } : {}) });
      }
      setSearch(query, { replace: true }); setExpectedSearch(query.toString());
    }
    return () => { if (previous === null) sessionStorage.removeItem(storageKey); else sessionStorage.setItem(storageKey, previous); };
    // Each keyed whole-page example initializes and cleans up its own temporary context once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (expectedSearch === null || search.toString() !== expectedSearch) return null;
  if (state === 'sent' || state === 'sent-expired') return <Resume initialConfirmation={{ recipient: 'returning.user@example.com', secondsLeft: state === 'sent-expired' ? 0 : getResumePolicy().linkValiditySeconds }} />;
  if (state === 'method') return <ResumeMethod />;
  if (['phone', 'expired', 'warning'].includes(state)) return <ResumeCode />;
  return <Resume initialError={initialError} />;
}
const meta = {
  id: 'pages-resume-whole-page', title: 'Components/Pages/Resume/Whole page',
  render: ({ state }: { state: State }, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={state === 'advisor' ? { ...scenario, values: { 'advisor-flow-type': 'saved', 'applicant-email': 'returning.user@example.com' } } : scenario}><ApplicationSessionContext.Provider value={{ reviewSubmitted: false, advisorApplicantFlow: false, markReviewSubmitted: () => {}, setAdvisorApplicantFlow: () => {}, resetApplicationSession: () => {} }}><RecoveryPage state={state} /></ApplicationSessionContext.Provider></ApplicationPageExample>,
  loaders: [async () => ({ catalog: await readSharedCatalog() })],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: 'Actual Resume controllers use fresh-start fields, feedback and confirmed production policy. Email link, fixed MFA session, phone code, cooldown and lock are distinct states; examples perform no delivery or authentication.' } },
    catalog: { pages: { EmailRequest: 'resume', ExpiredMagicLink: 'resume', DeliveryMethod: 'resume-method', PhoneCode: 'resume-code' } },
    review: { scope: 'page-composition', focus: 'Review private confirmation, phone-only verification, independent fixed session/code deadlines, warning and distinct terminal page errors.', references: [{ label: 'Shared expiry and resend controls', storyId: 'feedback-resume-expiration--active-link' }] },
  },
} satisfies Meta<{ state: State }>;
export default meta;
const example = (state: State, description: string): StoryObj<typeof meta> => ({ args: { state }, parameters: { docs: { description: { story: description } } } });
export const EmailRequest = example('email', 'Email entry uses the canonical required/email checks and optional session prefill.');
export const DeliveryMethod = example('method', 'Text and Call to the saved phone. Only explicit Next consumes a valid email link and starts MFA.');
export const PhoneCode = example('phone', 'Six-digit phone code and masked target; code and MFA deadlines come from the same global policy.');
export const ExpiredCode = example('expired', 'Code expiry stays inline with resend available in an active MFA session; it does not create an expiry page.');
export const MfaSessionWarning = example('warning', 'Two-minute fixed MFA warning without a session-extension action. Zero opens the shared Session expired page; link/code expiry stays inline.');
export const ExpiredMagicLink = example('link-expired', 'Invalid, expired or used link returns to the initial email request page with the configured inline error.');
export const LinkRequestConfirmation = example('sent', 'Uniform confirmation for matching, absent, expired and recovery-locked applications.');
export const LinkConfirmationExpired = example('sent-expired', 'Expired link confirmation retains shared explicit resend controls.');
export const LinkRequestLimit = example('link-limit', 'Identical request-limit feedback for matching and unmatched emails, with fixed ten-minute cooldown.');
export const CodeRequestLimit = example('code-limit', 'Application-shared phone-code request budget; fixed thirty-minute resend cooldown.');
export const PhoneAttemptLock = example('attempts-locked', 'Third incorrect current code locks application recovery for thirty minutes across browsers and links.');

export const AdvisorIdentity = example('advisor', 'Continue identifies the applicant first; this shared Resume form then collects the advisor’s own email and phone using canonical required identity fields.');
