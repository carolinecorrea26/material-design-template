import products from '../../requirements/global/products.json';
import { mockRequest } from '../mock/client';
import { getPrototypeLibrary } from '../domain/prototypeLibrary';
import { isApplicationSessionExpired } from '../app/applicationTimeout';
import { applicationStateChanged, type ApplicationWorkflowStage } from '../domain/applicationLifecycle.mjs';

export type SavedApplication = {
  mode: 'mock'; applicationId: string; siteKey: string; recipient: string;
  revision: string; expiresAt: number; writeCapability: string; requiresRevalidation: boolean;
  workflowStage?: ApplicationWorkflowStage; advisorFlow?: boolean;
};
export type RecoveredApplication = SavedApplication & { values: Record<string, unknown> };
export type VerifiedApplication = RecoveredApplication & { recoveryActor: 'advisor' | 'applicant'; advisorFlow: boolean; resumePage: 'eligibility' | 'review' | 'docusign' };
export type RecoveryDetails = { applicationId: string; siteKey: string; recipient: string; recoveryId: string; token: string };
export type MfaDetails = Pick<RecoveryDetails, 'applicationId' | 'siteKey' | 'recipient'> & { sessionId: string; mfaToken: string };
export type MfaChallenge = { sessionId: string; mfaToken: string; sessionExpiresAt: number; expiresAt: number; advisorLookupEmail?: string; deliveryTarget: string; method: 'text' | 'phone' };
export type ResumeSession = MfaDetails & Omit<MfaChallenge, 'expiresAt'> & { codeExpiresAt: number; advisorFlow: boolean };
export type ResumeMessage = { id: string; kind: 'link' | 'code'; applicationId: string; recipient: string; url?: string; code?: string; expiresAt: number; method?: string };
export type ApplicationSavePage = 'membership' | 'coverage' | 'review';
export const resumeMfaParameter = products.catalog.urlParameters.find(row => row.parameter === 'mfaSessionId')!.parameter;
const previewPrefix = () => typeof window !== 'undefined' && window.location.pathname.includes('/admin-center/tutorial-preview/') ? 'tutorial-preview:' : '';
const handleKey = (siteKey: string) => `${previewPrefix()}applicantSave:${siteKey}`;

export function readSavedApplication(siteKey: string): SavedApplication | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(handleKey(siteKey)) ?? 'null') as SavedApplication | null;
    if (value?.siteKey !== siteKey || value.mode !== 'mock' || typeof value.applicationId !== 'string' || typeof value.writeCapability !== 'string') return null;
    const library = getPrototypeLibrary(siteKey);
    return { ...value, requiresRevalidation: value.requiresRevalidation || !!library && value.revision !== library.revision };
  } catch { return null; }
}
export function rememberSavedApplication(application: SavedApplication) { sessionStorage.setItem(handleKey(application.siteKey), JSON.stringify(application)); window.dispatchEvent(new Event(applicationStateChanged)); }
export function forgetSavedApplication(siteKey: string) { sessionStorage.removeItem(handleKey(siteKey)); window.dispatchEvent(new Event(applicationStateChanged)); }
export const resumeSessionStorageKey = (siteKey: string) => `${previewPrefix()}resumeMfa:${siteKey}`;
export function forgetResumeSession(siteKey: string) { sessionStorage.removeItem(resumeSessionStorageKey(siteKey)); }
const advisorLookupKey = (siteKey: string) => `${previewPrefix()}advisorRecoveryLookup:${siteKey}`;
export function readAdvisorRecoveryLookup(siteKey: string) { return sessionStorage.getItem(advisorLookupKey(siteKey)) ?? ''; }
export function forgetAdvisorRecoveryLookup(siteKey: string) { sessionStorage.removeItem(advisorLookupKey(siteKey)); }
export function rememberResumeSession(session: ResumeSession) {
  sessionStorage.setItem(resumeSessionStorageKey(session.siteKey), JSON.stringify(session));
  if (session.advisorLookupEmail) sessionStorage.setItem(advisorLookupKey(session.siteKey), session.advisorLookupEmail);
}
export function resumeSessionFromSearch(search: URLSearchParams, siteKey: string): ResumeSession | null {
  try {
    const session = JSON.parse(sessionStorage.getItem(resumeSessionStorageKey(siteKey)) ?? 'null') as ResumeSession | null;
    return session && search.get('site') === siteKey && search.get(resumeMfaParameter) === session.sessionId && session.siteKey === siteKey && session.applicationId && session.recipient && session.mfaToken && Number.isFinite(session.sessionExpiresAt) && Number.isFinite(session.codeExpiresAt) && ['text', 'phone'].includes(session.method) ? session : null;
  } catch { return null; }
}
export function resumeSessionForChallenge(details: Pick<RecoveryDetails, 'applicationId' | 'siteKey' | 'recipient'>, challenge: MfaChallenge, advisorFlow: boolean): ResumeSession {
  const { expiresAt, ...session } = challenge;
  return { applicationId: details.applicationId, siteKey: details.siteKey, recipient: details.recipient, ...session, codeExpiresAt: expiresAt, advisorFlow };
}
export function mfaDetails(session: ResumeSession): MfaDetails {
  const { applicationId, siteKey, recipient, sessionId, mfaToken } = session;
  return { applicationId, siteKey, recipient, sessionId, mfaToken };
}
export function resumeEntryQuery(siteKey: string, advisorFlow: boolean) {
  return new URLSearchParams({ site: siteKey, ...(advisorFlow ? { flow: 'advisor' } : {}) });
}
export function resumeSessionQuery(session: ResumeSession) {
  return new URLSearchParams({ site: session.siteKey, [resumeMfaParameter]: session.sessionId, ...(session.advisorFlow ? { flow: 'advisor' } : {}) });
}

