import type { ClientConfig, ClientBranding, ClientSupport } from "../config/clients/types";
import type { FlowId } from "../content/docs/flows/types";
import type { ClientId, CoverageId, PageGroupId, PageId } from "../types";
import type { FieldId } from "../config/fields/types";
import type { PageSectionId } from "../config/pageSections/types";
import type { ConditionId } from "../config/conditions/types";

export type ClientEntityId = string;
export type TpaId = string;
export type SiteId = string;
export type AssociationId = string;
export type SiteAssociationId = string;
export type AssociationSelectionMode = "fixed" | "url-parameter" | "select";
export type ProgressStepId = string;
export type CoverageCategoryEntityId = string;
export type RiderId = string;
export type ConfigurationId = `config-${string}`;
export type RuleId = `rule-${string}`;
export type CmsEntryId = string;

export type ClientConfigurationDefaults = Omit<
  ClientConfig,
  "id" | "clientGroupId" | "siteLabel" | "branding" | "support"
>;

export type Client = {
  id: ClientEntityId;
  tpaId: TpaId;
  name: string;
  acronym: string;
  branding: ClientBranding;
  support: ClientSupport;
  configurationDefaults: ClientConfigurationDefaults;
};

export type Tpa = {
  id: TpaId;
  name: string;
  acronym?: string;
  branding?: Partial<ClientBranding>;
  support?: ClientSupport & { contactName?: string };
  /** Compatibility TPAs require confirmation from the business data owner. */
  provisional?: boolean;
};

export type Association = {
  id: AssociationId;
  clientId: ClientEntityId;
  name: string;
  acronym?: string;
  logo?: string;
  logoAlt?: string;
};

export type AssociationSelection = {
  mode: AssociationSelectionMode;
  /** Required for fixed mode; never inferred from relationship ordering. */
  fixedAssociationId?: AssociationId;
  /** Defaults to the documented `association` parameter. */
  urlParameter?: "association";
};

export type AssociationBranding = {
  useAssociationLogo: boolean;
};

export type Site = {
  id: SiteId;
  clientId: ClientEntityId;
  name: string;
  templateType: "single" | "multi";
  status: "active" | "inactive";
  /** Temporary bridge to the old ?client= identity and content/config maps. */
  legacyClientId: ClientId;
  brandingOverride?: Partial<ClientBranding>;
  supportOverride?: Partial<ClientSupport>;
  configurationOverrides?: Partial<ClientConfigurationDefaults>;
  associationSelection?: AssociationSelection;
  associationBranding?: AssociationBranding;
};

export type SiteAssociation = {
  id: SiteAssociationId;
  siteId: SiteId;
  associationId: AssociationId;
  enabled: boolean;
};

export type Page = { id: PageId; groupId?: PageGroupId; path: string; type: string };
export type PageGroup = { id: PageGroupId; pageIds: PageId[] };
export type ProgressStep = { id: ProgressStepId; pageIds: PageId[]; label: string };
export type Field = { id: FieldId };
export type PageSection = { id: PageSectionId; pageId: PageId; fieldIds: FieldId[] };
export type CoverageCategory = { id: CoverageCategoryEntityId; label: string };
export type CoverageProduct = { id: CoverageId; categoryId: CoverageCategoryEntityId; name: string };
export type Rider = { id: RiderId; name: string };
export type ConfigurationDefinition = { id: ConfigurationId; name: string; scope: string };
export type RuleDefinition = {
  id: RuleId;
  area: string;
  rule: string;
  behavior: string;
  ref: string;
  type?: "behavioral" | "conditional";
  scope?: "global" | "client" | "site";
  conditionIds?: ConditionId[];
  clientIds?: ClientEntityId[];
  siteIds?: SiteId[];
};
export type FlowDefinition = { id: FlowId; title: string };
export type CmsEntry = { id: CmsEntryId };

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
