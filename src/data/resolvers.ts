import type { ClientBranding, ClientConfig } from "../config/clients/types";
import {
  resolveClientConfigurations,
  resolveClientCoverage,
  resolveClientFields,
  resolveClientFlows,
  resolveClientPages,
} from "../config/resolvers";
import type { SiteId } from "./model";
import type { Association, AssociationId, Site } from "./model";
export {
  resolveActiveAssociation,
  resolveAssociationSelection,
  resolveSiteAssociations,
  type ActiveAssociationResolution,
  type AssociationSelectionContext,
} from "./associationSelection";
import {
  getAssociation,
  getAssociationsForSite,
  getClientForSite,
  getLegacyClientConfigForSite,
  getSite,
} from "./registry";

export function resolveEffectiveBranding({
  siteId,
  associationId,
}: {
  siteId: SiteId;
  associationId?: AssociationId | null;
}): ClientBranding {
  const site = getSite(siteId);
  const client = getClientForSite(siteId);
  if (!site || !client) throw new Error(`Unknown site id: ${siteId}`);

  const association = associationId ? getAssociation(associationId) : undefined;
  const associationIsEnabled = Boolean(
    associationId &&
      getAssociationsForSite(siteId).some((entry) => entry.id === associationId),
  );
  return resolveBranding(
    client.branding,
    site,
    association && associationIsEnabled ? association : undefined,
  );
}

export function resolveBranding(
  clientBranding: ClientBranding,
  site: Site,
  association?: Association,
): ClientBranding {
  const siteBranding = { ...clientBranding, ...site.brandingOverride };
  if (!site.associationBranding?.useAssociationLogo || !association?.logo) {
    return siteBranding;
  }

  return {
    ...siteBranding,
    logo: association.logo,
    logoAlt: association.logoAlt ?? `${association.name} logo`,
  };
}

export type ResolvedSite = {
  site: NonNullable<ReturnType<typeof getSite>>;
  client: NonNullable<ReturnType<typeof getClientForSite>>;
  clientDefaults: ClientConfig["pages"] | object;
  siteOverrides?: object;
  effective: ClientConfig;
  status: "inherited" | "overridden";
};

export function resolveSite(siteId: SiteId): ResolvedSite {
  const site = getSite(siteId);
  const client = getClientForSite(siteId);
  if (!site || !client) throw new Error(`Unknown site id: ${siteId}`);
  return {
    site,
    client,
    clientDefaults: client.configurationDefaults,
    siteOverrides: site.configurationOverrides,
    effective: getLegacyClientConfigForSite(siteId),
    status:
      site.configurationOverrides || site.brandingOverride || site.supportOverride
        ? "overridden"
        : "inherited",
  };
}

export function resolveSiteCoverage(siteId: SiteId) {
  return resolveClientCoverage(resolveSite(siteId).effective);
}

export function resolveSiteFields(siteId: SiteId) {
  return resolveClientFields(resolveSite(siteId).effective);
}

export function resolveSiteConfigurations(siteId: SiteId) {
  return resolveClientConfigurations(resolveSite(siteId).effective);
}

export function resolveSiteFlows(siteId: SiteId) {
  return resolveClientFlows(resolveSite(siteId).effective);
}

export function resolveSitePages(siteId: SiteId) {
  return resolveClientPages(resolveSite(siteId).effective);
}
