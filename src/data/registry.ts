import { clients as legacyClients } from "../config/clients";
import type { ClientConfig } from "../config/clients/types";
import type { ClientId } from "../types";
import type { Association, AssociationId, Client, Site, SiteAssociation, SiteCoverage, SiteId, Tpa, TpaId } from "./model";
import { waepaClientEntity, waepaSites } from "./waepa";
import { associationEntities, siteAssociationEntities } from "./associations";
import { compatibilityTpaId, toCompatibilityTpa } from "./tpas";

function toClientEntity(config: ClientConfig): Client {
  const configurationDefaults = { ...config } as Partial<ClientConfig>;
  delete configurationDefaults.id;
  delete configurationDefaults.clientGroupId;
  delete configurationDefaults.siteLabel;
  delete configurationDefaults.branding;
  delete configurationDefaults.support;
  return {
    id: config.id,
    tpaId: compatibilityTpaId(config.id),
    name: config.branding.name,
    acronym: config.branding.acronym,
    branding: config.branding,
    support: config.support,
    configurationDefaults: configurationDefaults as Client["configurationDefaults"],
  };
}

const singleSiteLegacyClients = Object.values(legacyClients).filter(
  (config) => config.id !== "waepa" && config.id !== "waepagi",
);

export const clientEntities: Client[] = [
  ...singleSiteLegacyClients.map(toClientEntity),
  waepaClientEntity,
];

export const tpaEntities: Tpa[] = [
  ...singleSiteLegacyClients.map(toCompatibilityTpa),
  toCompatibilityTpa(legacyClients.waepa),
];

export const siteEntities: Site[] = [
  ...singleSiteLegacyClients.map((config): Site => {
    const fixedAssociationIds: Partial<Record<ClientId, AssociationId>> = {
      ama: "american-medical-association",
      asce: "american-society-of-civil-engineers",
      avma: "american-veterinary-medical-association",
    };
    const fixedAssociationId = fixedAssociationIds[config.id];
    return {
      id: `${config.id}-default`,
      clientId: config.id,
      name: "Default Site",
      templateType: config.features?.defaultTemplate ?? "multi",
      status: "active",
      legacyClientId: config.id,
      associationSelection:
        config.id === "isitrust"
          ? { mode: "select" }
          : fixedAssociationId
            ? { mode: "fixed", fixedAssociationId }
            : undefined,
      associationBranding:
        config.id === "asce" ? { useAssociationLogo: true } : undefined,
    };
  }),
  ...waepaSites,
];

export const siteCoverageEntities: SiteCoverage[] = siteEntities.flatMap((site) =>
  (legacyClients[site.legacyClientId].coverages.enabled ?? []).map((coverageId) => ({
    id: `${site.id}--${coverageId}`,
    siteId: site.id,
    coverageId,
    enabled: true,
  })),
);

const clientsById = new Map(clientEntities.map((client) => [client.id, client]));
const tpasById = new Map(tpaEntities.map((tpa) => [tpa.id, tpa]));
const sitesById = new Map(siteEntities.map((site) => [site.id, site]));
const associationsById = new Map(
  associationEntities.map((association) => [association.id, association]),
);
const siteIdByLegacyClientId = new Map(
  siteEntities.map((site) => [site.legacyClientId, site.id]),
);

export function getClient(clientId: string): Client | undefined {
  return clientsById.get(clientId);
}

export function getTpa(tpaId: TpaId): Tpa | undefined {
  return tpasById.get(tpaId);
}

export function getTpaForClient(clientId: string): Tpa | undefined {
  const client = getClient(clientId);
  return client ? getTpa(client.tpaId) : undefined;
}

export function getClientsForTpa(
  tpaId: TpaId,
  clients: Client[] = clientEntities,
): Client[] {
  return clients.filter((client) => client.tpaId === tpaId);
}

export function getSitesForTpa(tpaId: TpaId): Site[] {
  const clientIds = new Set(getClientsForTpa(tpaId).map((client) => client.id));
  return siteEntities.filter((site) => clientIds.has(site.clientId));
}

export function validateTpaIntegrity(): string[] {
  const errors: string[] = [];
  for (const client of clientEntities) {
    if (!tpasById.has(client.tpaId)) {
      errors.push(`Client ${client.id} references unknown TPA ${client.tpaId}`);
    }
  }
  return errors;
}

export function getSite(siteId: string): Site | undefined {
  return sitesById.get(siteId);
}

export function getAssociation(associationId: string): Association | undefined {
  return associationsById.get(associationId);
}

export function getAssociationsForClient(clientId: string): Association[] {
  return associationEntities.filter((association) => association.clientId === clientId);
}

export function getSiteAssociations(siteId: SiteId): SiteAssociation[] {
  return siteAssociationEntities.filter((relationship) => relationship.siteId === siteId);
}

export function getAssociationsForSite(siteId: SiteId): Association[] {
  return getSiteAssociations(siteId)
    .filter((relationship) => relationship.enabled)
    .map((relationship) => getAssociation(relationship.associationId))
    .filter((association): association is Association => Boolean(association));
}

export function getSitesForAssociation(associationId: AssociationId): Site[] {
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

export function validateAssociationIntegrity(): string[] {
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

export function getSitesForClient(clientId: string): Site[] {
  return siteEntities.filter((site) => site.clientId === clientId);
}

export function getSiteCoverages(siteId: SiteId): SiteCoverage[] {
  return siteCoverageEntities.filter((relationship) => relationship.siteId === siteId);
}

export function getClientForSite(siteId: string): Client | undefined {
  const site = getSite(siteId);
  return site ? getClient(site.clientId) : undefined;
}

export function getSiteIdForLegacyClient(clientId: ClientId): SiteId {
  return siteIdByLegacyClientId.get(clientId) ?? "demo-default";
}

export function getLegacyClientIdForSite(siteId: SiteId): ClientId {
  return getSite(siteId)?.legacyClientId ?? "demo";
}

export function getLegacyClientConfigForSite(siteId: SiteId): ClientConfig {
  return legacyClients[getLegacyClientIdForSite(siteId)];
}
