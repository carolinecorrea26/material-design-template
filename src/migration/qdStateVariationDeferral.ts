import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
export const qdStateVariationDeferralKey = "business-decision.rules-review.qd-state-variation-document-deferral";
export function recordQdStateVariationDeferral(db: DatabaseSchema) {
  const key = qdStateVariationDeferralKey;
  const row = { id: key, key, ...libraryMetadata("semanticRequirements", key, "User decision October 20, 2026: flag unavailable QD variation document as nonblocking; retain current behavior"), domain: "approved-business-decision", subjectTable: "questionSets", subjectKey: "mcr.health-questions", predicate: "qd-source-document-deferral", status: "documented", value: {
    approvalStatus: "approved", authority: "User decision October 20, 2026", sourceReconciliation: "deferred-by-user", completionBlocking: false,
    sourceReferences: ["Health Questions!A4", "Health Questions!B4"], selected: "Retain current state-specific behavior; do not infer unavailable document content",
    terminology: { formCode: "GMA-JI-L", meaning: "Quick Decision health questionnaire", authority: "User clarification October 21, 2026", scope: "Form identity only; no missing-full-Life-form deferral or new questionnaire routing is approved by this clarification" },
    missingArtifact: "Jet Issue State Variations Updated Sep,2018.docx", revisitTrigger: "User provides the linked QD state variation document or a replacement authoritative source",
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(other => other.key === key);
  if (index < 0) db.semanticRequirements.push(row); else db.semanticRequirements[index] = row;
}