/** Only successful Membership submission may create a saved application; later writes are serialized. */
export function createApplicantSaveClient(siteKey: string) {
  let queue: Promise<unknown> = Promise.resolve();
  let generation = 0;
  return {
    cancelPending() { generation += 1; },
    save(values: Record<string, unknown>, submittedPage?: ApplicationSavePage): Promise<SavedApplication | null> {
      const snapshot = structuredClone(values);
      const capturedGeneration = generation;
      const task = queue.catch(() => {}).then(async () => {
        if (capturedGeneration !== generation) return null;
        if (isApplicationSessionExpired(siteKey)) {
          window.dispatchEvent(new Event('application:session-expired'));
          throw new Error('Your session has expired. Resume your application to continue.');
        }
        const library = getPrototypeLibrary(siteKey);
        if (!import.meta.env.VITE_MOCK_PLATFORM_ENABLED || !library || !snapshot.email) return null;
        const existing = readSavedApplication(siteKey);
        if (!existing && submittedPage !== 'membership') return null;
        // Membership starts saving; only Coverage/Review completion clears revalidation.
        const validatedPage = submittedPage === 'coverage' || submittedPage === 'review' ? submittedPage : undefined;
        const environment = sessionStorage.getItem('prototypeReleaseEnvironment') ?? undefined;
        const application = await mockRequest<SavedApplication>('/applicant/save', {
          siteKey, recipient: String(snapshot.email).trim().toLowerCase(), revision: library.revision, values: snapshot, validatedPage, environment,
          ...(existing ? { applicationId: existing.applicationId, writeCapability: existing.writeCapability } : {}),
        });
        if (capturedGeneration !== generation) return null;
        rememberSavedApplication(application);
        return application;
      });
      queue = task;
      return task;
    },
  };
}
export function recoveryFromSearch(search: URLSearchParams, siteKey: string): RecoveryDetails | null {
  const details = { siteKey, applicationId: search.get('applicationId') ?? '', recipient: search.get('recipient') ?? '', recoveryId: search.get('recoveryId') ?? '', token: search.get('token') ?? '' };
  return search.get('site') === siteKey && Object.values(details).every(Boolean) ? details : null;
}
export const applicantRecovery = {
  request: (applicationId: string, siteKey: string, recipient: string, flow?: 'advisor', advisor?: { applicantEmail: string; phone: string }) => mockRequest<{ expiresAt: number }>('/applicant/resume/request', { applicationId, siteKey, recipient, ...(flow ? { flow } : {}), ...(advisor ? { advisor } : {}) }),
  challenge: (details: RecoveryDetails | MfaDetails, method: string) => mockRequest<MfaChallenge>('/applicant/resume/challenge', { ...details, method }),
  verify: async (details: MfaDetails, code: string): Promise<VerifiedApplication> => {
    const application = await mockRequest<VerifiedApplication>('/applicant/resume/verify', { ...details, code });
    if (application.applicationId !== details.applicationId || application.siteKey !== details.siteKey || !['advisor', 'applicant'].includes(application.recoveryActor) || typeof application.advisorFlow !== 'boolean' || !['eligibility', 'review', 'docusign'].includes(application.resumePage) || application.recoveryActor === 'advisor' && (application.advisorFlow || application.resumePage !== 'eligibility')) throw new Error('Invalid recovery result');
    return application;
  },
  outbox: (applicationId: string, siteKey: string, recipient: string) => mockRequest<{ messages: ResumeMessage[] }>('/applicant/outbox', { applicationId, siteKey, recipient }),
};

/** Local workflow simulation only; never production signing evidence or real delivery. */
export async function advanceApplicationWorkflow(siteKey: string, event: 'send-to-applicant' | 'request-edit' | 'start-signing' | 'complete-signing') {
  const saved = readSavedApplication(siteKey);
  if (!import.meta.env.VITE_MOCK_PLATFORM_ENABLED || !saved) return;
  const result = await mockRequest<{ stage: ApplicationWorkflowStage }>('/applicant/workflow', { applicationId: saved.applicationId, siteKey, recipient: saved.recipient, writeCapability: saved.writeCapability, event });
  rememberSavedApplication({ ...saved, workflowStage: result.stage });
}
