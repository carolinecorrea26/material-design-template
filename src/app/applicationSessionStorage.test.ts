import { beforeEach, describe, expect, it } from "vitest";
import { applicationSessionStorage } from "./applicationSessionStorage";

describe("applicationSessionStorage", () => {
  beforeEach(() => window.sessionStorage.clear());

  it("persists and clears transient application flags behind one adapter", () => {
    expect(applicationSessionStorage.read()).toEqual({
      reviewSubmitted: false,
      advisorApplicantFlow: false,
    });

    applicationSessionStorage.writeReviewSubmitted(true);
    applicationSessionStorage.writeAdvisorApplicantFlow(true);

    expect(applicationSessionStorage.read()).toEqual({
      reviewSubmitted: true,
      advisorApplicantFlow: true,
    });

    applicationSessionStorage.clear();
    expect(applicationSessionStorage.read()).toEqual({
      reviewSubmitted: false,
      advisorApplicantFlow: false,
    });
  });
});

it('isolates flags by Site and application identity, ignoring superseded unscoped flags', () => {
  sessionStorage.clear();
  sessionStorage.setItem('reviewSubmitted', 'true');
  sessionStorage.setItem('advisorApplicantFlow', 'true');
  const a = { siteKey: 'asce', applicationId: 'one' }, b = { siteKey: 'ama', applicationId: 'one' }, c = { siteKey: 'asce', applicationId: 'two' };
  expect(applicationSessionStorage.read(a)).toEqual({ reviewSubmitted: false, advisorApplicantFlow: false });
  applicationSessionStorage.writeReviewSubmitted(true, a);
  applicationSessionStorage.writeAdvisorApplicantFlow(true, a);
  expect(applicationSessionStorage.read(a)).toEqual({ reviewSubmitted: true, advisorApplicantFlow: true });
  for (const scope of [b, c]) expect(applicationSessionStorage.read(scope)).toEqual({ reviewSubmitted: false, advisorApplicantFlow: false });
  applicationSessionStorage.clear(b);
  expect(applicationSessionStorage.read(a).reviewSubmitted).toBe(true);
});

it('keeps recovered signing locked after clearing transient progress and ignores another application’s lock', async () => {
  const { rememberSavedApplication } = await import('../services/applicantSaveService');
  const saved = { mode: 'mock' as const, applicationId: 'signing-application', siteKey: 'asce', recipient: 'member@example.invalid', revision: 'test', expiresAt: Date.now() + 100000, writeCapability: 'mock-only', requiresRevalidation: false, workflowStage: 'signing' as const, advisorFlow: true };
  rememberSavedApplication(saved);
  const scope = { siteKey: saved.siteKey, applicationId: saved.applicationId };
  applicationSessionStorage.clear(scope); // Resume clears transient progress.
  expect(applicationSessionStorage.read(scope)).toEqual({ reviewSubmitted: true, advisorApplicantFlow: true });
  rememberSavedApplication({ ...saved, applicationId: 'different-application', workflowStage: 'applicant', advisorFlow: false });
  expect(applicationSessionStorage.read({ ...scope, applicationId: 'different-application' })).toEqual({ reviewSubmitted: false, advisorApplicantFlow: false });
});
