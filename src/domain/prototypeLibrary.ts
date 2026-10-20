import { buildPrototypeClient, buildPrototypeContent } from "./prototypeConfigurationProjection";
import { resolveStoredFieldSurfaces } from './fieldSurfaces';
import { resolveStoredFieldCollections } from "./fieldCollections";
import { resolvePageCatalog } from "./pageCatalog";
import { resolveEffectiveSite, type EffectiveSiteData } from './effectiveSite';
import { isLibraryDraft } from './libraryDraft';
import { buildPrototypeProduct } from "./prototypeProductProjection";
import { buildPrototypeAssociationContext } from "./prototypeAssociationProjection";
import { canonicalSiteKey } from "./siteIdentity.mjs";

export type PrototypeLibrary = ReturnType<typeof resolvePrototypeLibrary>;
let active: PrototypeLibrary | null = null;
export function getPrototypeLibrary(siteKey?: string) { return active && (!siteKey || active.site.siteKey === canonicalSiteKey(siteKey)) ? active : null; }
export function installPrototypeLibrary(library: PrototypeLibrary | null) { active = library; }
/** Presentation adapter for the existing applicant components. All inputs come
 * from the persisted reviewed revision; no catalog imports or extraction. */
export function resolvePrototypeLibrary(data: EffectiveSiteData, siteKey: string, revision: string) {
  const pages = resolvePageCatalog(data, siteKey);
  const site = resolveEffectiveSite(data, siteKey);
  const associationContext = buildPrototypeAssociationContext(data, siteKey);
  const fieldCollections = resolveStoredFieldCollections(data, site);
  const fieldSurfaces = resolveStoredFieldSurfaces(data, site);
  const { client, settings, clientIdentity } = buildPrototypeClient(data, site);
  const products = site.configuration.products.map(product => buildPrototypeProduct(data, site, client, product));
  const content = buildPrototypeContent(data, site);
  const identity = data.sites.find(row => row.key === siteKey);
  const sourceSiteKey = data.sites.find(row => row.legacyClientId === identity?.legacyClientId && !row.id.startsWith('build-site-'))?.key ?? siteKey;
  return {
    pages, fieldSurfaces, fieldCollections, clientIdentity, sourceSiteKey,
    site, client, products, settings, content, revision, associationContext,
  };
}
export function validatePrototypeEnvelope(value: unknown, siteKey: string) {
  const envelope = value as { mode: string; revision: string; payload: unknown };
  if (envelope?.mode !== 'mock' || typeof envelope.revision !== 'string' || !isLibraryDraft(envelope.payload) || envelope.payload.siteKey !== siteKey) throw new Error('Invalid persisted prototype Library');
  return resolvePrototypeLibrary(envelope.payload.data, siteKey, envelope.revision);
}
