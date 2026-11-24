import { afterEach, expect, it, vi } from 'vitest';
import { applicantRecovery, createApplicantSaveClient, readAdvisorRecoveryLookup, forgetAdvisorRecoveryLookup, readSavedApplication, rememberSavedApplication, recoveryFromSearch, rememberResumeSession, resumeSessionFromSearch, resumeSessionQuery, forgetResumeSession, mfaDetails } from './applicantSaveService';
import { mockRequest } from '../mock/client';

vi.mock('../mock/client', () => ({ mockRequest: vi.fn() }));
vi.mock('../domain/prototypeLibrary', () => ({ getPrototypeLibrary: () => ({ revision: 'revision-2' }) }));
afterEach(() => { sessionStorage.clear(); vi.unstubAllEnvs(); vi.mocked(mockRequest).mockReset(); });
const saved = { mode: 'mock' as const, applicationId: 'household-1', siteKey: 'asce', recipient: 'member@example.invalid', revision: 'revision-2', expiresAt: Date.now() + 10000, writeCapability: 'write-1', requiresRevalidation: false };

it('marks a remembered household from an earlier Library revision for revalidation without changing the stored record', () => {
  rememberSavedApplication({ ...saved, revision: 'revision-1' });
  expect(readSavedApplication(saved.siteKey)).toMatchObject({ revision: 'revision-1', requiresRevalidation: true });
  expect(readSavedApplication('ama')).toBeNull();
  expect(JSON.parse(sessionStorage.getItem(`applicantSave:${saved.siteKey}`)!)).toMatchObject({ revision: 'revision-1', requiresRevalidation: false });
});

it('does not create a saved application from an email, an ordinary save or another page submission', async () => {
  vi.stubEnv('VITE_MOCK_PLATFORM_ENABLED', 'true');
  const client = createApplicantSaveClient(saved.siteKey);
  for (const page of [undefined, 'coverage', 'review'] as const) {
    expect(await client.save({ email: saved.recipient, 'first-name': 'Avery' }, page)).toBeNull();
  }
  expect(mockRequest).not.toHaveBeenCalled();
  expect(readSavedApplication(saved.siteKey)).toBeNull();
});

it('serializes Membership submission and subsequent saves into one household', async () => {
  vi.stubEnv('VITE_MOCK_PLATFORM_ENABLED', 'true');
  vi.mocked(mockRequest).mockResolvedValue(saved);
  const client = createApplicantSaveClient(saved.siteKey);
  await Promise.all([client.save({ email: saved.recipient, plan: 'first' }, 'membership'), client.save({ email: saved.recipient, plan: 'second' })]);
  expect(vi.mocked(mockRequest).mock.calls[0][1]).not.toHaveProperty('applicationId');
  expect(vi.mocked(mockRequest).mock.calls[0][1]).toMatchObject({ validatedPage: undefined });
  expect(vi.mocked(mockRequest).mock.calls[1][1]).toMatchObject({ applicationId: saved.applicationId, writeCapability: saved.writeCapability, values: { plan: 'second' } });
  expect(readSavedApplication('other-site')).toBeNull();
});

it('does not revive a cleared household when an in-flight save completes', async () => {
  vi.stubEnv('VITE_MOCK_PLATFORM_ENABLED', 'true');
  let finish!: (value: typeof saved) => void;
  vi.mocked(mockRequest).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const client = createApplicantSaveClient(saved.siteKey);
  const pending = client.save({ email: saved.recipient }, 'membership');
  await vi.waitFor(() => expect(finish).toBeTypeOf('function'));
  client.cancelPending(); finish(saved);
  expect(await pending).toBeNull();
  expect(readSavedApplication(saved.siteKey)).toBeNull();
});

it('does not start autosave after a failed Membership save and permits a successful retry', async () => {
  vi.stubEnv('VITE_MOCK_PLATFORM_ENABLED', 'true');
  const client = createApplicantSaveClient(saved.siteKey);
  vi.mocked(mockRequest).mockRejectedValueOnce(new Error('Save unavailable'));
  await expect(client.save({ email: saved.recipient }, 'membership')).rejects.toThrow('Save unavailable');
  expect(readSavedApplication(saved.siteKey)).toBeNull();
  expect(await client.save({ email: saved.recipient })).toBeNull();
  expect(mockRequest).toHaveBeenCalledTimes(1);
  vi.mocked(mockRequest).mockResolvedValue(saved);
  await expect(client.save({ email: saved.recipient }, 'membership')).resolves.toEqual(saved);
  await client.save({ email: saved.recipient }, 'coverage');
  expect(vi.mocked(mockRequest).mock.calls[2][1]).toMatchObject({ applicationId: saved.applicationId, validatedPage: 'coverage' });
});

