import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
export const importantNoticeDeferralKey = "business-decision.rules-review.important-notice-viewer-deferral";
export function recordImportantNoticeDeferral(db: DatabaseSchema) {
  const key = importantNoticeDeferralKey, authority = "User decision October 20, 2026: defer the IMPORTANT NOTICE viewer as nonblocking; retain source text and current Review behavior";
  const row = { id: key, key, ...libraryMetadata("semanticRequirements", key, authority), domain: "approved-business-decision", subjectTable: "pages", subjectKey: "review", predicate: "important-notice-viewer-deferral", status: "documented", value: {
    authority, approvalStatus: "approved", sourceReconciliation: "deferred-by-user", completionBlocking: false,
    sourceReferences: ["Read & Sign!B40", ...[142, 144, 146, 148, 150, 152, 154, 156, 158, 160, 162, 187].map(row => `Read & Sign!B${row}`)],
    selected: "Retain current Review; flag the missing notice viewer and its standard, New Mexico and Virginia source variants for later. Consent references do not imply that a viewer is implemented.",
    revisitTrigger: "User authorizes implementing the notice viewer and its approved presentation/applicability", preserved: "ABE accepted Review behavior and all separately approved authorization/consent guards",
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(row => row.key === key);
  if (index < 0) db.semanticRequirements.push(row); else db.semanticRequirements[index] = row;
}
