import { mergeConfiguration } from "./compatibility";
import type { ClientConfig } from "../config/clients/types";
import type { ClientId } from "../types";
import { abeClient } from "../config/clients/abe";
import { amaClient } from "../config/clients/ama";
import { asceClient } from "../config/clients/asce";
import { avmaClient } from "../config/clients/avma";
import { cseaClient } from "../config/clients/csea";
import { demoClient } from "../config/clients/demo";
import { isitrustClient } from "../config/clients/isitrust";
import { nsoClient } from "../config/clients/nso";
import type { AssociationId, Client, Site, SiteCoverage, SiteId, Tpa } from "../data/model";
import { waepaClientEntity, waepaSites } from "../data/waepa";
import { associationEntities, siteAssociationEntities } from "../data/associations";
import { compatibilityTpaId, toCompatibilityTpa } from "../data/tpas";

function toClientEntity(config: ClientConfig): Client {
  const configurationDefaults = { ...config } as Partial<ClientConfig>;
  delete configurationDefaults.id;
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

// Each canonical Client and Site is listed explicitly. The imported objects are
// source-controlled authoring definitions; registry identity no longer depends
// on iterating the legacy `clients` compatibility map.
const singleSiteDefinitions = [
  demoClient,
  abeClient,
  amaClient,
  asceClient,
  avmaClient,
  cseaClient,
  nsoClient,
  isitrustClient,
] as const;

const clientEntities: Client[] = [
  ...singleSiteDefinitions.map(toClientEntity),
  waepaClientEntity,
];

const tpaEntities: Tpa[] = [
  ...singleSiteDefinitions.map((config) => config.id === "asce"
    // Confirmed by ASCE_Portal_Site_Rules.xlsx, Overview!B3; preserve the existing stable key.
    ? { id: compatibilityTpaId(config.id), name: "Pearl Insurance", provisional: false }
    : toCompatibilityTpa(config)),
  {
    id: waepaClientEntity.tpaId,
    name: "Compatibility TPA for waepa",
    provisional: true,
  },
];

const siteEntities: Site[] = [
  ...singleSiteDefinitions.map((config): Site => {
    const fixedAssociationIds: Partial<Record<ClientId, AssociationId>> = {
      ama: "american-medical-association",
      asce: "american-society-of-civil-engineers",
      avma: "american-veterinary-medical-association",
    };
    const fixedAssociationId = fixedAssociationIds[config.id];
    return {
      id: config.id,
      clientId: config.id,
      name: `${config.branding.acronym} Site`,
      templateType: config.features?.defaultTemplate ?? "multi",
      status: "active",
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

const siteIdByClientAlias = new Map<ClientId, SiteId>([
  ["demo", "demo"],
  ["abe", "abe"],
  ["ama", "ama"],
  ["asce", "asce"],
  ["avma", "avma"],
  ["csea", "csea"],
  ["nso", "nso"],
  ["isitrust", "isitrust"],
  ["waepa", "waepa"],
  ["waepagi", "waepa-gi"],
]);
const clientAliasBySiteId = new Map(
  [...siteIdByClientAlias].map(([alias, siteId]) => [siteId, alias]),
);

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

const siteCoverageEntities: SiteCoverage[] = siteEntities.flatMap((site) =>
  (resolveEntityConfiguration(site).coverages.enabled ?? []).map((coverageId) => ({
    id: `${site.id}--${coverageId}`,
    siteId: site.id,
    coverageId,
    enabled: true,
  })),
);

/** Public asset folders and old persisted records still use these aliases. */
function getClientAliasForSite(siteId: SiteId): ClientId {
  return clientAliasBySiteId.get(siteId) ?? "demo";
}

export const staticSiteAdapter = { read: () => ({ clientEntities, tpaEntities, siteEntities, associationEntities, siteAssociationEntities, siteCoverageEntities, aliases: [...siteIdByClientAlias] }) };
