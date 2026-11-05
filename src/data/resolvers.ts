import type { ClientBranding, ClientConfig, ClientSupport } from "../config/clients/types";
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
  getAssociationsForSite,
  getClientForSite,
  getEffectiveSiteConfig,
  getSite,
} from "../repositories/sites";

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

  const association = getAssociationsForSite(siteId).find(entry => entry.id === associationId);
  return resolveBranding(
    client.branding,
    site,
    association,
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
    effective: getEffectiveSiteConfig(siteId),
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
  return resolveClientPages(resolveSite(siteId).effective, siteId);
}

export function resolveSiteSupport(siteId: SiteId): ClientSupport {
  return resolveSite(siteId).effective.support;
}

export function resolveSiteFeatures(siteId: SiteId) {
  return resolveSite(siteId).effective.features;
}

export function resolveSitePageSettings(siteId: SiteId) {
  return resolveSite(siteId).effective.pages;
}

export function resolveSiteCoverageSettings(siteId: SiteId) {
  return resolveSite(siteId).effective.coverages;
}

export function resolveSiteFieldSettings(siteId: SiteId) {
  return resolveSite(siteId).effective.fields;
}

export function resolveSiteEmailConfiguration(siteId: SiteId) {
  return resolveSite(siteId).effective.emailSupport;
}

export function resolveSiteApplicantLabels(siteId: SiteId) {
  return resolveSite(siteId).effective.applicantLabels;
}

export function resolveSiteLicenseInfo(siteId: SiteId) {
  return resolveSite(siteId).effective.licenseInfo;
}
