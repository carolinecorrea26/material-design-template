import type { DatabaseSchema } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { activeSiteMainRows } from "./activeSiteIdentity";
import { mcrSource, type SourceCell } from "./mcr";

/** A scalar G-number and plan code have one role. Multiline class, association,
 * XML/PDF and dummy identifiers require a reviewed role mapping and stay pending.
 */
export function applyScalarSiteIdentifiers(db: DatabaseSchema, cells: readonly SourceCell[]) {
  const source = new Map(cells.map(cell => [`${cell.sheet}!${cell.cell}`, cell]));
  const expected = new Map(mcrSource.cells.map(cell => [`${cell.sheet}!${cell.cell}`, cell]));
  const work = Object.entries(activeSiteMainRows).flatMap(([siteKey, products]) => Object.entries(products).flatMap(([productKey, row]) => {
    if (siteKey === "nso" || siteKey === "waepa-gi") return [];
    const g = source.get(`Main!E${row}`), plan = source.get(`Main!G${row}`);
    if (JSON.stringify(g) !== JSON.stringify(expected.get(`Main!E${row}`)) || JSON.stringify(plan) !== JSON.stringify(expected.get(`Main!G${row}`))) throw new Error(`Identifier source changed: ${siteKey}.${productKey}`);
    if (!g || !plan || !/^G-\d+-\d+$/.test(String(g.value)) || !/^\d+(?:-[a-z])?$/.test(String(plan.value))) return [];
    return [["gNumber", "E", String(g.value)], ["planCode", "G", String(plan.value)]].map(([kind, column, primary]) => ({ siteKey, productKey, row, kind: kind as "gNumber" | "planCode", column, primary }));
  }));
  for (const { siteKey, productKey, row, kind, column, primary } of work) {
    const reference = `Main!${column}${row}`;
    const key = `${siteKey}.${productKey}.reviewed-identifier.${kind}`;
    const metadata = { id: key, key, ...libraryMetadata("productIdentifiers", key, reference) };
    db.productIdentifiers = db.productIdentifiers.filter(identifier => !(identifier.scope === "site" && identifier.siteKey === siteKey && identifier.productKey === productKey && identifier.kind === kind));
    db.productIdentifiers.push({ ...metadata, scope: "site", clientKey: null, siteKey, productKey, kind, definition: { primary }, position: 0 });
    const requirementKey = `mcr.main.${column}${row}`;
    const requirement = db.sourceRequirements.find(requirement => requirement.key === requirementKey)!;
    requirement.promotionState = "SITE_CONFIGURATION";
    requirement.promotionReason = "Exact scalar Site product identifier; submission/service integration remains later work.";
    requirement.activeSiteKeys = [...new Set([...(Array.isArray(requirement.activeSiteKeys) ? requirement.activeSiteKeys as string[] : []), siteKey])];
    const targetKey = `migration-decision.${key}`;
    db.requirementTargets = db.requirementTargets.filter(target => target.key !== targetKey);
    db.requirementTargets.push({ id: targetKey, key: targetKey, ...libraryMetadata("requirementTargets", targetKey, reference), requirementKey, targetTable: "productIdentifiers", targetKey: key, targetColumn: "definition" });
  }
}
