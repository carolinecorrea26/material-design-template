import type { DatabaseSchema } from "../persistence/types";
import type { RuleProvenance } from "./effectiveSite";

type Data = Pick<DatabaseSchema, "configurationDefinitions" | "configurationValues" | "validationRules">;
export function resolveFieldDefinitionOwnership(data: Data) {
  const keys = new Set(data.configurationDefinitions.filter(row => row.definition.target?.kind === "field-definition-ownership").map(row => row.key));
  const rows = data.configurationValues.filter(row => keys.has(row.configurationKey));
  if (!rows.length) return "legacy" as const;
  const row = rows[0], value = row.value;
  if (rows.length !== 1 || row.scope !== "global" || row.siteKey !== null || row.clientKey !== null || value === null || typeof value !== "object" || Array.isArray(value)
    || (value.version !== 2 && value.version !== 3) || value.source !== "fields" || Object.keys(value).some(key => !["version", "source"].includes(key))) throw new Error("Invalid shared field definition ownership");
  for (const rule of data.validationRules) for (const property of ["inputType", "format", ...(value.version === 3 ? ["required"] : [])]) {
    if (Object.hasOwn(rule.definition, property)) throw new Error(`Field presentation property belongs to fields: ${rule.fieldKey}/${property}`);
  }
  return value.version === 3 ? "fields-required" as const : "fields" as const;
}

/** One merge contract for page inputs, quote/calculator surfaces and repeated
 * fields. Scoped property overrides apply afterward at their collection point. */
export function resolveSharedFieldDefinition(field: DatabaseSchema["fields"][number], rules: DatabaseSchema["validationRules"], ownership: "fields" | "fields-required" | "legacy") {
  const definition = { ...field.definition };
  const provenance: RuleProvenance[] = [{ table: "fields", key: field.key, sourceReference: field.sourceReference }];
  const written = new Set<string>();
  for (const rule of rules.filter(row => row.fieldKey === field.key).sort((a, b) => a.position - b.position || a.key.localeCompare(b.key))) {
    for (const property of Object.keys(rule.definition)) {
      if (ownership !== "legacy" && written.has(property)) throw new Error(`Ambiguous field validation: ${field.key}/${property}`);
      if (ownership !== "legacy" && ["inputType", "format", ...(ownership === "fields-required" ? ["required"] : [])].includes(property)) throw new Error(`Field presentation property belongs to fields: ${field.key}/${property}`);
      written.add(property);
    }
    Object.assign(definition, rule.definition);
    provenance.push({ table: "validationRules", key: rule.key, sourceReference: rule.sourceReference });
  }
  return { definition, provenance };
}
