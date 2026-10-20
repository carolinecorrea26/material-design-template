import type { DatabaseSchema } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { resolveFieldDefinitionOwnership } from "../domain/fieldDefinitionOwnership";

/** Global control type and format belong to fields. Required constraints keep
 * their existing validation owner in this batch; scoped differences stay scoped. */
export function consolidateFieldDefinitionOwnership(db: DatabaseSchema) {
  if (resolveFieldDefinitionOwnership(db) !== "legacy") return;
  const written = new Set<string>();
  for (const rule of db.validationRules) {
    const field = db.fields.find(row => row.key === rule.fieldKey);
    if (!field) throw new Error(`Missing validation field: ${rule.fieldKey}`);
    for (const property of Object.keys(rule.definition)) {
      const identity = `${rule.fieldKey}/${property}`;
      if (written.has(identity)) throw new Error(`Ambiguous field validation: ${identity}`);
      written.add(identity);
    }
    for (const property of ["inputType", "format"] as const) if (Object.hasOwn(rule.definition, property) && rule.definition[property] !== field.definition[property]) throw new Error(`Unreconciled field property: ${rule.fieldKey}/${property}`);
  }
  const key = "ownership.shared-field-definitions";
  const evidence = `ownership-evidence.shared-field-definitions`;
  const authority = "Shared field control/format ownership, October 19, 2026";
  const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, authority) });
  db.semanticRequirements.push({ ...meta("semanticRequirements", evidence), domain: "information-ownership", subjectTable: "configurationDefinitions", subjectKey: key,
    predicate: "shared-field-control-format", status: "documented", value: { authority, previousValidationRules: JSON.parse(JSON.stringify(db.validationRules)),
      disposition: "fields owns inputType and format; required constraints retain existing validation precedence. Page/surface/collection overrides remain scoped." } });
  for (const rule of db.validationRules) { delete rule.definition.inputType; delete rule.definition.format; }
  db.configurationDefinitions.push({ ...meta("configurationDefinitions", key), position: 0, definition: { path: null, metadata: { authority }, target: { kind: "field-definition-ownership" } } });
  db.configurationValues.push({ ...meta("configurationValues", key), position: 0, configurationKey: key, scope: "global", siteKey: null, clientKey: null, value: { version: 2, source: "fields" } });
}
