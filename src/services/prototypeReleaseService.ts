import { getPagePath } from '../config/pages';
import type { PageId } from '../types';
import { mockRequest } from '../mock/client';
import type { LibraryDraft } from '../domain/libraryDraft';
export type VisualCheck = { page: string; desktop: boolean; mobile: boolean; notes: string };
export type ServiceCheck = { productKey: string; approvedPaymentId?: string; declinedPaymentId?: string; referenceOnly?: boolean };
export type BuildReview = { visualChecks: VisualCheck[]; serviceChecks: ServiceCheck[]; version: number; id: string; payloadHash: string; revision: string; blockers: string[]; analyticsCount: number; reviewedAt: number };
export type PrototypeRelease = { id: string; siteKey: string; payloadHash: string; revision: string; createdAt: number };
export type LaunchEntry = { id: string; siteKey: string; snapshotId: string; revision: string; releaseKey: string; releaseName: string; releaseDate: string; status: 'Scheduled' | 'Released' | 'Cancelled' };
export type PrototypeStatus = { heads: { uat?: string; production?: string }; releases: PrototypeRelease[]; queue: LaunchEntry[]; review: BuildReview | null };
export async function savedRevision(draft: LibraryDraft) {
  if (!draft.mockTransport) throw new Error('Save the Library before reviewing or scheduling.');
  const { mockTransport, ...payload } = draft;
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return { id: mockTransport.id, expectedVersion: mockTransport.version, payloadHash: Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('') };
}
export const prototypeReleaseService = {
  status: (siteKey: string) => mockRequest<PrototypeStatus>('/builder/status', { siteKey }),
  queue: () => mockRequest<LaunchEntry[]>('/builder/queue', {}),
  review: async (draft: LibraryDraft, visualChecks: VisualCheck[], serviceChecks: ServiceCheck[]) => mockRequest<BuildReview>('/builder/review', { ...await savedRevision(draft), visualChecks, serviceChecks }),
  stage: async (draft: LibraryDraft, expectedHead: string | null) => mockRequest('/builder/stage', { ...await savedRevision(draft), expectedHead }),
  schedule: async (draft: LibraryDraft, release: { releaseKey: string; name: string; releaseDate: string }) => mockRequest('/builder/schedule', { ...await savedRevision(draft), releaseKey: release.releaseKey, releaseName: release.name, releaseDate: release.releaseDate }),
  launch: (queueId: string) => mockRequest('/builder/launch', { queueId }),
  cancel: (queueId: string) => mockRequest('/builder/cancel', { queueId }),
  rollback: (siteKey: string, releaseId: string, expectedHead: string) => mockRequest('/builder/rollback', { siteKey, releaseId, expectedHead }),
};
export function buildPreviewUrl(draft: LibraryDraft, environment?: 'uat' | 'production', page?: string) {
  const source = draft.data.sites.find(s => s.key === draft.siteKey)!;
  const alias = draft.data.sites.find(s => s.legacyClientId === source.legacyClientId && !s.id.startsWith('build-site-'))?.key ?? draft.siteKey;
  const url = new URL(page ? getPagePath(page as PageId) : '/', window.location.origin);
  url.searchParams.set('site', alias); url.searchParams.set('buildSite', draft.siteKey); url.searchParams.set('template', source.templateType);
  if (environment) url.searchParams.set('environment', environment);
  if (page) url.searchParams.set('autofill', page);
  return url.toString();
}
