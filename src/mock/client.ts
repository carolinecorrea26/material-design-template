import { normalizeSiteReferences } from '../domain/siteIdentity.mjs';
import { recoveryIncident, type RecoveryOperation } from '../domain/recoveryIncident';
export async function mockRequest<T>(path: string, body?: unknown): Promise<T> {
  const environment = sessionStorage.getItem('prototypeReleaseEnvironment');
  if (!window.location.pathname.startsWith('/admin-center') && environment && ['/prototype/library', '/rates/quote', '/applications/submit'].includes(path) && body && typeof body === 'object') body = { ...body, environment };
  const applicantRequest = ['/applicant/save', '/rates/quote', '/applications/submit', '/payments/authorize'].includes(path) && !window.location.pathname.startsWith('/admin-center');
  const reportTechnicalFailure = () => {
    const operation: RecoveryOperation = path === '/payments/authorize' ? 'payment' : path === '/applications/submit' ? 'submission' : path === '/applicant/save' ? 'save' : 'rating';
    const financialOperation = operation === 'payment' || operation === 'submission';
    window.dispatchEvent(new CustomEvent('application:technical-error', { detail: recoveryIncident({
      code: 'TECHNICAL_ERROR', operation, outcome: financialOperation ? 'unknown' : 'failed',
    }) }));
  };
  let response: Response;
  let data;
  try {
    response = await fetch(`/api/mock${path}`, { method: body === undefined ? "GET" : "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", "X-Portal-Mock": "1" }, ...(body === undefined ? {} : { body: JSON.stringify(normalizeSiteReferences(body)) }) });
    data = normalizeSiteReferences(await response.json());
  } catch (error) {
    if (applicantRequest) reportTechnicalFailure();
    throw error;
  }
  if (applicantRequest && (response.status === 401 || response.status === 419 || response.status === 440)) window.dispatchEvent(new Event('application:session-expired'));
  else if (applicantRequest && response.status >= 500) reportTechnicalFailure();
  if (!response.ok) throw new Error(data.error ?? "Mock request failed");
  return data as T;
}
export type MockAuthStatus = { signInDisabled?: boolean; mfaVerified: boolean; passwordExpired: boolean; passwordExpiresAt: number | null; sessionExpiresAt: number | null; setupNeeded: boolean; authenticated: boolean; passwordAccepted: boolean; recoveryRequired: boolean; enrollmentNeeded: boolean; username: string; displayName?: string; groupId?: string; groupIds?: string[]; canManageAccounts?: boolean; canEdit?: boolean; passkeyCount?: number; totpEnrolled?: boolean; email: string; mode: "mock" };
export type MockEnrollment = { secret: string; uri: string; qrDataUrl: string; recoveryCodes: string[] };
export type MockQuote = { mode: "mock"; quoteId: string; premiumCents: number; frequency: string; authority: string };
export type MockPayment = { mode: "mock"; paymentId: string; status: "authorized" | "declined"; amountCents: number; fundsMoved: false };

export const candidateMockRatingService: import("../domain/mockRating").MockRatingService = { quote: request => mockRequest("/rates/quote", request) };
