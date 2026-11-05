import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { currentMcrSource } from "./currentMcr";
export const waepaMemberReferenceReviewKey = "source-review.waepa.associate-member-middle-initial";
export function applyWaepaMemberReferenceAdoption(db: DatabaseSchema) {
  const authority = "Attestation Online and PDF!C122; source-backed current-template adoption October 21, 2026: optional associated member MI";
  const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, authority) });
  const source = String(currentMcrSource.cells.find(row => row.sheet === "Attestation Online and PDF" && row.cell === "C122")?.value ?? "");
  if (!source.includes("MI (optional)")) throw new Error("WAEPA member-reference source changed");
  const fieldKey = "waepa-member-middle-initial";
  const field = { ...meta("fields", fieldKey), position: 30006, definition: { id: fieldKey, label: "Middle initial", inputType: "text" as const, required: false, maxLength: 1 } };
  const assignment = { ...meta("siteFieldConfigurations", `site:waepa.membership.${fieldKey}.include`), position: 30006, scope: "site" as const, siteKey: "waepa", clientKey: null, pageKey: "membership", fieldKey, include: true, hidden: false, values: { visibilityConditionId: "condition-waepa-associated-member" } };
  for (const [table, record] of [["fields", field], ["siteFieldConfigurations", assignment]] as const) {
    const rows = db[table] as Array<{ key: string }>; const index = rows.findIndex(row => row.key === record.key); if (index < 0) rows.push(record); else rows[index] = record;
  }
  const key = waepaMemberReferenceReviewKey, row = { ...meta("semanticRequirements", key), domain: "reviewed-source-instruction", subjectTable: "sites", subjectKey: "waepa", predicate: "member-reference-middle-initial", status: "documented", value: {
    authority, sourceReconciliation: "source-adopted", runtimeActivation: "reviewed-seed", sourceReferences: ["Attestation Online and PDF!C122"],
    owners: [
      ...db.fields.filter(row => [fieldKey, "waepa-member-first-name", "waepa-member-last-name", "waepa-member-id"].includes(row.key)).map(row => ({ table: "fields", key: row.key, reviewedValue: structuredClone(row) })),
      ...db.siteFieldConfigurations.filter(row => row.siteKey === "waepa" && row.pageKey === "membership" && [fieldKey, "waepa-member-first-name", "waepa-member-last-name", "waepa-member-id"].includes(row.fieldKey)).map(row => ({ table: "siteFieldConfigurations", key: row.key, reviewedValue: structuredClone(row) })),
      ...db.conditions.filter(row => row.key === "condition-waepa-associated-member").map(row => ({ table: "conditions", key: row.key, reviewedValue: structuredClone(row) })),
    ],
    interpretation: "Collect required associated WAEPA member first/last names, optional membership number and optional middle initial between first/last names on Membership for the four approved Associate Member choices. Keep the reference person's answer separate from the applicant's own name. Current/former federal and current-member entry do not inherit this follow-up.",
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(row => row.key === key); if (index < 0) db.semanticRequirements.push(row); else db.semanticRequirements[index] = row;
}
