import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";

export const avmaCollegeDecisionKey = "business-decision.rules-review.avma-college-list";
export function applyAvmaCollegeDecision(db: DatabaseSchema) {
  const key = avmaCollegeDecisionKey;
  const field = db.fields.find(row => row.key === "avma-vet-college");
  if (!field || field.definition.inputType !== "text" || !field.definition.required) throw new Error("AVMA approved college text owner changed");
  const record = { id: key, key, ...libraryMetadata("semanticRequirements", key, "Attestation Online and PDF!D38; user decision October 20, 2026"), domain: "approved-business-decision", subjectTable: "sites", subjectKey: "avma", predicate: "college-list-deferral", status: "documented", value: {
    approvalStatus: "approved", selected: { retainedInputType: "text", retainedRequired: true, dropdownList: "deferred-by-user", completionBlocking: false },
    authority: "User decision October 20, 2026: keep required text; defer the missing approved college dropdown list without blocking task completion",
    revisitTrigger: "User supplies the approved college list", sourceReferences: ["Attestation Online and PDF!D38"],
    destinations: [{ table: "fields", key: field.key, column: "definition" }],
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(row => row.key === key);
  if (index < 0) db.semanticRequirements.push(record); else db.semanticRequirements[index] = record;
}
