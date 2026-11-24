import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Alert, CssBaseline, ThemeProvider } from '@mui/material';
import { MemoryRouter, useSearchParams } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import ApplicationPageExample from './ApplicationPageExample';
import { createAppTheme } from '../../app/theme';
import { getPrototypeLibrary } from '../../domain/prototypeLibrary';
import { applicationPageComponents as pageComponents } from '../../app/pageComponents';
import { getPagePath } from '../../config/pages';
import { generateFormDataUpToPage } from '../utils/generateFormData';
import { ApplicationSessionContext } from '../../app/ApplicationSessionContext';
import { getResumePolicy } from '../../config/resumePolicy';
import { applicantRecovery, resumeMfaParameter, rememberResumeSession, resumeSessionQuery, resumeSessionStorageKey } from '../../services/applicantSaveService';
import Resume from '../../pages/Resume';
import { getMockEmailSamples } from '../../utils/mockEmail';
import accessFixture from '../../../requirements/global/prototype-fixtures/tutorial-access.json';
import advisor from '../../../requirements/global/prototype-fixtures/advisor.json';
import { tutorials } from '../../domain/tutorials';
import type { PageId } from '../../types';
import { canUpdateApplicantAdminExample, readApplicantAdminAnswers, saveApplicantAdminAnswers } from '../../domain/applicantAdminDemo';

const params = new URLSearchParams(window.location.search);
const step = tutorials[0].steps[params.get('step') ?? ''];
const requestedPage = params.get('page') as PageId | null;
const pageId = requestedPage ?? step?.preview?.pageId ?? 'advisor-login';
const mode = params.get('mode') ?? step?.preview?.mode ?? '';
const actor = params.get('actor') ?? 'Applicant';
const record = params.get('record');

function PreviewPage() {
  const library = getPrototypeLibrary()!;
  const recipient = useMemo(() => getMockEmailSamples(library.site.siteKey).find(item => item.type === 'advisor-sent-to-applicant')!.toEmail, [library]);
  const [search, setSearch] = useSearchParams();
  const [ready, setReady] = useState(!['delivery-method', 'verify-code'].includes(mode));
  useLayoutEffect(() => {
    if (!['delivery-method', 'verify-code'].includes(mode)) return;
    const query = new URLSearchParams({ site: library.site.siteKey });
    const storageKey = resumeSessionStorageKey(library.site.siteKey);
    if (mode === 'verify-code') {
      const policy = getResumePolicy();
      const session = { applicationId: accessFixture.applicationId, siteKey: library.site.siteKey, recipient: actor === 'Advisor' ? advisor.email : recipient, sessionId: 'tutorial-example', mfaToken: 'fictional-preview-proof', sessionExpiresAt: Date.now() + policy.mfaValiditySeconds * 1000, codeExpiresAt: Date.now() + policy.codeValiditySeconds * 1000, method: 'text' as const, deliveryTarget: `(•••)•••${accessFixture.phoneSuffix}`, advisorFlow: actor === 'Applicant' };
      rememberResumeSession(session); setSearch(resumeSessionQuery(session), { replace: true });
    } else {
      query.set('applicationId', accessFixture.applicationId); query.set('recipient', actor === 'Advisor' ? advisor.email : recipient); query.set('recoveryId', 'tutorial-example'); query.set('token', 'fictional-preview-proof'); setSearch(query, { replace: true });
    }
    setReady(true);
    return () => sessionStorage.removeItem(storageKey);
    // One isolated document owns its demonstration proof and clears it on unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const clear = () => sessionStorage.removeItem(resumeSessionStorageKey(library.site.siteKey));
    window.addEventListener('pagehide', clear); return () => window.removeEventListener('pagehide', clear);
  }, [library.site.siteKey]);
  if (!ready || mode === 'verify-code' && !search.has(resumeMfaParameter) || mode === 'delivery-method' && !search.has('token')) return null;
  if (mode === 'open-link') return <Resume initialConfirmation={{ recipient: actor === 'Advisor' ? advisor.email : recipient, secondsLeft: getResumePolicy().linkValiditySeconds }} />;
  const Page = pageComponents[pageId];
  return Page ? <Page /> : <Alert severity="info">This page is not available for preview.</Alert>;
}

