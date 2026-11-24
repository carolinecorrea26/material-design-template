export const portalDatabaseEnabled = import.meta.env.VITE_PORTAL_DATABASE_ENABLED === 'true' && !import.meta.env.VITE_STANDALONE_HTML;
// The Library's existing autofill links are detached page inspections.
export const portalPageInspection = portalDatabaseEnabled && typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('autofill');

export async function portalRequest<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api/portal${path}`, {
    credentials: 'same-origin',
    ...(body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || result === null && path !== '/session') {
    throw Object.assign(new Error(result?.error ?? 'Portal database request failed.'), { status: response.status, code: result?.code, retryAt: result?.retryAt });
  }
  return result as T;
}

export type PortalUser = { id: string; email: string; displayName: string; roleKey: 'portal-admin' | 'account-manager'; siteKeys: string[] };
export type PortalSite = { id: string; key: string; name: string; templateType: 'single' | 'multi'; organizationId: string; organizationName: string; hostingAssociationId?: string; associationName: string; migrationStage: string | null; migrationStatus: string };

export const readPortalSites = () => portalRequest<PortalSite[]>('/sites');
