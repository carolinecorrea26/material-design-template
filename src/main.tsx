import { freshStartSource, withFreshStartCatalog } from './domain/freshStartCatalog';
import { compileApplicationSiteIdentities } from './domain/requirementApplicationCatalog.mjs';
import React from "react";
import ReactDOM from "react-dom/client";
import { resolveSiteId } from "./data/activeSite";
import { installPrototypeLibrary, resolveCompiledPrototypeLibrary, validatePrototypeEnvelope } from "./domain/prototypeLibrary";
import { prototypeCatalogData, PublishedCatalogMismatchError, readSharedCatalog } from './persistence/sharedCatalog';
import { mockRequest } from "./mock/client";
import { portalDatabaseEnabled, portalPageInspection } from './services/portalClient';
import { openPortalDraft, resolvePortalDraft } from './services/portalDrafts';

async function start() {
  const catalog = await readSharedCatalog();
  const data = prototypeCatalogData(catalog);
  const identities = compileApplicationSiteIdentities(data, freshStartSource(), undefined, catalog.siteScope);
  const sourceSite = resolveSiteId(identities.sites.filter(site => site.status === 'active' && !site.deletedAt).map(site => site.key));
  const params = new URLSearchParams(window.location.search);
  const draftId = portalDatabaseEnabled ? params.get('portalDraft') : null;
  if (draftId) {
    try {
      if (params.get('site') !== sourceSite) throw new Error('Choose the Site associated with this draft.');
      installPrototypeLibrary(resolvePortalDraft(catalog, sourceSite, await openPortalDraft(draftId)));
    } catch (error) {
      document.getElementById('root')!.textContent = `Draft preview unavailable. ${error instanceof Error ? error.message : ''}`;
      return;
    }
  } else if (!portalDatabaseEnabled && import.meta.env.VITE_MOCK_PLATFORM_ENABLED) {
    // Only explicit preview links select release data; default applicant activation stays unchanged.
    const environment = params.get('environment');
    if (environment && ['uat', 'production'].includes(environment)) sessionStorage.setItem('prototypeReleaseEnvironment', environment);
    else if (params.has('site')) sessionStorage.removeItem('prototypeReleaseEnvironment');
    const admin = window.location.pathname.startsWith('/admin-center');
    if (params.has('site')) sessionStorage.removeItem('previewBuildSite');
    if (params.has('buildSite')) sessionStorage.setItem('previewBuildSite', params.get('buildSite')!);
    const siteKey = admin ? sourceSite : params.get('buildSite') ?? sessionStorage.getItem('previewBuildSite') ?? sourceSite;
    installPrototypeLibrary(validatePrototypeEnvelope(await mockRequest('/prototype/library', { siteKey }), siteKey));
  } else {
    const compiled = withFreshStartCatalog(data, undefined, catalog.siteScope);
    installPrototypeLibrary(resolveCompiledPrototypeLibrary(compiled, sourceSite, catalog.revision));
  }
  if (window.location.pathname.includes('/admin-center/tutorial-preview/')) {
    const { renderTutorialPreview } = await import('./dev/preview/TutorialPreviewApp');
    renderTutorialPreview();
    return;
  }
  const { normalizeInitialCoverageEntry } = await import('./app/coverageEntryNavigation');
  const invalidEntry = normalizeInitialCoverageEntry(new URL(window.location.href), import.meta.env.BASE_URL, !!import.meta.env.VITE_STANDALONE_HTML);
  if (invalidEntry) window.history.replaceState(window.history.state, '', invalidEntry);
  // Applicant modules capture their configuration at import time.
  const { default: App } = await import('./app/App');
  const previewNotice = draftId ? 'Site Builder draft preview. Submissions are disabled.'
    : portalPageInspection ? 'Library page preview. Submissions are disabled.' : null;
  ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode>
    {previewNotice && <p role="status" style={{ margin: 0, padding: '0.5rem', textAlign: 'center', background: '#e9f3ff' }}>{previewNotice}</p>}
    <App />
  </React.StrictMode>);
}
void start().catch(error => {
  console.error('Portal startup failed', error);
  document.getElementById('root')!.textContent = error instanceof PublishedCatalogMismatchError
    ? error.message
    : 'The shared catalog is unavailable. Restore the catalog and reload to continue.';
});
