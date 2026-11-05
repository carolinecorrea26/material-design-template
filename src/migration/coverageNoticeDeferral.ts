import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
export const coverageNoticeDeferralKey = "business-decision.rules-review.coverage-hi-ci-notice-deferral";
export function recordCoverageNoticeDeferral(db: DatabaseSchema) {
  const key = coverageNoticeDeferralKey, authority = "User decision October 21, 2026: flag missing Coverage HI/CI notice copy and Site/product assignments as nonblocking";
  const row = { id: key, key, ...libraryMetadata("semanticRequirements", key, authority), domain: "approved-business-decision", subjectTable: "pages", subjectKey: "coverage", predicate: "coverage-notice-deferral", status: "documented", value: {
    authority, approvalStatus: "approved", sourceReconciliation: "deferred-by-user", completionBlocking: false, sourceReferences: ["Legal Disclosures!A16", "Legal Disclosures!B16", "Legal Disclosures!C16", "Legal Disclosures!D16"],
    selected: "Retain current Coverage and separately adopted source-backed Review attestation. Flag the missing Coverage HI/CI notice wording and its applicable Site/product assignments; source specifies 14-point display but supplies no copy.",
    revisitTrigger: "User provides approved notice wording and applicable Site/product assignments", preserved: "Current Review attestation and ABE accepted Review",
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(row => row.key === key); if (index < 0) db.semanticRequirements.push(row); else db.semanticRequirements[index] = row;
}
