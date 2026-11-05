import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { currentMcrSource } from "./currentMcr";

export const isitrustSpouseNoticeReviewKey = "source-review.isitrust.spouse-election-notice";
export function applyIsitrustSpouseNoticeAdoption(db: DatabaseSchema) {
  const authority = "Attestation Online and PDF!C86; source-backed adoption October 21, 2026";
  const source = String(currentMcrSource.cells.find(row => row.sheet === "Attestation Online and PDF" && row.cell === "C86")?.value ?? "");
  const text = "If your Spouse is also a member of a participating association, they may apply as a Spouse or Member but not both.";
  if (!source.includes("No attestation question") || !source.includes(text)) throw new Error("ISITRUST spouse notice source changed");
  const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, authority) });
  const contentKey = "pages.eligibility.sectionNotes.spouseSection";
  if (!db.contentEntries.some(row => row.key === contentKey)) db.contentEntries.push({ ...meta("contentEntries", contentKey), position: 0, definition: { path: ["pages", "eligibility", "sectionNotes", "spouseSection"] } });
  const field = { ...meta("siteFieldConfigurations", "site:isitrust.eligibility.spouse-membership.exclude"), position: 30000, scope: "site" as const, siteKey: "isitrust", clientKey: null, pageKey: "eligibility", fieldKey: "spouse-membership", include: false, hidden: true, values: {} };
  const content = { ...meta("contentValues", `site:isitrust.${contentKey}`), position: 0, scope: "site" as const, siteKey: "isitrust", clientKey: null, contentKey, value: text };
  for (const [table, record] of [["siteFieldConfigurations", field], ["contentValues", content]] as const) {
    const rows = db[table] as Array<{ key: string }>; const index = rows.findIndex(row => row.key === record.key);
    if (index < 0) rows.push(record); else rows[index] = record;
  }
  const key = isitrustSpouseNoticeReviewKey;
  const row = { ...meta("semanticRequirements", key), domain: "reviewed-source-instruction", subjectTable: "sites", subjectKey: "isitrust", predicate: "spouse-election-notice", status: "documented", value: {
    authority, sourceReconciliation: "source-adopted", runtimeActivation: "reviewed-seed", sourceReferences: ["Attestation Online and PDF!C86"],
    owners: [{ table: "siteFieldConfigurations", key: field.key, reviewedValue: structuredClone(field) }, { table: "contentValues", key: content.key, reviewedValue: structuredClone(content) }],
    interpretation: "For current ISITRUST, including ATPE, omit spouse-membership attestation and show the source blue informational notice only in the visible spouse Eligibility section. This notice adds no cross-application enrollment enforcement. Other Sites retain their own attestation assignments.",
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(record => record.key === key); if (index < 0) db.semanticRequirements.push(row); else db.semanticRequirements[index] = row;
}