function PreviewApp() {
  const library = getPrototypeLibrary()!;
  const scenario = useMemo(() => {
    const messages = getMockEmailSamples(library.site.siteKey);
    const values = { ...generateFormDataUpToPage(['membership','eligibility','coverage','beneficiary','contact','profile','review','payment','receipt'].includes(pageId) ? pageId : 'review'), 'advisor-email': advisor.email,
      'advisor-flow-type': mode === 'continue' || actor === 'Advisor' && pageId === 'resume' ? 'saved' : actor === 'Advisor' ? 'new' : '',
      'applicant-email': messages.find(item => item.type === 'advisor-sent-to-applicant')!.toEmail,
      email: messages.find(item => item.type === 'advisor-sent-to-applicant')!.toEmail,
      ...(record ? readApplicantAdminAnswers(record) : {}),
    };
    return { capability: 'standard' as const, estimatedRates: true, description: 'Interactive Site preview with fictional answers.', values };
  }, [library]);
  useLayoutEffect(() => {
    const previous = { ...applicantRecovery };
    const policy = getResumePolicy();
    applicantRecovery.request = async () => ({ expiresAt: Date.now() + policy.linkValiditySeconds * 1000 });
    applicantRecovery.challenge = async (_details, method) => ({ sessionId: 'tutorial-example', mfaToken: 'fictional-preview-proof', sessionExpiresAt: Date.now() + policy.mfaValiditySeconds * 1000, expiresAt: Date.now() + policy.codeValiditySeconds * 1000, method: method === 'phone' ? 'phone' : 'text', deliveryTarget: `(•••)•••${accessFixture.phoneSuffix}` });
    applicantRecovery.verify = async (_details, code) => {
      if (code !== accessFixture.verificationCode) throw new Error('Use the example code shown above the preview.');
      return { mode: 'mock', applicationId: accessFixture.applicationId, siteKey: library.site.siteKey, recipient: String(scenario.values.email), revision: library.revision, expiresAt: Date.now() + policy.retentionDays * 86400000, requiresRevalidation: false, writeCapability: 'fictional-preview-proof', recoveryActor: actor === 'Advisor' ? 'advisor' : 'applicant', advisorFlow: actor === 'Applicant', resumePage: actor === 'Advisor' ? 'eligibility' : 'review', values: scenario.values };
    };
    return () => { Object.assign(applicantRecovery, previous); };
  }, [library, scenario]);
  const allowedRecord = record && canUpdateApplicantAdminExample(record);
  return <LocalizationProvider dateAdapter={AdapterDayjs}><ThemeProvider theme={createAppTheme(library.client.theme)}><CssBaseline />
    <MemoryRouter initialEntries={[`${getPagePath(pageId)}?site=${library.site.siteKey}${actor === 'Applicant' && pageId === 'review' ? '&flow=advisor' : ''}`]}>
      <ApplicationPageExample library={library} scenario={scenario} onSave={allowedRecord ? values => {
        saveApplicantAdminAnswers(record!, values);
        window.parent.postMessage({ type: 'applicant-demo-saved', record, pageId }, window.location.origin);
      } : undefined}>
        <ApplicationSessionContext.Provider value={{ reviewSubmitted: false, advisorApplicantFlow: actor === 'Applicant', markReviewSubmitted: () => {}, setAdvisorApplicantFlow: () => {}, resetApplicationSession: () => {} }}>{mode === 'verify-code' && <Alert severity="info">Example verification code: {accessFixture.verificationCode}</Alert>}<PreviewPage /></ApplicationSessionContext.Provider>
      </ApplicationPageExample>
    </MemoryRouter>
  </ThemeProvider></LocalizationProvider>;
}
export function renderTutorialPreview() { createRoot(document.getElementById('root')!).render(<PreviewApp />); }
