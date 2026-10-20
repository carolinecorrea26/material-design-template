import { mockRequest } from '../mock/client';
import { getPrototypeLibrary } from '../domain/prototypeLibrary';

export type SavedApplication = {
  mode: 'mock'; applicationId: string; siteKey: string; recipient: string;
  revision: string; expiresAt: number; writeCapability: string; requiresRevalidation: boolean;
};
export type RecoveredApplication = SavedApplication & { values: Record<string, unknown> };
export type RecoveryDetails = { applicationId: string; siteKey: string; recipient: string; recoveryId: string; token: string };
export type ResumeMessage = { id: string; kind: 'link' | 'code'; applicationId: string; recipient: string; url?: string; code?: string; expiresAt: number; method?: string };
const handleKey = (siteKey: string) => `applicantSave:${siteKey}`;

export function readSavedApplication(siteKey: string): SavedApplication | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(handleKey(siteKey)) ?? 'null') as SavedApplication | null;
    if (value?.siteKey !== siteKey || value.mode !== 'mock' || typeof value.applicationId !== 'string' || typeof value.writeCapability !== 'string') return null;
    const library = getPrototypeLibrary(siteKey);
    return { ...value, requiresRevalidation: value.requiresRevalidation || !!library && value.revision !== library.revision };
  } catch { return null; }
}
export function rememberSavedApplication(application: SavedApplication) { sessionStorage.setItem(handleKey(application.siteKey), JSON.stringify(application)); }
export function forgetSavedApplication(siteKey: string) { sessionStorage.removeItem(handleKey(siteKey)); }

/** Serial saves prevent initial autosave and Next creating two households. */
export function createApplicantSaveClient(siteKey: string) {
  let queue: Promise<unknown> = Promise.resolve();
  let generation = 0;
  return {
    cancelPending() { generation += 1; },
    save(values: Record<string, unknown>, validatedPage?: 'coverage' | 'review'): Promise<SavedApplication | null> {
      const snapshot = structuredClone(values);
      const capturedGeneration = generation;
      const task = queue.catch(() => {}).then(async () => {
        if (capturedGeneration !== generation) return null;
        const library = getPrototypeLibrary(siteKey);
        if (!import.meta.env.VITE_MOCK_PLATFORM_ENABLED || !library || !snapshot.email) return null;
        const existing = readSavedApplication(siteKey);
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
  request: (applicationId: string, siteKey: string, recipient: string) => mockRequest<{ expiresAt: number; applicationId: string }>('/applicant/resume/request', { applicationId, siteKey, recipient }),
  challenge: (details: RecoveryDetails, method: string) => mockRequest<{ expiresAt: number; deliveryTarget?: string }>('/applicant/resume/challenge', { ...details, method }),
  verify: (details: RecoveryDetails, code: string) => mockRequest<RecoveredApplication>('/applicant/resume/verify', { ...details, code }),
  outbox: (applicationId: string, siteKey: string, recipient: string) => mockRequest<{ messages: ResumeMessage[] }>('/applicant/outbox', { applicationId, siteKey, recipient }),
};
