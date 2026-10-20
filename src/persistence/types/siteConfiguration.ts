import type { LibraryMetadata } from "../../domain/provenance";
import type { Scope, LibraryRow } from "./library";
import type { Json } from "./common";
import type { FieldOverrideValues } from "../../config/fields/fieldOverrides";
import type { AssociationSelection, AssociationBranding } from "../../domain/associations";
import type { ClientBranding, ClientSupport } from "../../domain/configuration";
export interface SiteAssociationRow extends Partial<LibraryMetadata> { id: string; key: string; siteKey: string; associationKey: string; enabled: boolean; position: number }
export interface SitePageRow extends Partial<LibraryMetadata> { id: string; key: string; siteKey: string; pageKey: string; requirement: "required" | "optional" | "none"; position: number }
export interface SiteFieldConfigurationRow extends Partial<LibraryMetadata>, Scope {
  id: string; key: string; pageKey: string; fieldKey: string; position: number;
  include: boolean | null; hidden: boolean | null; values: FieldOverrideValues;
}
export interface SiteProductApplicantRow extends Partial<LibraryMetadata> { id: string; key: string; siteKey: string; productKey: string; applicantKey: string; position: number }
export interface SiteFeatureRow extends Partial<LibraryMetadata> { id: string; key: string; siteKey: string; featureKey: string; enabled: boolean; position: number }
export interface SiteFlowRow extends Partial<LibraryMetadata>, Scope { id: string; key: string; flowKey: string; flowId: string; position: number }
export interface RuleAssignmentRow extends Partial<LibraryMetadata>, Scope { id: string; key: string; ruleKey: string; position: number }
export interface ConfigurationValueRow extends Partial<LibraryMetadata>, Scope { id: string; key: string; configurationKey: string; value: Json; position: number }
export interface ContentValueRow extends Partial<LibraryMetadata>, Scope { id: string; key: string; contentKey: string; value: Json; position: number }
export type BrandingProfileRow = Scope & LibraryRow<Partial<ClientBranding>>;
export type SupportProfileRow = Scope & LibraryRow<Partial<ClientSupport>>;
export interface SiteEmailTemplateRow extends Partial<LibraryMetadata> { id: string; key: string; siteKey: string; emailTemplateKey: string; enabled: boolean; position: number }
export interface SiteDocumentRow extends Partial<LibraryMetadata> { id: string; key: string; siteKey: string; documentKey: string; position: number }
export interface SitePolicyRow extends LibraryRow<{ associationSelection?: AssociationSelection; associationBranding?: AssociationBranding; payment?: import("../../domain/paymentPolicy").PaymentPolicy }> { siteKey: string }
export interface SiteConfigurationSchema {
  siteEnvironmentLinks: (import("../../domain/sites").SiteEnvironmentLink & Partial<LibraryMetadata>)[];
  siteAssociations: SiteAssociationRow[]; sitePages: SitePageRow[]; siteFieldConfigurations: SiteFieldConfigurationRow[];
  siteProductApplicants: SiteProductApplicantRow[]; siteFeatures: SiteFeatureRow[]; siteFlows: SiteFlowRow[];
  ruleAssignments: RuleAssignmentRow[]; configurationValues: ConfigurationValueRow[]; contentValues: ContentValueRow[];
  brandingProfiles: BrandingProfileRow[]; supportProfiles: SupportProfileRow[];
  siteEmailTemplates: SiteEmailTemplateRow[]; siteDocuments: SiteDocumentRow[]; sitePolicies: SitePolicyRow[];
}
