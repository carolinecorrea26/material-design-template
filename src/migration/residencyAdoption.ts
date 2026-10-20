import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { isResidencyPolicy, usJurisdictions, type ResidencyPolicy } from "../domain/residencyPolicy";
import { mcrSource, type SourceCell } from "./mcr";
import { provisionalDecisionAuthority, provisionalDecisionReference } from "./provisionalSourceDecisions";

const waepa = (excluded: string[]): ResidencyPolicy => ({ version: 1, allowedJurisdictions: usJurisdictions.filter(code => !excluded.includes(code.slice(3))), excludeActiveMilitary: true, provisional: true, revisit: ["Use the pinned workbook's current restrictions provisionally. Revisit WAEPA filing approvals before publication; no future approval is inferred."] });
export const residencyAdoptionSlices = [
  { siteKey: "csea", productKey: "di-ltd", references: ["Main!M246", "Main!N246"], policy: { version: 1, allowedJurisdictions: ["US-NY", "US-NJ", "US-VT", "US-PA", "US-CT"], excludeActiveMilitary: false, provisional: true, revisit: ["MainM246 explicitly allows NY/NJ/VT/PA/CT; MainN246 repeats these states under exclusions. Prefer the explicit allowlist provisionally and reconcile the standard/GI row label."] } as ResidencyPolicy },
  { siteKey: "waepa", productKey: "li-group-term", references: ["Main!M379", "Main!N379"], policy: waepa(["VI", "DE", "MT", "NC", "NY", "OH", "OR", "LA"]) },
  { siteKey: "waepa", productKey: "di-short-term", references: ["Main!M380", "Main!N380"], policy: waepa(["AS", "GU", "MP", "PR", "VI", "LA", "NV", "OR", "NH", "VT"]) },
  { siteKey: "waepa-gi", productKey: "li-group-term", references: ["Main!M386", "Main!N386"], policy: waepa(["VI", "LA"]) },
];
const metadata = (table: string, key: string, reference: string) => ({ id: key, key, ...libraryMetadata(table, key, reference) });
export function applyResidencyAdoption(db: DatabaseSchema, cells: readonly SourceCell[]) {
  const actual = new Map(cells.map(cell => [`${cell.sheet}!${cell.cell}`, cell]));
  const expected = new Map(mcrSource.cells.map(cell => [`${cell.sheet}!${cell.cell}`, cell]));
  for (const slice of residencyAdoptionSlices) {
    if (!isResidencyPolicy(slice.policy)) throw new Error(`Invalid residency policy: ${slice.siteKey}`);
    const site = db.sites.find(site => site.key === slice.siteKey);
    if (!db.siteProducts.some(product => product.siteId === site?.id && product.productKey === slice.productKey && product.enabled)) throw new Error(`Unavailable residency product: ${slice.siteKey}`);
    for (const reference of slice.references) if (!expected.has(reference) || JSON.stringify(actual.get(reference)) !== JSON.stringify(expected.get(reference)) || !db.sourceRequirements.some(row => row.sheetKey === "main" && `Main!${row.cell}` === reference)) throw new Error(`Residency source changed: ${reference}`);
  }
  for (const slice of residencyAdoptionSlices) {
    const key = `${slice.siteKey}.${slice.productKey}.reviewed-residency`, reference = slice.references.join("; ");
    db.configurationDefinitions = db.configurationDefinitions.filter(row => row.key !== key);
    db.configurationDefinitions.push({ ...metadata("configurationDefinitions", key, reference), definition: { path: null, metadata: { fullPolicyAcceptance: "pending" }, target: { kind: "product-residency-policy", productKey: slice.productKey } }, position: 0 });
    db.configurationValues = db.configurationValues.filter(row => row.key !== key);
    db.configurationValues.push({ ...metadata("configurationValues", key, reference), scope: "site", siteKey: slice.siteKey, clientKey: null, configurationKey: key, value: slice.policy as unknown as Json, position: 0 });
    const decisionKey = `provisional-decision.${key}`;
    db.semanticRequirements = db.semanticRequirements.filter(row => row.key !== decisionKey);
    db.semanticRequirements.push({ ...metadata("semanticRequirements", decisionKey, provisionalDecisionReference), domain: "provisional-source-decision", subjectTable: "sites", subjectKey: slice.siteKey, predicate: "residency", status: "documented", value: { authority: provisionalDecisionAuthority, sourceReconciliation: "deferred", revisit: true, selected: slice.policy as unknown as Json, sourceReferences: slice.references, destinations: [{ table: "configurationValues", key, column: "value" }], runtimeActivation: "pending" } });
    for (const sourceReference of slice.references) {
      const source = db.sourceRequirements.find(row => row.sheetKey === "main" && `Main!${row.cell}` === sourceReference)!;
      source.promotionState = "SITE_CONFIGURATION";
      source.promotionReason = "Provisional working decision: executable residency restrictions; full product acceptance remains pending.";
      source.activeSiteKeys = [...new Set([...(Array.isArray(source.activeSiteKeys) ? source.activeSiteKeys as string[] : []), slice.siteKey])];
      const targetKey = `${decisionKey}.${source.key}`;
      db.requirementTargets = db.requirementTargets.filter(row => row.key !== targetKey);
      db.requirementTargets.push({ ...metadata("requirementTargets", targetKey, sourceReference), requirementKey: source.key, targetTable: "configurationValues", targetKey: key, targetColumn: "value" });
    }
  }
}
