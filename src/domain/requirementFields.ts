import fieldIds from "../../requirements/global/fields.json";
import fieldDetails from "../../requirements/parked/field-details.json";
import optionLists from "../../requirements/global/option-lists.json";
import { resolveMappedFields as resolveRequirementFields } from "./requirementFieldDefinitions.mjs";
import type { FieldDefinition } from "./fields";

/** A page or component mapping under requirements/mappings. */
export type RequirementMapping = { component: string } | { page: string };
export type RequirementPerson = "self" | "spouse" | "child" | "beneficiary";
export type RequirementFieldSource = {
  fieldIds: unknown;
  fieldDetails: unknown;
  optionLists: unknown;
  mappings: unknown[];
  sites: Record<string, unknown>;
  /** Site page files (`parked/sites/<site>/pages/<page>.json`): `include` default-off fields, `hide` default-on ones. */
  sitePages?: Record<string, Record<string, unknown>>;
};

const jsonModules = (modules: Record<string, unknown>) => Object.values(modules).map(module => (module as { default?: unknown }).default ?? module);
export const defaultRequirementFieldSource = (): RequirementFieldSource => ({
  fieldIds,
  fieldDetails,
  optionLists,
  mappings: [
    ...jsonModules(import.meta.glob("../../requirements/mappings/components/*.json", { eager: true })),
    ...jsonModules(import.meta.glob("../../requirements/mappings/page-fields/*.json", { eager: true })),
  ],
  sites: Object.fromEntries(Object.entries(import.meta.glob("../../requirements/parked/sites/*/fields.json", { eager: true }))
    .map(([path, module]) => [path.split("/").at(-2)!, (module as { default?: unknown }).default ?? module])),
  sitePages: Object.entries(import.meta.glob("../../requirements/parked/sites/*/pages/*.json", { eager: true })).reduce<Record<string, Record<string, unknown>>>((sites, [path, module]) => {
    const site = path.split("/").at(-3)!;
    (sites[site] ??= {})[path.split("/").at(-1)!.replace(/\.json$/, "")] = (module as { default?: unknown }).default ?? module;
    return sites;
  }, {}),
});

const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const mappingName = (mapping: RequirementMapping) => "component" in mapping ? `component ${mapping.component}` : `page ${mapping.page}`;

/** Sites with a requirements/parked/sites/<site> folder load their fields from the requirements JSON. */
export function siteUsesRequirementFields(siteId: string, source: RequirementFieldSource = defaultRequirementFieldSource()): boolean {
  return Object.hasOwn(source.sites, siteId);
}

/**
 * Resolve every field a page or component mapping lists for one person:
 * global definition + field details + option lists, then the site's overrides.
 */
export function resolveMappedFields(mapping: RequirementMapping, options: { siteId?: string; person?: RequirementPerson; page?: string; includeAll?: boolean; source?: RequirementFieldSource } = {}): FieldDefinition[] {
  return resolveRequirementFields(mapping, { ...options, source: options.source ?? defaultRequirementFieldSource() });
}

/** Stable saved-answer key for a mapped field and person. */
export function requirementAnswerKey(fieldId: string, person: RequirementPerson): string {
  return person === "self" ? fieldId : `${person}-${fieldId}`;
}

/** Parse only fields actually mapped to the indicated person. */
export function parseRequirementAnswerKey(key: string, source: RequirementFieldSource = defaultRequirementFieldSource()): { field: string; person: RequirementPerson } | undefined {
  const person: RequirementPerson = key.startsWith("spouse-") ? "spouse" : key.startsWith("child-") ? "child" : "self";
  const field = person === "self" ? key : key.slice(person.length + 1);
  return source.mappings.some(mapping => object(mapping) && Array.isArray(mapping.fields) && mapping.fields.some(row => object(row) && row.field === field && Array.isArray(row.people) && row.people.includes(person))) ? { field, person } : undefined;
}

/** Pages whose saved field definitions come from the requirements JSON. A page is added once its JSON review is agreed. */
export const requirementPages: Record<string, RequirementMapping> = {
  home: { component: "home" },
  membership: { component: "membership" },
  eligibility: { component: "eligibility" },
  coverage: { page: "coverage" },
  beneficiary: { page: "beneficiary" },
  contact: { page: "contact" },
};

const requirementContent = (): Record<string, unknown> => Object.assign({}, ...jsonModules(import.meta.glob("../../requirements/global/content/*.json", { eager: true })));
const requirementPageFiles = () => jsonModules(import.meta.glob("../../requirements/parked/*.json", { eager: true }));

