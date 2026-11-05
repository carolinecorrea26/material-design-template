import type { Tpa } from "../../domain/organizations";
import type { LibraryRow } from "./catalog";
export * from "./catalog";
import type { PageRow, PageSectionRow, FieldRow, PageFieldRow, ValidationRuleRow } from "./template";
export * from "./template";
import type { CoverageCategoryRow, ProductRow, RiderRow, ProductRiderRow, ProductIdentifierRow, ApplicantTypeRow } from "./coverage";
export * from "./coverage";
import type { ConditionRow, RuleRow, RuleConditionRow, RuleActionRow } from "./rules";
export * from "./rules";
import type { FlowRow, FlowStepRow, FlowTransitionRow } from "./flows";
export * from "./flows";
import type { FeatureRow, ConfigurationDefinitionRow, ContentEntryRow, EmailTemplateRow, DocumentDefinitionRow } from "./content";
export * from "./content";
export interface AssociationRow extends LibraryRow<{ name: string; acronym?: string; logo?: string; logoAlt?: string }> { clientKey: string }

export type ComponentUsage = { source: string; label: string; pageKey?: string };
export type ComponentRole = 'application-frame' | 'page-section' | 'shared-piece';
export type ComponentPart = {
  name: string;
  kind: 'export' | 'native-element' | 'action' | 'slot';
  sourceSymbol: string;
  description: string;
};
export type ComponentRow = LibraryRow<{ name: string; description: string; section: string; storyId: string; storybookPath: string; source: string;
  /** Primary ownership, separate from Storybook category and reuse count. */
  role: ComponentRole;
  /** Direct registered source dependencies by component key, including conditional paths. */
  contains: string[];
  /** Exports, native elements, actions and caller-supplied slots kept inside this owner. */
  parts: ComponentPart[];
  packageImport?: { module: string; symbol: string };
  usages?: ComponentUsage[];
  examples?: { label: string; storyId: string; section: string; pageKey?: string; position?: number }[];
}>;

export interface LibrarySchema {
  components: ComponentRow[];
  analyticsTags: import("../../domain/analytics").AnalyticsTag[];
  organizationProfiles: (LibraryRow<Omit<Tpa, "id">> & { organizationKey: string })[];
  associations: AssociationRow[];
  pages: PageRow[]; pageSections: PageSectionRow[]; fields: FieldRow[]; pageFields: PageFieldRow[];
  coverageCategories: CoverageCategoryRow[]; products: ProductRow[]; riders: RiderRow[];
  productRiders: ProductRiderRow[]; productIdentifiers: ProductIdentifierRow[]; applicantTypes: ApplicantTypeRow[];
  conditions: ConditionRow[]; rules: RuleRow[]; ruleConditions: RuleConditionRow[]; ruleActions: RuleActionRow[];
  flows: FlowRow[]; flowSteps: FlowStepRow[]; flowTransitions: FlowTransitionRow[]; features: FeatureRow[];
  configurationDefinitions: ConfigurationDefinitionRow[]; contentEntries: ContentEntryRow[];
  emailTemplates: EmailTemplateRow[]; documentDefinitions: DocumentDefinitionRow[]; validationRules: ValidationRuleRow[];
}
