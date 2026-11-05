import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { currentMcrSource } from "./currentMcr";

export const profileReplacementNoticeKey = "business-decision.rules-review.ny-life-replacement-notice";
export function applyProfileReplacementNoticeAdoption(db: DatabaseSchema) {
  const authority = "User decision October 20, 2026; Legal Disclosures!A14:D14: Profile Other Coverage, NY Life replacement Yes only";
  const text = String(currentMcrSource.cells.find(row => row.sheet === "Legal Disclosures" && row.cell === "A14")?.value ?? "").trim();
  if (!text.startsWith("It may not be in your best interest")) throw new Error("NY replacement source changed");
  const configurationKey = "shared.profile.lifeReplacementNotice";
  const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, authority) });
  const definition = { ...meta("configurationDefinitions", configurationKey), position: 0, definition: { path: ["applicantExperience", "profile", "lifeReplacementNotice"], metadata: { reusable: true, sourceReferences: ["Legal Disclosures!A14:D14"] }, target: null } };
  const value = { ...meta("configurationValues", `global:${configurationKey}`), position: 0, scope: "global" as const, siteKey: null, clientKey: null, configurationKey, value: { jurisdictions: ["NY"], text, fontSizePt: 12, bold: true } };
  const upsert = <T extends { key: string }>(rows: T[], row: T) => { const index = rows.findIndex(item => item.key === row.key); if (index < 0) rows.push(row); else rows[index] = row; };
  upsert(db.configurationDefinitions, definition); upsert(db.configurationValues, value);
  const key = profileReplacementNoticeKey;
  upsert(db.semanticRequirements, { ...meta("semanticRequirements", key), domain: "approved-business-decision", subjectTable: "pages", subjectKey: "profile", predicate: "ny-life-replacement-notice", status: "documented", value: {
    authority, approvalStatus: "approved", sourceReconciliation: "approved-new-template-interpretation", runtimeActivation: "reviewed-seed", sourceReferences: ["Legal Disclosures!A14", "Legal Disclosures!B14", "Legal Disclosures!C14", "Legal Disclosures!D14"],
    selected: "Show the 12-point bold source notice within each active adult's Profile Other Coverage section only for NY, selected positive Life coverage, other-Life Yes and replacement Yes. Hidden or stale answers do not activate it. ABE Review is unchanged.",
    owners: [{ table: "configurationValues", key: value.key, column: "value", reviewedValue: value.value }], destinations: [{ table: "configurationValues", key: value.key, column: "value" }],
  } as unknown as Json });
}
