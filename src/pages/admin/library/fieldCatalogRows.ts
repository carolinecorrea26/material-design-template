import type { LibraryCatalog } from "../../../services/libraryCatalogService";
import type { FieldDefinition, FieldOption } from "../../../domain/fields";
import { fieldSurfaceRows, type FieldSurfaceRow } from "./fieldSurfaceRows";

/** Catalog attributes exclude placement, validation and visibility behavior. */
export function fieldCatalogDefinition(field: FieldDefinition) {
  return { id: field.id, displayName: field.displayName, defaultValue: field.defaultValue, label: field.label, inputType: field.inputType,
    format: field.format, options: field.options, labelVariant: field.labelVariant,
    multiline: field.multiline, showPhoneTypeSelector: field.showPhoneTypeSelector,
    inputMode: field.inputMode, helperText: field.helperText, allowDecimal: field.allowDecimal };
}

/** One saved definition per ID. Generated controls retain their definition
 * reference in usage; product/applicant instance IDs never become field rows. */
export function fieldCatalogRows(catalog: LibraryCatalog, siteKey: string, usages = fieldSurfaceRows(catalog, siteKey)) {
  const byDefinition = new Map<string, FieldSurfaceRow[]>();
  for (const usage of usages) if (usage.definitionKey) {
    const group = byDefinition.get(usage.definitionKey) ?? [];
    group.push(usage);
    byDefinition.set(usage.definitionKey, group);
  }
  return catalog.data.fields.filter(row => siteKey === "all" || byDefinition.has(row.key)).map(row => {
    const definitions = (byDefinition.get(row.key) ?? []).map(usage => fieldCatalogDefinition({ ...usage.field, id: row.key }));
    const effective = definitions[0];
    // Site-wide presentation overrides can be shown directly. Differences
    // between placements remain in usage rather than being conflated.
    const consistent = definitions.every(definition => JSON.stringify(definition) === JSON.stringify(effective));
    const field = siteKey !== "all" && effective && consistent ? effective : fieldCatalogDefinition(row.definition);
    return { id: row.id, key: row.key, field };
  });
}

/** Human-readable identifiers stay independent of client-editable input labels. */
export function fieldDisplayName(key: string, catalog: LibraryCatalog) {
  return catalog.data.fields.find(field => field.key === key)?.definition.displayName ?? key;
}

export function fieldInputType(field: Pick<FieldDefinition, "inputType" | "multiline">) {
  if (field.multiline) return "Textarea";
  const names = { text: "Text", number: "Number", date: "Date", radio: "Radio", dropdown: "Select",
    "searchable-select": "Searchable select", checkbox: "Checkbox", "checkbox-group": "Checkbox group",
    "multi-select": "Multi-select", percent: "Percent" };
  return names[field.inputType];
}

export function fieldKeyboard(field: FieldDefinition) {
  if (!["text", "number", "date", "percent"].includes(field.inputType)) return "—";
  if (field.allowDecimal || field.inputMode === "decimal") return "Decimal";
  if (field.inputMode === "email" || field.format === "email") return "Email";
  if (field.inputMode === "tel" || field.format === "phone" || field.inputMode === "numeric"
    || ["number", "date", "percent"].includes(field.inputType) || ["ssn", "currency", "percent", "month-year"].includes(field.format ?? "")) return "Number";
  return "Alphanumeric";
}

/** Only defaults authored on the effective definition are documented. */
export function fieldDefaultOption(key: string, usages: FieldSurfaceRow[]) {
  const fields = usages.filter(usage => usage.definitionKey === key).map(usage => usage.field);
  if (!fields.length || !fields.every(field => JSON.stringify(field.defaultValue) === JSON.stringify(fields[0].defaultValue))) return "—";
  return fieldDefaultValue(fields[0]);
}

export function fieldDefaultValue(field: Pick<FieldDefinition, "defaultValue" | "options">) {
  const value = field.defaultValue;
  if (value === undefined) return "—";
  const label = (value: string | boolean) => field.options?.find(option => option.value === String(value))?.label ?? String(value);
  return Array.isArray(value) ? value.map(label).join("; ") : label(value);
}

export function fieldComponentName(field: FieldDefinition) {
  const type = fieldInputType(field);
  return `${type} field`;
}

export function fieldOptionText(option: FieldOption) {
  return option.label.toLowerCase() === option.value.toLowerCase() ? option.label : `${option.label} (${option.value})`;
}

export function fieldOptions(field: Pick<FieldDefinition, "options">) {
  return field.options?.map(fieldOptionText).join("; ") || "—";
}

export function fieldCatalogMarkdown(rows: ReturnType<typeof fieldCatalogRows>) {
  const cell = (value: string) => value.replaceAll("|", "\\|").replace(/\r?\n/g, "<br>");
  return ["| ID | Label | Input type | Format | Options |", "| --- | --- | --- | --- | --- |",
    ...rows.map(row => `| \`${row.key}\` | ${cell(row.field.label)} | ${row.field.inputType} | ${row.field.format ?? "—"} | ${cell(fieldOptions(row.field))} |`)].join("\n");
}

export function fieldUsageMarkdown(usages: FieldSurfaceRow[]) {
  const groups = new Map<string, { page: string; section: string; fields: Set<string> }>();
  for (const usage of usages) for (const page of usage.pages) {
    const identity = `${page}:${usage.surface}`;
    const group = groups.get(identity) ?? { page, section: usage.surface, fields: new Set<string>() };
    group.fields.add(usage.definitionKey ? `\`${usage.definitionKey}\`` : `${usage.field.label} (product control)`);
    groups.set(identity, group);
  }
  return ["| Page | Section or tool | Field references |", "| --- | --- | --- |",
    ...[...groups.values()].map(group => `| \`${group.page}\` | ${group.section.replaceAll("|", "\\|")} | ${[...group.fields].join("; ")} |`)].join("\n");
}
