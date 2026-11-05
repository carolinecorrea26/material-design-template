import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";

export const standardizedPlacementDecisionKey = "business-decision.rules-review.standardized-shared-field-placement";
export function recordStandardizedPlacementDecision(db: DatabaseSchema) {
  const key = standardizedPlacementDecisionKey;
  const record = { id: key, key, ...libraryMetadata("semanticRequirements", key, "User clarification October 20, 2026: shared field placement/pages standardized across clients; only unique fields need placement decisions"), domain: "approved-business-decision", subjectTable: "pages", subjectKey: "membership", predicate: "standardized-shared-field-placement", status: "documented", value: {
    approvalStatus: "approved", authority: "User clarification October 20, 2026", sourceReconciliation: "approved-new-template-interpretation", runtimeActivation: "existing-template",
    selected: { abeEmailPage: "membership", sharedPlacement: "Current new-template shared fields and pages", uniqueFields: "Define explicit placement for client-specific collection" },
    sourceReferences: ["Main!R39:R49", "User clarification October 20, 2026"],
    interpretation: "Required ABE email stays on Membership and its answer carries through the application. Do not duplicate shared fields on legacy pages merely because the workbook names a former location. Preserve each field's substantive collection/eligibility requirement and evaluate unique client fields separately.",
    destinations: db.pageFields.filter(row => row.pageKey === "membership" && ["first-name", "last-name", "email", "phone"].includes(row.fieldKey)).map(row => ({ table: "pageFields", key: row.key })),
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(row => row.key === key);
  if (index < 0) db.semanticRequirements.push(record); else db.semanticRequirements[index] = record;
}
