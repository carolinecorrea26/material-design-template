import type { DatabaseSchema } from '../persistence/types';
import { validatePhoneFieldBindings } from "./phoneFields";
import { buildPrototypeClient, buildPrototypeContent } from "./prototypeConfigurationProjection";
import { resolveStoredFieldCollections } from "./fieldCollections";
import { resolvePageCatalog } from "./pageCatalog";
import { resolveCompiledEffectiveSite, type EffectiveSite, type EffectiveSiteData } from './effectiveSite';
import { isLibraryDraft } from './libraryDraft';
import { buildPrototypeProduct } from "./prototypeProductProjection";
import { buildPrototypeAssociationContext } from "./prototypeAssociationProjection";
import { canonicalSiteKey } from "./siteIdentity.mjs";
import { resolveSharedFieldDefinition } from "./fieldDefinitionOwnership";
import { withFreshStartCatalog, freshStartSource } from "./freshStartCatalog";
import { installFieldDefinitions } from './fields';
import { compileRequirementCatalog, type RequirementCatalogSource } from './requirementCatalog.mjs';

export type PrototypeLibrary = ReturnType<typeof resolvePrototypeLibrary>;
let active: PrototypeLibrary | null = null;
const catalogSources = new WeakMap<object, { data: EffectiveSiteData; requirements?: RequirementCatalogSource; related: Map<string, PrototypeLibrary> }>();
export function getPrototypeLibrary(siteKey?: string) { return active && (!siteKey || active.site.siteKey === canonicalSiteKey(siteKey)) ? active : null; }
/** Cross-Site inspection resolves the same captured source without installing it
 * or borrowing the open prototype's Site-specific decisions. */
export function getRelatedPrototypeLibrary(siteKey: string): PrototypeLibrary | null {
  if (!active) return null;
  if (active.site.siteKey === canonicalSiteKey(siteKey)) return active;
  const source = catalogSources.get(active);
  if (!source || !Object.hasOwn((source.requirements ?? freshStartSource()).fields.sites, canonicalSiteKey(siteKey))) return null;
  if (!source?.data.sites.some(site => site.key === canonicalSiteKey(siteKey) && !site.deletedAt && site.status === 'active')) return null;
  if (!source.related.has(siteKey)) source.related.set(siteKey, resolvePrototypeLibrary(source.data, siteKey, active.revision, source.requirements));
  return source.related.get(siteKey)!;
}
export function installPrototypeLibrary(library: PrototypeLibrary | null) { active = library; installFieldDefinitions(library?.fields ?? null); }
/** Presentation adapter for the existing applicant components. All inputs come
 * from the persisted reviewed revision; no catalog imports or extraction. */
export function resolvePrototypeLibrary(data: EffectiveSiteData, siteKey: string, revision: string, requirements?: RequirementCatalogSource) {
  const projected = requirements ? compileRequirementCatalog(data, requirements, siteKey) : withFreshStartCatalog(data, siteKey);
  return resolveCompiledPrototypeLibrary(projected, siteKey, revision, requirements);
}

/** All consumers of a compiled requirements revision project that same value. */
export function resolveCompiledPrototypeLibrary(data: EffectiveSiteData & Pick<DatabaseSchema, 'components'>, siteKey: string, revision: string, requirements?: RequirementCatalogSource) {
  const site = resolveCompiledEffectiveSite(data, siteKey);
  return projectPrototypeLibrary(data, site, revision, requirements);
}

/** Shared presentation projection. The caller supplies a resolved, validated
 * Site; the application entry points above always compile fresh-start source. */
export function projectPrototypeLibrary(data: EffectiveSiteData & Pick<DatabaseSchema, 'components'>, site: EffectiveSite, revision: string, requirements?: RequirementCatalogSource) {
  const siteKey = site.siteKey;
  const pages = resolvePageCatalog(data, siteKey);
  const associationContext = buildPrototypeAssociationContext(data, siteKey);
  const fieldCollections = resolveStoredFieldCollections(data, site);
  const fieldSurfaces = site.fieldSurfaces;
  if (!fieldSurfaces) throw new Error("Missing effective field surfaces");
  const { client, settings, clientIdentity } = buildPrototypeClient(data, site);
  const products = site.configuration.products.map(product => buildPrototypeProduct(data, site, client, product));
  const content = buildPrototypeContent(data, site);
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
  const library = {
    fields, components: data.components,
    pages, pageData: { pages: data.pages, sitePages: data.sitePages }, fieldSurfaces, fieldCollections, clientIdentity, sourceSiteKey,
    site, client, products, settings, content, revision, associationContext,
  };
  catalogSources.set(library, { data, requirements, related: new Map() });
  return library;
}
export function validatePrototypeEnvelope(value: unknown, siteKey: string) {
  const envelope = value as { mode: string; revision: string; payload: unknown };
  if (envelope?.mode !== 'mock' || typeof envelope.revision !== 'string' || !isLibraryDraft(envelope.payload) || envelope.payload.siteKey !== siteKey) throw new Error('Invalid persisted prototype Library');
  return resolvePrototypeLibrary(envelope.payload.data, siteKey, envelope.revision);
}
