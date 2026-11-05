import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { currentMcrSource } from "./currentMcr";
export const abeFirmSizeDecisionKey = "business-decision.rules-review.abe-firm-member-count";
export function applyAbeFirmSizeAdoption(db: DatabaseSchema) {
  const authority = "Main!R48; user decision October 21, 2026: collect firm-member count on Coverage for ABE Professional Overhead and require 1–5";
  if (!String(currentMcrSource.cells.find(row => row.sheet === "Main" && row.cell === "R48")?.value).includes("5 or fewer members of the firm")) throw new Error("ABE firm-size source changed");
  const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, authority) });
  const fieldKey = "firm-member-count", definitionKey = "shared.oo-professional.firm-member-eligibility", key = "abe.oo-professional.firm-member-eligibility";
  const field = { ...meta("fields", fieldKey), position: 30010, definition: { id: fieldKey, label: "How many members are in your firm?", inputType: "number" as const, required: true, inputMode: "numeric" as const, helperText: "Professional Overhead coverage is available to firms with 1–5 members." } };
  const assignment = { ...meta("siteFieldConfigurations", `site:abe.coverage.${fieldKey}.include`), position: 30010, scope: "site" as const, siteKey: "abe", clientKey: null, pageKey: "coverage", fieldKey, include: true, hidden: false, values: {} };
  const definition = { ...meta("configurationDefinitions", definitionKey), position: 0, definition: { path: null, metadata: { reusable: true, assignmentRequired: true }, target: { kind: "product-eligibility-facts" as const, productKey: "oo-professional", applicantKey: "member" } } };
  const value = { ...meta("configurationValues", key), position: 0, scope: "site" as const, siteKey: "abe", clientKey: null, configurationKey: definitionKey, value: [{ fact: "firmMemberCount", minimum: 1, maximum: 5, integer: true }] as unknown as Json };
  for (const [table, record] of [["fields", field], ["siteFieldConfigurations", assignment], ["configurationDefinitions", definition], ["configurationValues", value]] as const) {
    const rows = db[table] as Array<{ key: string }>; const index = rows.findIndex(row => row.key === record.key); if (index < 0) rows.push(record); else rows[index] = record;
  }
  const decisionKey = abeFirmSizeDecisionKey, decision = { ...meta("semanticRequirements", decisionKey), domain: "approved-business-decision", subjectTable: "sites", subjectKey: "abe", predicate: "firm-member-count-eligibility", status: "documented", value: {
    authority, approvalStatus: "approved", sourceReconciliation: "approved-new-template-interpretation", runtimeActivation: "reviewed-seed", scope: ["abe"], productKeys: ["oo-professional"], sourceReferences: ["Main!R48"],
    selected: { fieldKey, page: "coverage", minimum: 1, maximum: 5, integer: true, applicant: "member" },
    owners: [{ table: "fields", key: field.key, reviewedValue: structuredClone(field) }, { table: "siteFieldConfigurations", key: assignment.key, reviewedValue: structuredClone(assignment) }, { table: "configurationValues", key, reviewedValue: structuredClone(value) }],
    destinations: [{ table: "fields", key: field.key }, { table: "siteFieldConfigurations", key: assignment.key }, { table: "configurationValues", key, column: "value" }],
    interpretation: "Require a whole-number firm-member count of 1–5 only for selected ABE Professional Overhead. Missing/invalid evidence never establishes eligibility. Other products, employee count, the independent 30-hour work rule and ABE Review retain their separate owners.",
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(row => row.key === decisionKey); if (index < 0) db.semanticRequirements.push(decision); else db.semanticRequirements[index] = decision;
}
