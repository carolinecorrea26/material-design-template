import { validatePhoneFieldBindings } from "./phoneFields";
import { buildPrototypeClient, buildPrototypeContent } from "./prototypeConfigurationProjection";
import { resolveStoredFieldSurfaces } from './fieldSurfaces';
import { resolveStoredFieldCollections } from "./fieldCollections";
import { resolvePageCatalog } from "./pageCatalog";
import { resolveEffectiveSite, type EffectiveSiteData } from './effectiveSite';
import { isLibraryDraft } from './libraryDraft';
import { buildPrototypeProduct } from "./prototypeProductProjection";
import { buildPrototypeAssociationContext } from "./prototypeAssociationProjection";
import { canonicalSiteKey } from "./siteIdentity.mjs";
import { resolveSharedFieldDefinition } from "./fieldDefinitionOwnership";
import { requirementSectionNotes, withRequirementPageFields } from "./requirementFields";

export type PrototypeLibrary = ReturnType<typeof resolvePrototypeLibrary>;
let active: PrototypeLibrary | null = null;
export function getPrototypeLibrary(siteKey?: string) { return active && (!siteKey || active.site.siteKey === canonicalSiteKey(siteKey)) ? active : null; }
export function installPrototypeLibrary(library: PrototypeLibrary | null) { active = library; }
/** Presentation adapter for the existing applicant components. All inputs come
 * from the persisted reviewed revision; no catalog imports or extraction. */
export function resolvePrototypeLibrary(data: EffectiveSiteData, siteKey: string, revision: string) {
  const pages = resolvePageCatalog(data, siteKey);
  const resolvedSite = resolveEffectiveSite(data, siteKey);
  const site = { ...resolvedSite, configuration: { ...resolvedSite.configuration, pages: resolvedSite.configuration.pages.map(page => ({ ...page, fields: withRequirementPageFields(page.key, page.fields, siteKey) })) } };
  const associationContext = buildPrototypeAssociationContext(data, siteKey);
  const fieldCollections = resolveStoredFieldCollections(data, site);
  const fieldSurfaces = resolveStoredFieldSurfaces(data, site);
  const { client, settings, clientIdentity } = buildPrototypeClient(data, site);
  const products = site.configuration.products.map(product => buildPrototypeProduct(data, site, client, product));
  const builtContent = buildPrototypeContent(data, site);
  const eligibilityNotes = requirementSectionNotes("eligibility", siteKey);
  const eligibilityContent = builtContent.pages.eligibility;
  const content = eligibilityNotes && eligibilityContent ? { ...builtContent, pages: { ...builtContent.pages, eligibility: { ...eligibilityContent, sectionNotes: eligibilityNotes } } } : builtContent;
  const identity = data.sites.find(row => row.key === siteKey);
  const sourceSiteKey = data.sites.find(row => row.legacyClientId === identity?.legacyClientId && !row.id.startsWith('build-site-'))?.key ?? siteKey;
  const fields = data.fields.map(field => resolveSharedFieldDefinition(field, data.validationRules, site.configuration.fieldDefinitionOwnership).definition);
  if (new Set(fields.map(field => field.id)).size !== fields.length) throw new Error("Duplicate field binding ID");
  validatePhoneFieldBindings(fields);
  for (const page of site.configuration.pages) {
    const included = page.fields.filter(field => field.included);
    if (new Set(included.map(field => field.definition.id)).size !== included.length) throw new Error(`Duplicate field binding ID on page: ${page.key}`);
    const scoped = new Map(fields.map(field => [field.id, field]));
    for (const field of page.fields) if (field.included) scoped.set(field.definition.id, field.definition);
    validatePhoneFieldBindings([...scoped.values()]);
  }
  return {
    fields,
    pages, pageData: { pages: data.pages, sitePages: data.sitePages }, fieldSurfaces, fieldCollections, clientIdentity, sourceSiteKey,
    site, client, products, settings, content, revision, associationContext,
  };
}
export function validatePrototypeEnvelope(value: unknown, siteKey: string) {
  const envelope = value as { mode: string; revision: string; payload: unknown };
  if (envelope?.mode !== 'mock' || typeof envelope.revision !== 'string' || !isLibraryDraft(envelope.payload) || envelope.payload.siteKey !== siteKey) throw new Error('Invalid persisted prototype Library');
  return resolvePrototypeLibrary(envelope.payload.data, siteKey, envelope.revision);
}
