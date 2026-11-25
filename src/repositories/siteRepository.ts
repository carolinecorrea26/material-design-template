import { canonicalSiteKey } from '../domain/siteIdentity.mjs';
import { mergeConfiguration } from "./compatibility";
import type { ClientConfig } from "../config/clients/types";
import type { ClientId } from "../types";
import type { Association, AssociationId, HostingAssociation, Site, SiteAssociation, SiteCoverage, SiteId, Tpa, TpaId } from "../data/model";

export interface SiteSnapshot {
  hostingAssociations: HostingAssociation[];
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
  const { hostingAssociations, tpaEntities, siteEntities, associationEntities, siteAssociationEntities, siteCoverageEntities, aliases } = adapter.read();
  const siteIdByClientAlias = new Map(aliases);
  const clientAliasBySiteId = new Map(aliases.map(([alias, siteId]) => [siteId, alias]));
  function resolveEntityConfiguration(site: Site): ClientConfig {
    const client = hostingAssociations.find((entry) => entry.id === site.hostingAssociationId);
    if (!client) throw new Error(`Unknown client id: ${site.hostingAssociationId}`);
    return {
      id: getClientAliasForSite(site.id),
      branding: mergeConfiguration(client.branding, site.brandingOverride),
      support: mergeConfiguration(client.support, site.supportOverride),
      ...mergeConfiguration(client.configurationDefaults, site.configurationOverrides),
    };
  }

  const clientsById = new Map(hostingAssociations.map((client) => [client.id, client]));
  const tpasById = new Map(tpaEntities.map((tpa) => [tpa.id, tpa]));
  const sitesById = new Map(siteEntities.map((site) => [site.id, site]));
  const associationsById = new Map(
    associationEntities.map((association) => [association.id, association]),
  );

  function getHostingAssociation(hostingAssociationId: string): HostingAssociation | undefined {
    return clientsById.get(hostingAssociationId);
  }

  function getTpa(tpaId: TpaId): Tpa | undefined {
    return tpasById.get(tpaId);
  }

  function getTpaForAssociation(hostingAssociationId: string): Tpa | undefined {
    const client = getHostingAssociation(hostingAssociationId);
    return client ? getTpa(client.tpaId) : undefined;
  }

  function getHostingAssociationsForTpa(
    tpaId: TpaId,
    associations: HostingAssociation[] = hostingAssociations,
  ): HostingAssociation[] {
    return associations.filter((client) => client.tpaId === tpaId);
  }

  function getSitesForTpa(tpaId: TpaId): Site[] {
    const clientIds = new Set(getHostingAssociationsForTpa(tpaId).map((client) => client.id));
    return siteEntities.filter((site) => clientIds.has(site.hostingAssociationId));
  }

  function validateTpaIntegrity(): string[] {
    const errors: string[] = [];
    for (const client of hostingAssociations) {
      if (!tpasById.has(client.tpaId)) {
        errors.push(`HostingAssociation ${client.id} references unknown TPA ${client.tpaId}`);
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

  function getMemberAssociationsForHost(hostingAssociationId: string): Association[] {
    return associationEntities.filter((association) => association.hostingAssociationId === hostingAssociationId);
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
      if (!clientsById.has(association.hostingAssociationId)) {
        errors.push(`Association ${association.id} references unknown client ${association.hostingAssociationId}`);
      }
    }
    for (const relationship of siteAssociationEntities) {
      const site = sitesById.get(relationship.siteId);
      const association = associationsById.get(relationship.associationId);
      if (!site) errors.push(`SiteAssociation ${relationship.id} references unknown site ${relationship.siteId}`);
      if (!association) errors.push(`SiteAssociation ${relationship.id} references unknown association ${relationship.associationId}`);
      if (site && association && site.hostingAssociationId !== association.hostingAssociationId) {
        errors.push(`SiteAssociation ${relationship.id} crosses clients ${site.hostingAssociationId} and ${association.hostingAssociationId}`);
      }
    }
    return errors;
  }

  function getSitesForHostingAssociation(hostingAssociationId: string): Site[] {
    return siteEntities.filter((site) => site.hostingAssociationId === hostingAssociationId);
  }

  function getSiteCoverages(siteId: SiteId): SiteCoverage[] {
    return siteCoverageEntities.filter((relationship) => relationship.siteId === canonicalSiteKey(siteId));
  }

  function getHostingAssociationForSite(siteId: string): HostingAssociation | undefined {
    const site = getSite(siteId);
    return site ? getHostingAssociation(site.hostingAssociationId) : undefined;
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
   * domain-specific resolver. The data is resolved from canonical HostingAssociation and
   * Site entities; the legacy registry is not consulted.
   */
  function getEffectiveSiteConfig(siteId: SiteId): ClientConfig {
    const site = getSite(siteId);
    if (!site) throw new Error(`Unknown site id: ${siteId}`);
    return resolveEntityConfiguration(site);
  }

  return { hostingAssociations, tpaEntities, siteEntities, associationEntities, siteAssociationEntities, siteCoverageEntities, getHostingAssociation, getTpa, getTpaForAssociation, getHostingAssociationsForTpa, getSitesForTpa, validateTpaIntegrity, getSite, getAssociation, getMemberAssociationsForHost, getSiteAssociations, getAssociationsForSite, getSitesForAssociation, validateAssociationIntegrity, getSitesForHostingAssociation, getSiteCoverages, getHostingAssociationForSite, getSiteIdForClientAlias, getClientAliasForSite, getEffectiveSiteConfig };
}
