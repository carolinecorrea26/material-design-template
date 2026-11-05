import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { currentMcrSource } from "./currentMcr";

export const nsoNurseTypeReviewKey = "review.rules-review.nso-nurse-type";
const reference = "Attestation Online and PDF!D98; source-backed current-template adoption October 20, 2026";
const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, reference) });

export function applyNsoNurseTypeAdoption(db: DatabaseSchema) {
  const source = String(currentMcrSource.cells.find(cell => cell.sheet === "Attestation Online and PDF" && cell.cell === "D98")?.value ?? "");
  if (!["Nurse Type:", "RN", "LPN", "Other Nurse Professional Type"].every(text => source.includes(text))) throw new Error("NSO nurse-type source changed");
  const fieldKey = "nurse-type", conditionKey = "condition-membership-confirmed";
  const condition = { ...meta("conditions", conditionKey), position: 30000, definition: { id: conditionKey, conditions: [{ fieldId: "membership" as const, operator: "equals" as const, value: "yes" }], match: "all" as const } };
  const field = { ...meta("fields", fieldKey), position: 30000, definition: { id: fieldKey, label: "Nurse Type", inputType: "dropdown" as const, required: true, visibilityConditionId: conditionKey,
    options: [{ value: "rn", label: "RN" }, { value: "lpn", label: "LPN" }, { value: "other-nurse-professional", label: "Other Nurse Professional Type" }] } };
  const assignment = { ...meta("siteFieldConfigurations", "site:nso.membership.nurse-type.include"), position: 30000, scope: "site" as const, siteKey: "nso", clientKey: null, pageKey: "membership", fieldKey, include: true, hidden: false, values: {} };
  for (const [table, record] of [["conditions", condition], ["fields", field], ["siteFieldConfigurations", assignment]] as const) {
    const rows = db[table] as Array<{ key: string }>;
    const index = rows.findIndex(row => row.key === record.key);
    if (index < 0) rows.push(record); else rows[index] = record;
  }
  const key = nsoNurseTypeReviewKey;
  const record = { ...meta("semanticRequirements", key), domain: "reviewed-site-adoption", subjectTable: "sites", subjectKey: "nso", predicate: "nurse-type-collection", status: "documented", value: {
    sourceReferences: ["Attestation Online and PDF!D98"], sourceReconciliation: "source-backed", runtimeActivation: "reviewed-seed",
    interpretation: "Collect the specified nurse type after the existing Yes membership gate. Required collection uses the template's normal required follow-up convention; the source supplies the three choices. Detailed PDF output remains deferred.",
    owners: [condition, field, assignment].map((row, index) => ({ table: ["conditions", "fields", "siteFieldConfigurations"][index], key: row.key, reviewedValue: row })),
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(row => row.key === key);
  if (index < 0) db.semanticRequirements.push(record); else db.semanticRequirements[index] = record;
}
