import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { ApplicationSessionProvider, useApplicationSession } from './ApplicationSessionContext';
import { rememberSavedApplication } from '../services/applicantSaveService';
import { applicationSessionStorage } from './applicationSessionStorage';
import { applicationLifecycle } from '../domain/applicationLifecycle.mjs';
afterEach(() => { sessionStorage.clear(); vi.unstubAllGlobals(); });
it('hydrates the shared navigation state from recovered workflow data and preserves signing locks', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  window.history.replaceState(null, '', '/resume-code?site=asce');
  const host = document.createElement('div'), root = createRoot(host); document.body.append(host);
  function Probe() { const state = useApplicationSession(); return <output>{JSON.stringify({ reviewSubmitted: state.reviewSubmitted, advisorApplicantFlow: state.advisorApplicantFlow })}</output>; }
  try {
    await act(async () => root.render(<ApplicationSessionProvider><Probe /></ApplicationSessionProvider>));
    expect(JSON.parse(host.textContent!)).toEqual({ reviewSubmitted: false, advisorApplicantFlow: false });
    await act(async () => {
      rememberSavedApplication({ mode: 'mock', siteKey: 'asce', applicationId: 'recovered-signing', recipient: 'member@example.invalid', revision: 'test', expiresAt: Date.now() + 100000, writeCapability: 'fictional-proof', requiresRevalidation: false, workflowStage: 'signing', advisorFlow: true });
      applicationSessionStorage.clear();
    });
    const { resumePage, ...expected } = applicationLifecycle('signing', true);
    expect(resumePage).toBe('docusign');
    expect(JSON.parse(host.textContent!)).toEqual(expected);
    await act(async () => rememberSavedApplication({ mode: 'mock', siteKey: 'asce', applicationId: 'another-application', recipient: 'other@example.invalid', revision: 'test', expiresAt: Date.now() + 100000, writeCapability: 'fictional-proof', requiresRevalidation: false, workflowStage: 'applicant', advisorFlow: false }));
    expect(JSON.parse(host.textContent!)).toEqual({ reviewSubmitted: false, advisorApplicantFlow: false });
  } finally { await act(async () => root.unmount()); host.remove(); }
});
