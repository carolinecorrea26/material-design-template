import { normalizeSiteReferences } from '../domain/siteIdentity.mjs';
export async function mockRequest<T>(path: string, body?: unknown): Promise<T> {
  const environment = sessionStorage.getItem('prototypeReleaseEnvironment');
  if (!window.location.pathname.startsWith('/admin-center') && environment && ['/prototype/library', '/rates/quote', '/applications/submit'].includes(path) && body && typeof body === 'object') body = { ...body, environment };
  const response = await fetch(`/api/mock${path}`, { method: body === undefined ? "GET" : "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", "X-Portal-Mock": "1" }, ...(body === undefined ? {} : { body: JSON.stringify(normalizeSiteReferences(body)) }) });
  const data = normalizeSiteReferences(await response.json());
  if (!response.ok) throw new Error(data.error ?? "Mock request failed");
  return data as T;
}
export type MockAuthStatus = { signInDisabled?: boolean; mfaVerified: boolean; passwordExpired: boolean; passwordExpiresAt: number | null; sessionExpiresAt: number | null; setupNeeded: boolean; authenticated: boolean; passwordAccepted: boolean; recoveryRequired: boolean; enrollmentNeeded: boolean; username: string; displayName?: string; groupId?: string; groupIds?: string[]; canManageAccounts?: boolean; canEdit?: boolean; passkeyCount?: number; totpEnrolled?: boolean; email: string; mode: "mock" };
export type MockEnrollment = { secret: string; uri: string; qrDataUrl: string; recoveryCodes: string[] };
export type MockQuote = { mode: "mock"; quoteId: string; premiumCents: number; frequency: string; authority: string };
export type MockPayment = { mode: "mock"; paymentId: string; status: "authorized" | "declined"; amountCents: number; fundsMoved: false };

export const candidateMockRatingService: import("../domain/mockRating").MockRatingService = { quote: request => mockRequest("/rates/quote", request) };
