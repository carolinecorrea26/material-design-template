import fieldIds from "../../requirements/global/fields.json";
import fieldDetails from "../../requirements/parked/field-details.json";
import optionLists from "../../requirements/global/option-lists.json";
import type { FieldDefinition, FieldInputType, FieldOption } from "./fields";

/** A page or component mapping under requirements/mappings. */
export type RequirementMapping = { component: string } | { page: string };
export type RequirementPerson = "self" | "spouse" | "child";
export type RequirementFieldSource = {
  fieldIds: unknown;
  fieldDetails: unknown;
  optionLists: unknown;
  mappings: unknown[];
  sites: Record<string, unknown>;
};

const jsonModules = (modules: Record<string, unknown>) => Object.values(modules).map(module => (module as { default?: unknown }).default ?? module);
const defaultSource = (): RequirementFieldSource => ({
  fieldIds,
  fieldDetails,
  optionLists,
  mappings: [
    ...jsonModules(import.meta.glob("../../requirements/mappings/components/*.json", { eager: true })),
    ...jsonModules(import.meta.glob("../../requirements/mappings/page-fields/*.json", { eager: true })),
  ],
  sites: Object.fromEntries(Object.entries(import.meta.glob("../../requirements/parked/sites/*/fields.json", { eager: true }))
    .map(([path, module]) => [path.split("/").at(-2)!, (module as { default?: unknown }).default ?? module])),
});

const inputTypes = new Set<FieldInputType>(["text", "number", "date", "radio", "dropdown", "searchable-select", "checkbox", "checkbox-group", "multi-select", "percent"]);
const optionTypes = new Set<FieldInputType>(["radio", "dropdown", "searchable-select", "checkbox-group", "multi-select"]);
const formats = new Set(["email", "phone", "ssn", "currency", "percent", "month-year"]);
const inputModes = new Set(["text", "email", "tel", "numeric", "decimal"]);
const supportedKeys = new Set(["id", "name", "type", "label", "required", "people", "options", "format", "inputMode", "placeholder", "helperText", "autoComplete", "allowDecimal", "multiline", "configurations"]);
const configurationKeys = new Set(["default", "type", "label", "options", "placeholder"]);
const overrideKeys = new Set(["configuration", "label", "required", "options"]);

const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const mappingName = (mapping: RequirementMapping) => "component" in mapping ? `component ${mapping.component}` : `page ${mapping.page}`;

function resolveOptions(id: string, value: unknown, lists: Record<string, unknown>): FieldOption[] {
  const options = object(value) ? (typeof value.list === "string" ? lists[value.list] : undefined) : value;
  if (!Array.isArray(options) || !options.length) throw new Error(`Invalid field options: ${id}`);
  const resolved = options.map((option: unknown) => {
    if (!object(option) || !text(option.value) || !text(option.label)) throw new Error(`Invalid field options: ${id}`);
    return { value: option.value, label: option.label };
  });
  if (new Set(resolved.map(option => option.value)).size !== resolved.length) throw new Error(`Duplicate field option: ${id}`);
  return resolved;
}

// Labels, required and helper text may vary by page, by person, or both; the most specific key wins.
const pick = (value: unknown, keys: string[]) => object(value) ? keys.map(key => value[key]).find(entry => entry !== undefined) : value;

/** Sites with a requirements/parked/sites/<site> folder load their fields from the requirements JSON. */
export function siteUsesRequirementFields(siteId: string, source: RequirementFieldSource = defaultSource()): boolean {
  return Object.hasOwn(source.sites, siteId);
}

/**
 * Resolve every field a page or component mapping lists for one person:
 * global definition + field details + option lists, then the site's overrides.
 */
