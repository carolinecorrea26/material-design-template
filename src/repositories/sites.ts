import { getPrototypeLibrary } from '../domain/prototypeLibrary';
import { createSiteRepository } from "./siteRepository";
import { staticSiteAdapter } from "./staticSiteAdapter";
import type { Site } from "../domain/sites";
export const siteRepository = createSiteRepository(staticSiteAdapter);
// Catalog inventories support authoring/reference views. Applicant lookups below
// use the captured identity context whenever they refer to the installed host.
export const { clientEntities, tpaEntities, siteEntities, associationEntities, siteAssociationEntities, siteCoverageEntities, getClientsForTpa, getSitesForTpa, validateTpaIntegrity, getSitesForAssociation, validateAssociationIntegrity, getSiteCoverages, getSiteIdForClientAlias, getClientAliasForSite, } = siteRepository;

export function getClient(id: string) {
  const active = getPrototypeLibrary();
  return active && (id === active.clientIdentity.key || id === active.clientIdentity.id)
    ? getClientForSite(active.site.siteKey) : siteRepository.getClient(id);
}
export function getTpa(id: string) {
  const active = getPrototypeLibrary();
  return active && (active.associationContext.tpa.id === id || active.associationContext.tpaKey === id) ? structuredClone(active.associationContext.tpa) : siteRepository.getTpa(id);
}
export function getTpaForClient(id: string) {
  const active = getPrototypeLibrary();
  return active && (id === active.clientIdentity.key || id === active.clientIdentity.id)
    ? structuredClone(active.associationContext.tpa) : siteRepository.getTpaForClient(id);
}
export function getAssociation(id: string) {
  const active = getPrototypeLibrary();
  const association = active?.associationContext.allAssociations.find(row => row.id === id);
  return active ? (association ? structuredClone(association) : undefined) : siteRepository.getAssociation(id);
}
export function getAssociationsForClient(id: string) {
  const active = getPrototypeLibrary();
  return active && (id === active.clientIdentity.key || id === active.clientIdentity.id)
    ? structuredClone(active.associationContext.allAssociations) : siteRepository.getAssociationsForClient(id);
}
export function getSiteAssociations(id: string) {
  const active = getPrototypeLibrary(id);
  return active ? active.associationContext.links.filter(row => row.siteKey === active.site.siteKey)
    .map(row => ({ id: row.key, siteId: row.siteKey, associationId: row.associationKey, enabled: row.enabled })) : siteRepository.getSiteAssociations(id);
}
export function getSitesForClient(id: string): Site[] {
  const active = getPrototypeLibrary();
  return active && (id === active.clientIdentity.key || id === active.clientIdentity.id)
    ? active.associationContext.sites.map(row => ({ id: row.key, clientId: active.clientIdentity.key, name: row.name, templateType: row.templateType, status: row.status === 'active' ? 'active' : 'inactive' }))
    : siteRepository.getSitesForClient(id);
}

export function getSite(id: string): Site | undefined {
  const active = getPrototypeLibrary(id);
  if (!active) return siteRepository.getSite(id);
  const row = active.site;
  return {
    id: row.siteKey, clientId: row.clientKey, name: row.name.value,
    templateType: active.client.features?.defaultTemplate ?? 'multi', status: 'active',
    associationSelection: structuredClone(active.associationContext.selection),
    associationBranding: structuredClone(active.associationContext.branding),
  };
}
export function getClientForSite(id: string) {
  const active = getPrototypeLibrary(id);
  if (!active) return siteRepository.getClientForSite(id);
  return structuredClone({ id: active.clientIdentity.key, tpaId: active.associationContext.tpa.id, name: active.clientIdentity.name, acronym: active.clientIdentity.acronym, branding: active.client.branding, support: active.client.support, configurationDefaults: active.client });
}

export function getEffectiveSiteConfig(id: string) { return getPrototypeLibrary(id)?.client ?? siteRepository.getEffectiveSiteConfig(id); }
export function getAssociationsForSite(id: string) {
  const active = getPrototypeLibrary(id);
  return active ? structuredClone(active.associationContext.associations) : siteRepository.getAssociationsForSite(id);
}
