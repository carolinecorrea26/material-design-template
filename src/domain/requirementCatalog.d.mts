import type { RequirementFieldSource, RequirementMapping, RequirementPerson } from "./requirementFields";
export type RequirementPage = {
  page: string;
  fieldMapping?: RequirementMapping;
  consumerKey?: string;
  contentRoots?: string[];
  surfaces?: Record<string, {
    mapping: RequirementMapping; for?: RequirementPerson;
    aliases?: Record<string, { field: string; label?: string }>;
    definition?: { label: string; maxItems?: number; fields: Array<{ fieldKey: string; valueKey: string; grid?: boolean }>; libraryGroup?: { label: string; excludeFieldKeys?: string[] } };
  }>;
  productNotes?: { configuration: string };
  transitions?: Record<string, { id: string; trigger: string; fieldMappings: Array<{ source: string; targetFieldId: string; overwrite: 'always' | 'if-empty' }> }>;
  fieldBindings?: string[];
  looseFields?: string[];
  definition: Record<string, unknown>;
  position: number;
  layout: { sections: Record<string, {
    id?: string; for?: RequirementPerson; title?: string; fields?: string[]; remaining?: boolean; companions?: Record<string, string[]>;
    when?: { field: string; includes?: string; equals?: string };
    presentation?: "conditional"; collection?: string;
    repeats?: { item: string; max: string; grid: string[] };
  }>; dialogs?: Record<string, { for?: RequirementPerson; fields?: string[] }> };
  companions?: Record<string, string[]>;
  controls?: string[];
  sections?: Record<string, { note?: string }>;
  note?: string;
};
export type RequirementCatalogSource = {
  application: { records: Record<string, Array<Record<string, unknown>>> };
  siteApplication: Record<string, { site: string; records: Record<string, Array<Record<string, unknown>>> }>;
  fields: RequirementFieldSource;
  pages: Record<string, RequirementPage>;
  pageDefaults: { pages: Record<string, { requirement: string }> };
  content: Record<string, unknown>;
  contentBindings: Record<string, string | string[]>;
  coverageQuestions: unknown;
  siteEligibility: Record<string, {
    configurations: { "tpa-integration": string; "eligible-states-only": boolean; "eligible-states": string[] };
    tpa: Record<string, unknown>;
  }>;
  siteCoverage: Record<string, unknown>;
  siteCoveragePolicies: Record<string, unknown>;
  configurations: Array<{ id: string; status: string; type: string; default?: unknown; options?: string[] }>;
  verification: { failureAnswer: string; questions: Array<{ id: string; question: string; options: string[] }> };
  products: { catalog: Record<string, Array<Record<string, unknown>>>; products: Array<{ id: string; category: string; content: Partial<Record<string, string>>; amounts?: Record<string, { applicants: string[]; minimum: number; maximum: number | string; increment: number | null }> }> };
  siteProducts: Record<string, { catalog?: Record<string, Array<Record<string, unknown>>>; products: Record<string, { brochureUrl?: string }> }>;
  configurationBindings: Record<string, string>;
};
export function compileRequirementCatalog<T>(data: T, source: RequirementCatalogSource, selectedSite?: string): T;
