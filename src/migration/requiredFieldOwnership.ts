import type { DatabaseSchema } from "../persistence/types";
import { resolveFieldDefinitionOwnership } from "../domain/fieldDefinitionOwnership";
import { libraryMetadata } from "../domain/provenance";

/** Retire agreeing global required copies. Scoped requirements still apply at
 * their page, surface or collection placement; historical revisions stay intact. */
export function consolidateRequiredFieldOwnership(db: DatabaseSchema) {
  const ownership = resolveFieldDefinitionOwnership(db);
  if (ownership === "fields-required") return;
  if (ownership !== "fields") throw new Error("Consolidate field controls before required constraints");
  const rules = db.validationRules.filter(row => Object.hasOwn(row.definition, "required"));
  const seen = new Set<string>();
  for (const rule of rules) {
    if (seen.has(rule.fieldKey)) throw new Error(`Ambiguous required constraint: ${rule.fieldKey}`);
    seen.add(rule.fieldKey);
    const field = db.fields.find(row => row.key === rule.fieldKey);
    if (!field || typeof rule.definition.required !== "boolean" || field.definition.required !== rule.definition.required)
      throw new Error(`Unreconciled required constraint: ${rule.fieldKey}`);
  }
  const key = "ownership-evidence.shared-field-required";
  const authority = "Shared field required ownership, October 19, 2026";
  db.semanticRequirements.push({ id: key, key, ...libraryMetadata("semanticRequirements", key, authority), domain: "information-ownership",
    subjectTable: "configurationDefinitions", subjectKey: "ownership.shared-field-definitions", predicate: "shared-field-required", status: "documented",
    value: { authority, previousValidationRules: JSON.parse(JSON.stringify(rules)),
      disposition: "Every copied required value agrees with fields. fields owns the global default; explicit scoped page/surface/collection requirements retain precedence." } });
  for (const rule of rules) delete rule.definition.required;
  db.configurationValues.find(row => row.configurationKey === "ownership.shared-field-definitions")!.value = { version: 3, source: "fields" };
}