/** Optional info alert below a page header; a site chooses a content key, never copied text. */
export function requirementPageNote(
  pageKey: string,
  siteId: string,
  source: RequirementFieldSource = defaultRequirementFieldSource(),
  content: Record<string, unknown> = requirementContent(),
  pages: unknown[] = requirementPageFiles(),
): string | undefined {
  if (!requirementPages[pageKey] || !siteUsesRequirementFields(siteId, source)) return undefined;
  const page = pages.find(file => object(file) && file.page === pageKey) as { note?: string } | undefined;
  const sitePage = source.sitePages?.[siteId]?.[pageKey] as { note?: string } | undefined;
  const key = sitePage?.note ?? page?.note;
  if (!key) return undefined;
  if (typeof content[key] !== "string") throw new Error(`Page note ${key} for ${pageKey} is not in the requirements content`);
  return content[key] as string;
}

// Runtime section ids for the requirements' section ids, per rolled-out page with section notes.
const runtimeSections: Record<string, Record<string, string>> = {
  eligibility: { self: "selfEligibility", spouse: "spouseSection", children: "childSection" },
  coverage: { spouse: "spouseSection" },
};

/**
 * Section info alerts for a rolled-out page, keyed by runtime section id: the
 * site's page file chooses first (`notes`), then the page's section `note`.
 */
export function requirementSectionNotes(
  pageKey: string,
  siteId: string,
  source: RequirementFieldSource = defaultRequirementFieldSource(),
  content: Record<string, unknown> = requirementContent(),
  pages: unknown[] = requirementPageFiles(),
): Record<string, string> | undefined {
  const sections = runtimeSections[pageKey];
  if (!sections || !requirementPages[pageKey] || !siteUsesRequirementFields(siteId, source)) return undefined;
  const page = pages.find(file => object(file) && file.page === pageKey) as { sections?: Record<string, { note?: string }> } | undefined;
  const siteNotes = (source.sitePages?.[siteId]?.[pageKey] as { notes?: Record<string, string> } | undefined)?.notes ?? {};
  const notes: Record<string, string> = {};
  for (const [section, runtimeId] of Object.entries(sections)) {
    const key = siteNotes[section] ?? page?.sections?.[section]?.note;
    if (!key) continue;
    if (typeof content[key] !== "string") throw new Error(`Section note ${key} for ${pageKey}/${section} is not in the requirements content`);
    notes[runtimeId] = content[key] as string;
  }
  return notes;
}

/**
 * Swap a surface's field definitions for the mapped requirements when the
 * site loads from JSON. The surface still decides which fields exist and their
 * order; `followUps` places mapped fields the surface lacks after a parent.
 */
export function withRequirementFields(
  surfaceFields: FieldDefinition[],
  mapping: RequirementMapping,
  siteId: string,
  { followUps = {}, person = "self" }: { followUps?: Record<string, string[]>; person?: RequirementPerson } = {},
): FieldDefinition[] {
  if (!siteUsesRequirementFields(siteId)) return surfaceFields;
  const resolved = new Map(resolveMappedFields(mapping, { siteId, person }).map(field => [field.id, field]));
  const followUpIds = new Set(Object.values(followUps).flat());
  for (const id of followUpIds) if (!resolved.has(id)) throw new Error(`Follow-up ${id} is not mapped to ${mappingName(mapping)}`);
  const fields = surfaceFields.filter(field => !followUpIds.has(field.id)).flatMap(field => {
    const definition = resolved.get(field.id);
    if (definition && definition.inputType !== field.inputType) throw new Error(`${field.id} is a ${definition.inputType} in the requirements but the surface renders a ${field.inputType}`);
    const merged = definition && !definition.options && field.options ? { ...definition, options: field.options } : definition;
    return [merged ?? field, ...(followUps[field.id] ?? []).map(id => resolved.get(id)!)];
  });
  for (const [parent, ids] of Object.entries(followUps)) if (!surfaceFields.some(field => field.id === parent)) fields.push(...ids.map(id => resolved.get(id)!));
  return fields;
}

/** Definitions for generated product controls; only the answer binding and policy options vary. */
export function requirementCoverageControl(id: string, applicant: "member" | "spouse" | "child" = "member") {
  const person = applicant === "member" ? "self" : applicant;
  const definition = resolveMappedFields({ page: "coverage" }, { person }).find(field => field.id === id);
  if (!definition) throw new Error(`Unmapped Coverage control: ${id}/${person}`);
  return definition;
}
