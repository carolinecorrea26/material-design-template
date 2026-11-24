import type { RequirementFieldSource, RequirementMapping, RequirementPerson } from "./requirementFields";
export type RequirementComponent = { type: string; partOf?: string; mapping?: string; section?: string; dialog?: string; fields?: string[]; components?: RequirementComponent[] };
export type RequirementOutcomeCondition = { field: string; of?: RequirementPerson; outcome: string[] };
export type RequirementPage = {
  businessPolicy?: { employerCoverageCategories: string[]; businessCorrespondenceValue: string; hiddenCorrespondenceValue: string };
  components?: RequirementComponent[];
  content?: Record<string, string[]>;
  contentSlots?: Record<string, { name: string; optional?: boolean; kind?: 'image' | 'notice' | 'notes'; requiredWhen?: { configuration: string; properties?: string[]; equals?: string | boolean } }>;
  page: string;
  fieldMapping?: RequirementMapping;
  /** Suppress conditional follow-ups when their same-page controlling questions are unavailable. */
  hideFollowupsWhenQuestionHidden?: boolean;
  answerKeyPatterns?: Partial<Record<RequirementPerson, string>>;
  questionDetails?: Record<string, { surface: string; summary: 'assistance' | 'fall' | 'condition' | 'general' }>;
  consumerKey?: string;
  contentRoots?: string[];
  /** Superseded runtime field identities; never rewrite saved answers into another person. */
  retiredFieldKeys?: string[];
  /** Historical decisions superseded by a confirmed page review. */
  retiredDecisionKeys?: string[];
  /** Superseded page identities removed from every effective projection. */
  retiredPageKeys?: string[];
  /** Removed copy must not return from superseded authored catalogs. */
  retiredContentKeys?: string[];
  retiredComponentKeys?: string[];
  help?: Array<{ id: string; chip: string; title: string }>;
  surfaces?: Record<string, {
    kind?: 'tool' | 'controls';
    mapping?: RequirementMapping; fixture?: 'verification'; dialog?: string; for?: RequirementPerson;
    aliases?: Record<string, { field: string; label?: string }>;
    definition?: { label: string; maxItems?: number; minItems?: number; inspectionLabel?: string; inspectionOrder?: Record<string, number>; fields: Array<{ fieldKey: string; valueKey: string; grid?: boolean }>; libraryGroup?: { label: string; excludeFieldKeys?: string[] } };
  }>;
  collections?: Record<string, { surface: string; section: string; storageName: string; libraryGroup?: { label: string; applicant?: 'self' | 'spouse'; afterFieldKey?: string } }>;
  fieldVisibility?: Array<{ field: string; section: string; when: { all: Array<{ field: string; of?: RequirementPerson; equals: string | boolean }> } }>;
  productNotes?: { configuration: string };
  transitions?: Record<string, { id: string; trigger: string; fieldMappings: Array<{ source: string; targetFieldId: string; overwrite: 'always' | 'if-empty' }> }>;
  definition: Record<string, unknown>;
  position: number;
  layout: { sectionOrder?: string; sections: Record<string, {
    role?: 'questions' | 'categories' | 'portfolio' | 'reveal' | 'products' | 'summary';
    display?: { label: string; templates: Array<'single' | 'multi'>; excludeVariants?: string[] };
    coverageCategories?: string[];
    enabledByConfiguration?: string;
    applicantParticipation?: 'applying' | 'always';
    id?: string; for?: RequirementPerson; title?: string; fields?: string[]; remaining?: boolean; companions?: Record<string, string[]>;
    when?: { field?: string; of?: RequirementPerson; includes?: string; equals?: string; all?: Array<{ field: string; of?: RequirementPerson; includes?: string; equals?: string }> };
    presentation?: "conditional"; collection?: string;
    repeats?: { item: string; max: string; grid: string[]; libraryLabel?: string };
  }>; dialogs?: Record<string, { for?: RequirementPerson; fields?: string[] }> };
  companions?: Record<string, string[]>;
  shownWhen?: { sections?: Record<string, RequirementOutcomeCondition>; fields?: Array<{ field: string; section: string; shownWhen: RequirementOutcomeCondition }> };
  controls?: string[];
  sections?: Record<string, { note?: string }>;
  note?: string;
};
export type RequirementCatalogSource = {
  contentInventory: {
    placements: Array<{ id: string; location: string; component?: string; renderer?: string; when: string; keys: string[]; pages?: string[]; channel: string }>;
    exclusions: Array<{ reason: string; keys: string[] }>;
  };
  contentSources: Record<string, string>;
  components: import('./requirementComponents.mjs').RequirementComponentDefinition[];
  recovery: typeof import("../../requirements/global/recovery.json");
  sectionOrders: Record<string, string[]>;
  prototypeHandoffs: Record<string, Array<{ src?: string; alt: string; placeholder?: string }>>;
  sitePrototypeHandoffs: Record<string, RequirementCatalogSource['prototypeHandoffs']>;
  rules?: Array<{ id: string; replaces?: string[]; templates?: import("./ruleTemplates.mjs").RuleTemplateScope["templates"] }>;
  workflows?: Array<{ id: string; templates?: import("./ruleTemplates.mjs").RuleTemplateScope["templates"] }>;
  application: { retiredRuleKeys?: string[]; retiredConfigurationKeys?: string[]; retiredContentRoots?: string[]; retiredFlowKeys?: string[]; records: Record<string, Array<Record<string, unknown>>> };
  siteApplication: Record<string, { site: string; records: Record<string, Array<Record<string, unknown>>> }>;
  fields: RequirementFieldSource;
  pages: Record<string, RequirementPage>;
  pageDefaults: { pages: Record<string, { requirement: string; siteRequirementOptions?: string[] }> };
  contentReferences?: Record<string, string>;
  content: Record<string, unknown>;
  contentBindings: Record<string, string | string[]>;
  coverageQuestions: unknown;
  siteEligibility: Record<string, {
    configurations: { "tpa-integration": string; "eligible-states-only": boolean; "eligible-states": string[] };
    tpa: Record<string, unknown>;
  }>;
  siteCoverage: Record<string, unknown>;
  siteCoveragePolicies: Record<string, unknown>;
  configurations: Array<{ id: string; status: string; type: string; default?: unknown; options?: string[]; replaces?: string[]; runtimeValues?: Record<string, string>; minimum?: number; maximum?: number; policyKey?: string; productApplicantOverrides?: boolean; globalOnly?: boolean }>;
  verification: { failureAnswer: string; questions: Array<{ id: string; question: string; options: string[] }> };
  products: { catalog: Record<string, Array<Record<string, unknown>>>; products: Array<{ id: string; category: string; content: Partial<Record<string, string>>; amounts?: Record<string, { applicants: string[]; minimum: number; maximum: number | string; increment: number | null }> }> };
  siteProducts: Record<string, { catalog?: Record<string, Array<Record<string, unknown>>>; categories?: Record<string, { name?: string; description?: string }>; products: Record<string, { name?: string; description?: string; descriptionNotice?: string; applicantNotes?: Partial<Record<'member' | 'spouse' | 'child', string>>; brochureUrl?: string }> }>;
  configurationBindings: Record<string, string>;
};
export function compileRequirementCatalog<T>(data: T, source: RequirementCatalogSource, selectedSite?: string, siteScope?: readonly string[]): T & Pick<import('../persistence/types').DatabaseSchema, 'components'>;