it('requires an explicit matching Site and every recovery parameter', () => {
  const search = new URLSearchParams({ site: saved.siteKey, applicationId: saved.applicationId, recipient: saved.recipient, recoveryId: 'recovery', token: 'token' });
  expect(recoveryFromSearch(search, saved.siteKey)).not.toBeNull();
  expect(recoveryFromSearch(search, 'other-site')).toBeNull();
  search.delete('token'); expect(recoveryFromSearch(search, saved.siteKey)).toBeNull();
});


it('keeps MFA proof separate from application answers and code URLs across reload', () => {
  const session = { applicationId: saved.applicationId, siteKey: saved.siteKey, recipient: saved.recipient, sessionId: 'mfa-1', mfaToken: 'private-mfa-proof', sessionExpiresAt: Date.now() + 1800000, codeExpiresAt: Date.now() + 600000, method: 'text' as const, deliveryTarget: '(•••)•••1234', advisorFlow: true };
  rememberResumeSession(session);
  const query = resumeSessionQuery(session);
  expect(query.toString()).not.toContain(session.mfaToken);
  expect(query.has('token')).toBe(false);
  expect(query.has('recipient')).toBe(false);
  expect(resumeSessionFromSearch(query, saved.siteKey)).toEqual(session);
  expect(resumeSessionFromSearch(query, 'other-site')).toBeNull();
  query.set('mfaSessionId', 'other-session'); expect(resumeSessionFromSearch(query, saved.siteKey)).toBeNull();
  expect(mfaDetails(session)).toEqual({ applicationId: saved.applicationId, siteKey: saved.siteKey, recipient: saved.recipient, sessionId: 'mfa-1', mfaToken: session.mfaToken });
  forgetResumeSession(saved.siteKey); expect(resumeSessionFromSearch(resumeSessionQuery(session), saved.siteKey)).toBeNull();
});

it('keeps the advisor lookup context through MFA expiry without storing it in applicant answers', () => {
  const session = { ...saved, sessionId: 'advisor-mfa', mfaToken: 'proof', sessionExpiresAt: Date.now() + 1800000, codeExpiresAt: Date.now() + 600000, method: 'text' as const, deliveryTarget: '(•••)•••0987', advisorFlow: false, advisorLookupEmail: saved.recipient };
  rememberResumeSession(session); forgetResumeSession(saved.siteKey);
  expect(readAdvisorRecoveryLookup(saved.siteKey)).toBe(saved.recipient);
  expect(readAdvisorRecoveryLookup('different-site')).toBe('');
  forgetAdvisorRecoveryLookup(saved.siteKey); expect(readAdvisorRecoveryLookup(saved.siteKey)).toBe('');
});
it('rejects recovery responses with missing destination/actor or a mismatched application', async () => {
  const details = { applicationId: saved.applicationId, siteKey: saved.siteKey, recipient: saved.recipient, sessionId: 'session', mfaToken: 'proof' };
  for (const result of [saved, { ...saved, resumePage: 'review', advisorFlow: true, recoveryActor: 'advisor' }, { ...saved, applicationId: 'other', resumePage: 'review', advisorFlow: true, recoveryActor: 'applicant' }]) {
    vi.mocked(mockRequest).mockResolvedValue(result);
    await expect(applicantRecovery.verify(details, '123456')).rejects.toThrow('Invalid recovery result');
  }
});

it('persists successful workflow transitions for recovery and navigation consumers', async () => {
  const { advanceApplicationWorkflow } = await import('./applicantSaveService');
  vi.stubEnv('VITE_MOCK_PLATFORM_ENABLED', 'true');
  rememberSavedApplication(saved);
  vi.mocked(mockRequest).mockResolvedValue({ stage: 'signing' });
  await advanceApplicationWorkflow(saved.siteKey, 'start-signing');
  expect(readSavedApplication(saved.siteKey)?.workflowStage).toBe('signing');
});
