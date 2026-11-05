import React from "react";
import ReactDOM from "react-dom/client";
import { resolveSiteId } from "./data/activeSite";
import { installPrototypeLibrary, resolvePrototypeLibrary, validatePrototypeEnvelope } from "./domain/prototypeLibrary";
import { prototypeCatalogData, readSharedCatalog } from './persistence/sharedCatalog';
import { mockRequest } from "./mock/client";

async function start() {
  if (import.meta.env.VITE_MOCK_PLATFORM_ENABLED) {
    const params = new URLSearchParams(window.location.search);
    // Only explicit preview links select release data; default applicant activation stays unchanged.
    const environment = params.get('environment');
    if (environment && ['uat', 'production'].includes(environment)) sessionStorage.setItem('prototypeReleaseEnvironment', environment);
    else if (params.has('site')) sessionStorage.removeItem('prototypeReleaseEnvironment');
    const sourceSite = resolveSiteId();
    const admin = window.location.pathname.startsWith('/admin-center');
    if (params.has('site')) sessionStorage.removeItem('previewBuildSite');
    if (params.has('buildSite')) sessionStorage.setItem('previewBuildSite', params.get('buildSite')!);
    const siteKey = admin ? sourceSite : params.get('buildSite') ?? sessionStorage.getItem('previewBuildSite') ?? sourceSite;
    installPrototypeLibrary(validatePrototypeEnvelope(await mockRequest('/prototype/library', { siteKey }), siteKey));
  } else {
    const catalog = await readSharedCatalog();
    installPrototypeLibrary(resolvePrototypeLibrary(prototypeCatalogData(catalog), resolveSiteId(), catalog.revision));
  }
  // Applicant modules capture their configuration at import time.
  const { default: App } = await import('./app/App');
  ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
}
void start().catch(error => {
  console.error('Prototype startup failed', error);
  document.getElementById('root')!.textContent = 'The shared prototype catalog is unavailable. Restore the catalog and reload to continue.';
});
