import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { currentMcrSource } from "./currentMcr";
export const amaProductOrderDecisionKey = "business-decision.rules-review.ama-product-order";
export const amaSourceProductOrder = ["li-20yr", "li-15yr", "li-10yr", "li-term", "li-preferred", "li-premier-accident", "di-step-rated", "di-level-rated", "oo-office-overhead", "sh-hospital-income"];
export function applyAmaProductOrderAdoption(db: DatabaseSchema) {
  const authority = "Order of Products Across Site!A25:A37; user decision October 21, 2026: AMA uses source product order; configured client order overrides the default; featured_prod prioritizes its product and category";
  const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, authority) });
  const expected = { A25: "AMA Products order", A27: "20-Year Level Term Life Insurance", A28: "15-Year Level Term Life Insurance", A29: "10-Year Level Term Life Insurance", A30: "Pure Term", A31: "Preferred Term", A32: "Accidental Death and Dismemberment Insurance", A34: "Disability Pro", A35: "Office Overhead", A37: "HIIP" };
  for (const [cell, text] of Object.entries(expected)) if (String(currentMcrSource.cells.find(row => row.sheet === "Order of Products Across Site" && row.cell === cell)?.value).trim() !== text) throw new Error(`AMA order source changed: ${cell}`);
  const definitionKey = "shared.coverages.productOrder", key = "site:ama.coverages.productOrder";
  const definition = { ...meta("configurationDefinitions", definitionKey), position: 0, definition: { path: ["coverages", "productOrder"], metadata: { reusable: true, assignmentRequired: true, purpose: "Optional product order within each category; URL featured product/category take precedence" }, target: null } };
  const value = { ...meta("configurationValues", key), position: 0, scope: "site" as const, siteKey: "ama", clientKey: null, configurationKey: definitionKey, value: [...amaSourceProductOrder] };
  const previous = db.configurationValues.find(row => row.key === key)?.configurationKey;
  for (const [table, record] of [["configurationDefinitions", definition], ["configurationValues", value]] as const) {
    const rows = db[table] as Array<{ key: string }>; const index = rows.findIndex(row => row.key === record.key); if (index < 0) rows.push(record); else rows[index] = record;
  }
  if (previous && previous !== definitionKey && !db.configurationValues.some(row => row.configurationKey === previous)) db.configurationDefinitions = db.configurationDefinitions.filter(row => row.key !== previous);
  const decisionKey = amaProductOrderDecisionKey, record = { ...meta("semanticRequirements", decisionKey), domain: "approved-business-decision", subjectTable: "sites", subjectKey: "ama", predicate: "configured-product-presentation-order", status: "documented", value: {
    authority, approvalStatus: "approved", sourceReconciliation: "approved-new-template-interpretation", runtimeActivation: "reviewed-seed", scope: ["ama"], selected: [...amaSourceProductOrder],
    sourceReferences: Object.keys(expected).map(cell => `Order of Products Across Site!${cell}`), owners: [{ table: "configurationDefinitions", key: definitionKey, reviewedValue: structuredClone(definition) }, { table: "configurationValues", key, reviewedValue: structuredClone(value) }], destinations: [{ table: "configurationValues", key, column: "value" }],
    interpretation: "AMA's source order is a native Site override. Disability Pro maps to the separately approved Step/Level cards in their existing relative order. Other clients inherit the default unless configured. featured_prod moves an available requested product and category ahead of configured order; remaining products retain their configured order. Filtering, eligibility and mutually exclusive premium styles remain separate. Capture/restore featured presentation with each application's own entry context.",
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(row => row.key === decisionKey); if (index < 0) db.semanticRequirements.push(record); else db.semanticRequirements[index] = record;
}
