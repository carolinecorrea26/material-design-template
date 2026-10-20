import type { ClientEntityId, ClientConfigurationDefaults } from "./organizations";
import type { ClientBranding, ClientSupport, ConfigurationId } from "./configuration";
import type { AssociationSelection, AssociationBranding } from "./associations";
import type { CoverageId } from "./identities";
import type { FlowId } from "./flows";
import type { CmsEntryId } from "./content";

export type SiteId = string;
export type Site = {
  id: SiteId;
  clientId: ClientEntityId;
  name: string;
  templateType: "single" | "multi";
  status: "active" | "inactive";
  brandingOverride?: Partial<ClientBranding>;
  supportOverride?: Partial<ClientSupport>;
  configurationOverrides?: Partial<ClientConfigurationDefaults>;
  associationSelection?: AssociationSelection;
  associationBranding?: AssociationBranding;
};
export type SiteCoverage = {
  id: string;
  siteId: SiteId;
  coverageId: CoverageId;
  enabled: boolean;
};
export type SiteConfigurationValue = {
  id: string;
  siteId: SiteId;
  configurationId: ConfigurationId;
  value: unknown;
};
export type SiteFlowOverride = {
  id: string;
  siteId: SiteId;
  flowId: FlowId;
  value: unknown;
};
export type SiteContentOverride = {
  id: string;
  siteId: SiteId;
  cmsEntryId: CmsEntryId;
  value: unknown;
};

export type SiteEnvironment = "prototype" | "test" | "pre-production" | "production" | "automation";
export type SiteEnvironmentLink = {
  id: string;
  key: string;
  siteKey: SiteId;
  environment: SiteEnvironment;
  linkType: "launch" | "campaign" | "apply" | "returning" | "reference";
  label: string;
  url: string;
  active: boolean;
  position: number;
};
