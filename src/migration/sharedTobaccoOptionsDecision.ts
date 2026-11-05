import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { tobaccoProductOptions } from "../config/fields/tobaccoProductOptions";
import { currentMcrSource } from "./currentMcr";
import { activeSiteMigrationScope } from "./activeSiteScope";
export const sharedTobaccoOptionsDecisionKey = "business-decision.rules-review.shared-tobacco-product-options";
export function recordSharedTobaccoOptionsDecision(db: DatabaseSchema) {
  for (const cell of ["C5", "C20"]) {
    const text = String(currentMcrSource.cells.find(row => row.sheet === "Smoker Question" && row.cell === cell)?.value ?? "");
    const items = text.slice(text.lastIndexOf("selected_") + "selected_".length).trim().split(/\r?\n/).map(item => item.trim()).filter(Boolean);
    if (JSON.stringify(items) !== JSON.stringify(tobaccoProductOptions.map(option => option.label))) throw new Error(`Shared tobacco source changed: ${cell}`);
  }
  const fields = db.fields.filter(row => ["tobacco-products", "spouse-tobacco-products"].includes(row.key));
  if (fields.length !== 2 || fields.some(row => JSON.stringify(row.definition.options) !== JSON.stringify(tobaccoProductOptions))) throw new Error("Shared tobacco option owner changed");
  const key = sharedTobaccoOptionsDecisionKey;
  const record = { id: key, key, ...libraryMetadata("semanticRequirements", key, "User decision October 21, 2026: use the exact twelve source choices, remove Other, and standardize answers across Sites rather than adding an ABE override"), domain: "approved-business-decision", subjectTable: "fields", subjectKey: "tobacco-products", predicate: "standardized-tobacco-product-options", status: "documented", value: {
    authority: "User decisions October 21, 2026", approvalStatus: "approved", sourceReconciliation: "approved-shared-field-interpretation", runtimeActivation: "existing-template-and-reviewed-seed", scope: activeSiteMigrationScope.sites.map(site => site.key), sourceReferences: ["Smoker Question!C5", "Smoker Question!C20"],
    selected: { fieldKeys: fields.map(row => row.key), options: tobaccoProductOptions, assignmentScope: "global-shared-fields", abeSpecificOverride: false, legacyOther: "Preserve saved answer; current field validation requires a supported choice before proceeding", questionWordingAndApplicability: "unchanged" },
    owners: fields.map(row => ({ table: "fields", key: row.key, reviewedValue: structuredClone(row) })),
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(row => row.key === key); if (index < 0) db.semanticRequirements.push(record); else db.semanticRequirements[index] = record;
}