export function resolveMappedFields(
  mapping: RequirementMapping,
  { siteId, person = "self", source = defaultSource() }: { siteId?: string; person?: RequirementPerson; source?: RequirementFieldSource } = {},
): FieldDefinition[] {
  if (!object(source.fieldIds) || !Array.isArray(source.fieldIds.fields) ||
      !object(source.fieldDetails) || !Array.isArray(source.fieldDetails.fields) || !object(source.optionLists)) throw new Error("Invalid field requirements");
  const matches = source.mappings.filter(entry => object(entry) && ("component" in mapping ? entry.component === mapping.component : entry.page === mapping.page));
  if (matches.length !== 1 || !object(matches[0]) || !Array.isArray(matches[0].fields)) throw new Error(`Missing or ambiguous field mapping: ${mappingName(mapping)}`);
  const siteFile = siteId === undefined ? undefined : source.sites[siteId];
  if (siteFile !== undefined && (!object(siteFile) || (siteFile.fields !== undefined && !object(siteFile.fields)))) throw new Error(`Invalid site field overrides: ${siteId}`);
  const overrides = (object(siteFile) && object(siteFile.fields) ? siteFile.fields : {}) as Record<string, unknown>;
  const registered = source.fieldIds.fields as unknown[];
  const details = source.fieldDetails.fields as unknown[];
  const lists = source.optionLists;
  const rows = matches[0].fields as unknown[];
  const keys = "page" in mapping ? [mapping.page, person, "default"] : [person, "default"];
  if (new Set(rows.map(row => object(row) ? row.field : undefined)).size !== rows.length) throw new Error(`Duplicate field in ${mappingName(mapping)}`);

  return rows.flatMap(row => {
    if (!object(row) || !text(row.field) || !Array.isArray(row.people)) throw new Error(`Invalid field mapping row in ${mappingName(mapping)}`);
    if (!row.people.includes(person)) return [];
    const id = row.field;
    const listed = registered.filter(entry => object(entry) && entry.id === id);
    const found = details.filter(entry => object(entry) && entry.id === id);
    if (listed.length !== 1 || found.length !== 1 || !object(found[0])) throw new Error(`Missing or ambiguous field requirement: ${id}`);
    const unsupported = Object.keys(found[0]).filter(key => !supportedKeys.has(key));
    if (unsupported.length) throw new Error(`Unsupported field properties for ${id}: ${unsupported.join(", ")}`);
    const override = overrides[id];
    if (override !== undefined && (!object(override) || Object.keys(override).some(key => !overrideKeys.has(key)))) throw new Error(`Invalid site override: ${siteId}/${id}`);

    let field: Record<string, unknown> = found[0];
    if (field.configurations !== undefined) {
      if (!object(field.configurations)) throw new Error(`Invalid field configurations: ${id}`);
      const configurations = field.configurations;
      const key = object(override) && override.configuration !== undefined
        ? override.configuration
        : Object.keys(configurations).find(name => object(configurations[name]) && configurations[name].default === true);
      const configuration = typeof key === "string" ? configurations[key] : undefined;
      if (!object(configuration) || Object.keys(configuration).some(name => !configurationKeys.has(name))) throw new Error(`Unknown configuration for ${id}: ${String(key)}`);
      const chosen: Record<string, unknown> = { ...field, ...configuration };
      delete chosen.configurations;
      delete chosen.default;
      field = chosen;
    } else if (object(override) && override.configuration !== undefined) throw new Error(`Unknown configuration for ${id}: ${String(override.configuration)}`);
    if (object(override)) {
      if (override.label !== undefined) field = { ...field, label: object(override.label) && object(field.label) ? { ...field.label, ...override.label } : override.label };
      if (override.required !== undefined) field = { ...field, required: override.required };
    }

    const inputType = field.type as FieldInputType;
    const label = pick(field.label, keys), required = pick(field.required, keys), helperText = pick(field.helperText, keys);
    if (!inputTypes.has(inputType) || !text(label) || (required !== undefined && typeof required !== "boolean") ||
        (field.helperText !== undefined && !object(field.helperText) && !text(field.helperText)) || (helperText !== undefined && !text(helperText)) ||
        (field.people !== undefined && (!Array.isArray(field.people) || !field.people.includes(person))) ||
        (field.name !== undefined && !text(field.name)) ||
        (field.format !== undefined && !formats.has(String(field.format))) ||
        (field.inputMode !== undefined && !inputModes.has(String(field.inputMode))) ||
        (field.allowDecimal !== undefined && typeof field.allowDecimal !== "boolean") ||
        (field.multiline !== undefined && typeof field.multiline !== "boolean") ||
        ["placeholder", "autoComplete"].some(key => field[key] !== undefined && !text(field[key]))) {
      throw new Error(`Invalid field requirement: ${id}`);
    }
    const definition: FieldDefinition = { id, label, inputType };
    if (typeof required === "boolean") definition.required = required;
    if (text(field.name)) definition.displayName = field.name;
    if (field.format !== undefined) definition.format = field.format as FieldDefinition["format"];
    if (field.inputMode !== undefined) definition.inputMode = field.inputMode as FieldDefinition["inputMode"];
    if (typeof field.allowDecimal === "boolean") definition.allowDecimal = field.allowDecimal;
    if (typeof field.multiline === "boolean") definition.multiline = field.multiline;
    if (text(field.placeholder)) definition.placeholder = field.placeholder;
    if (text(helperText)) definition.helperText = helperText;
    if (text(field.autoComplete)) definition.autoComplete = field.autoComplete;

    const needsOptions = optionTypes.has(inputType);
    if (needsOptions !== (field.options !== undefined)) throw new Error(`Invalid field options: ${id}`);
    // A plain string names a runtime source (for example product amounts); the page supplies those options.
    if (needsOptions && typeof field.options !== "string") {
      let options = resolveOptions(id, field.options, lists);
      if (object(override) && override.options !== undefined) {
        const allowed = override.options;
        if (!Array.isArray(allowed) || !allowed.length || allowed.some(value => !options.some(option => option.value === value))) throw new Error(`Invalid site option override: ${siteId}/${id}`);
        options = options.filter(option => allowed.includes(option.value));
      }
      definition.options = options;
    } else if (object(override) && override.options !== undefined) throw new Error(`Invalid site option override: ${siteId}/${id}`);
    return [definition];
  });
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
