import { canonicalSiteKey } from '../domain/siteIdentity.mjs';
import { mergeConfiguration } from "./compatibility";
import type { ClientConfig } from "../config/clients/types";
import type { ClientId } from "../types";
import type { Association, AssociationId, Client, Site, SiteAssociation, SiteCoverage, SiteId, Tpa, TpaId } from "../data/model";

export interface SiteSnapshot {
  clientEntities: Client[];
  tpaEntities: Tpa[];
  siteEntities: Site[];
  associationEntities: Association[];
  siteAssociationEntities: SiteAssociation[];
  siteCoverageEntities: SiteCoverage[];
  aliases: [ClientId, SiteId][];
}
export interface SiteReadAdapter { read(): SiteSnapshot }

/** Synchronous compatibility repository. No normalized rule becomes executable here. */
export function createSiteRepository(adapter: SiteReadAdapter) {
  const { clientEntities, tpaEntities, siteEntities, associationEntities, siteAssociationEntities, siteCoverageEntities, aliases } = adapter.read();
  const siteIdByClientAlias = new Map(aliases);
  const clientAliasBySiteId = new Map(aliases.map(([alias, siteId]) => [siteId, alias]));
  function resolveEntityConfiguration(site: Site): ClientConfig {
    const client = clientEntities.find((entry) => entry.id === site.clientId);
    if (!client) throw new Error(`Unknown client id: ${site.clientId}`);
    return {
      id: getClientAliasForSite(site.id),
      branding: mergeConfiguration(client.branding, site.brandingOverride),
      support: mergeConfiguration(client.support, site.supportOverride),
      ...mergeConfiguration(client.configurationDefaults, site.configurationOverrides),
    };
  }

  const clientsById = new Map(clientEntities.map((client) => [client.id, client]));
  const tpasById = new Map(tpaEntities.map((tpa) => [tpa.id, tpa]));
  const sitesById = new Map(siteEntities.map((site) => [site.id, site]));
  const associationsById = new Map(
    associationEntities.map((association) => [association.id, association]),
  );

  function getClient(clientId: string): Client | undefined {
    return clientsById.get(clientId);
  }

  function getTpa(tpaId: TpaId): Tpa | undefined {
    return tpasById.get(tpaId);
  }

  function getTpaForClient(clientId: string): Tpa | undefined {
    const client = getClient(clientId);
    return client ? getTpa(client.tpaId) : undefined;
  }

  function getClientsForTpa(
    tpaId: TpaId,
    clients: Client[] = clientEntities,
  ): Client[] {
    return clients.filter((client) => client.tpaId === tpaId);
  }

  function getSitesForTpa(tpaId: TpaId): Site[] {
    const clientIds = new Set(getClientsForTpa(tpaId).map((client) => client.id));
    return siteEntities.filter((site) => clientIds.has(site.clientId));
  }

  function validateTpaIntegrity(): string[] {
    const errors: string[] = [];
    for (const client of clientEntities) {
      if (!tpasById.has(client.tpaId)) {
        errors.push(`Client ${client.id} references unknown TPA ${client.tpaId}`);
      }
    }
    return errors;
  }

  function getSite(siteId: string): Site | undefined {
    return sitesById.get(canonicalSiteKey(siteId));
  }

  function getAssociation(associationId: string): Association | undefined {
    return associationsById.get(associationId);
  }

  function getAssociationsForClient(clientId: string): Association[] {
    return associationEntities.filter((association) => association.clientId === clientId);
  }

  function getSiteAssociations(siteId: SiteId): SiteAssociation[] {
    return siteAssociationEntities.filter((relationship) => relationship.siteId === canonicalSiteKey(siteId));
  }

  function getAssociationsForSite(siteId: SiteId): Association[] {
    return getSiteAssociations(siteId)
      .filter((relationship) => relationship.enabled)
      .map((relationship) => getAssociation(relationship.associationId))
      .filter((association): association is Association => Boolean(association));
  }

  function getSitesForAssociation(associationId: AssociationId): Site[] {
    const siteIds = new Set(
      siteAssociationEntities
        .filter(
          (relationship) =>
            relationship.enabled && relationship.associationId === associationId,
        )
        .map((relationship) => relationship.siteId),
    );
    return siteEntities.filter((site) => siteIds.has(site.id));
  }

  function validateAssociationIntegrity(): string[] {
    const errors: string[] = [];
    for (const association of associationEntities) {
      if (!clientsById.has(association.clientId)) {
        errors.push(`Association ${association.id} references unknown client ${association.clientId}`);
      }
    }
    for (const relationship of siteAssociationEntities) {
      const site = sitesById.get(relationship.siteId);
      const association = associationsById.get(relationship.associationId);
      if (!site) errors.push(`SiteAssociation ${relationship.id} references unknown site ${relationship.siteId}`);
      if (!association) errors.push(`SiteAssociation ${relationship.id} references unknown association ${relationship.associationId}`);
      if (site && association && site.clientId !== association.clientId) {
        errors.push(`SiteAssociation ${relationship.id} crosses clients ${site.clientId} and ${association.clientId}`);
      }
    }
    return errors;
  }

  function getSitesForClient(clientId: string): Site[] {
    return siteEntities.filter((site) => site.clientId === clientId);
  }

  function getSiteCoverages(siteId: SiteId): SiteCoverage[] {
    return siteCoverageEntities.filter((relationship) => relationship.siteId === canonicalSiteKey(siteId));
  }

  function getClientForSite(siteId: string): Client | undefined {
    const site = getSite(siteId);
    return site ? getClient(site.clientId) : undefined;
  }

  /** Read-only compatibility for inbound `?client=` URLs and old stored records. */
  function getSiteIdForClientAlias(clientId: ClientId): SiteId {
    return siteIdByClientAlias.get(clientId) ?? "demo";
  }

  /** Public asset folders and old persisted records still use these aliases. */
  function getClientAliasForSite(siteId: SiteId): ClientId {
    return clientAliasBySiteId.get(canonicalSiteKey(siteId)) ?? "demo";
  }

  /**
   * Compatibility projection for consumers that have not yet been split into a
   * domain-specific resolver. The data is resolved from canonical Client and
   * Site entities; the legacy registry is not consulted.
   */
  function getEffectiveSiteConfig(siteId: SiteId): ClientConfig {
    const site = getSite(siteId);
    if (!site) throw new Error(`Unknown site id: ${siteId}`);
    return resolveEntityConfiguration(site);
  }

  return { clientEntities, tpaEntities, siteEntities, associationEntities, siteAssociationEntities, siteCoverageEntities, getClient, getTpa, getTpaForClient, getClientsForTpa, getSitesForTpa, validateTpaIntegrity, getSite, getAssociation, getAssociationsForClient, getSiteAssociations, getAssociationsForSite, getSitesForAssociation, validateAssociationIntegrity, getSitesForClient, getSiteCoverages, getClientForSite, getSiteIdForClientAlias, getClientAliasForSite, getEffectiveSiteConfig };
}
