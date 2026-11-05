import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { currentMcrSource } from "./currentMcr";
export const amaDependentCollectionReviewKey = "source-review.ama.dependent-collection";
export function applyAmaDependentCollectionAdoption(db: DatabaseSchema) {
  const authority = "Attestation Online and PDF!C3; source-backed dependent labels/role guard with standardized shared Eligibility placement";
  const text = String(currentMcrSource.cells.find(row => row.sheet === "Attestation Online and PDF" && row.cell === "C3")?.value ?? "");
  const label = "Spouse Coverage (Premier Accident or Hospital Income)";
  if (!text.includes(label) || !text.includes("Child Coverage") || !text.includes("About Physician")) throw new Error("AMA dependent source changed");
  const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, authority) });
  const field = db.fields.find(row => row.key === "dependents");
  if (!field?.definition.options) throw new Error("Missing shared dependent field");
  const conditionKey = "condition-membership-ama-valid-applicant";
  const condition = { ...meta("conditions", conditionKey), position: 30010, definition: { id: conditionKey, match: "all" as const, conditions: [{ fieldId: "membership", operator: "oneOf" as const, value: ["physician", "resident", "student", "retired", "spouse"] }] } };
  const assignment = { ...meta("siteFieldConfigurations", "site:ama.eligibility.dependents.source-presentation"), position: 30010, scope: "site" as const, siteKey: "ama", clientKey: null, pageKey: "eligibility", fieldKey: "dependents", include: null, hidden: null, values: { options: field.definition.options.map(option => option.value === "spouse" ? { ...option, label } : structuredClone(option)), visibilityConditionId: conditionKey } };
  for (const [table, row] of [["conditions", condition], ["siteFieldConfigurations", assignment]] as const) {
    const rows = db[table] as Array<{ key: string }>; const index = rows.findIndex(record => record.key === row.key); if (index < 0) rows.push(row); else rows[index] = row;
  }
  const owners = [
    { table: "fields", key: field.key, reviewedValue: structuredClone(field) },
    { table: "conditions", key: conditionKey, reviewedValue: structuredClone(condition) },
    { table: "siteFieldConfigurations", key: assignment.key, reviewedValue: structuredClone(assignment) },
    ...db.siteFieldConfigurations.filter(row => row.siteKey === "ama" && (row.fieldKey === "dependents" && row.key !== assignment.key || row.pageKey === "membership" && row.fieldKey.startsWith("ama-physician-"))).map(row => ({ table: "siteFieldConfigurations", key: row.key, reviewedValue: structuredClone(row) })),
    ...db.conditions.filter(row => row.key === "condition-membership-ama-spouse").map(row => ({ table: "conditions", key: row.key, reviewedValue: structuredClone(row) })),
    ...db.fields.filter(row => row.key.startsWith("ama-physician-")).map(row => ({ table: "fields", key: row.key, reviewedValue: structuredClone(row) })),
  ];
  const key = amaDependentCollectionReviewKey;
  const record = { ...meta("semanticRequirements", key), domain: "reviewed-source-instruction", subjectTable: "sites", subjectKey: "ama", predicate: "dependent-role-collection", status: "documented", value: {
    authority, sourceReconciliation: "source-adopted-with-standardized-placement", runtimeActivation: "reviewed-seed", sourceReferences: ["Attestation Online and PDF!C3"], owners,
    interpretation: "Use the source spouse coverage label and show the optional shared dependent question only for accepted AMA applicant types. Physician, Resident, Student and Retired Physician retain spouse/child choices; Spouse of Physician retains child only via the existing captured exclusion. Keep shared dependent collection on Eligibility and existing About Physician fields on Membership for spouse applicants. No redundant 'This insurance is for' question is added. Product/category eligibility, attached benefits, child-only restrictions and Step/Level choices retain separate owners.",
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(row => row.key === key); if (index < 0) db.semanticRequirements.push(record); else db.semanticRequirements[index] = record;
}
