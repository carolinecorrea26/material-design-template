import { createHash } from "node:crypto";
import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { isResidencyPolicy, usJurisdictions, type ResidencyPolicy } from "../domain/residencyPolicy";
import { currentMcrSource } from "./currentMcr";
import type { SourceCell } from "./mcr";

export const isitrustResidencyDecisionKey = "business-decision.rules-review.isitrust-current-residency";
export const approvedIsitrustResidency = [
  { cell: "N278", productKey: "li-group-term", excluded: "AK FL ID MN MT NV NM NY OR SC SD UT VT" },
  { cell: "N279", productKey: "di-ltd", excluded: "AK CO FL ID MN MO MT NV NH NM NY NC ND OH OR SC SD TX UT VT WA" },
  { cell: "N280", productKey: "oo-professional", excluded: "AK CO FL ID LA ME MD MN MS MO MT NH NM NY NC ND OH OR SC SD TX VT WA WY", excludedCanadian: ["CA-YT"] },
  { cell: "N281", productKey: "di-short-term", excluded: "AK CO FL ID KS ME MN MO NV NH NM NY NC ND OH OR SC SD TX UT VT WA" },
  { cell: "N282", productKey: "li-add", excluded: "AR DE KY MN MO NC CT FL IL MT NH NM NY ME MD VA WV OH SC TX UT VT WA WY ND WI OR SD AK CO ID NV TN" },
  { cell: "N283", productKey: "li-10yr", excluded: "AK CO FL ID KY MD MN MS MT NV NH NM NY NC ND OH OR SC SD TN TX UT VT WA" },
  { cell: "N284", productKey: "li-20yr", excluded: "AK CO FL ID MD MN MS MT NV NH NM NY NC ND OH OR SC SD TN TX UT VT WA" },
  { cell: "N285", productKey: "sh-hospital-income", excluded: "AK CO FL ID ME MN MO MT NV NH NM NY NC ND OH OR SC SD TN UT VT WA" },
  { cell: "N286", productKey: "sh-critical-illness", excluded: "AK AR AZ CA CO CT FL GA ID KY LA ME MD MN MO MT NV NH NM NY NC ND OH OR SC SD TN TX UT VT VA WA WI WY" },
] as const;
const metadata = (table: string, key: string, sourceReference: string) => ({ id: key, key, ...libraryMetadata(table, key, sourceReference) });
const retainedCountryScope = usJurisdictions.filter(code => !["AS", "GU", "MP", "PR", "VI", "AA", "AE", "AP"].includes(code.slice(3)));

/** Explicitly approved v78 exclusions only. Other source/compiler policies and
 * captured releases stay intact. Country scope remains the prior working choice. */
export function applyIsitrustResidencyAdoption(db: DatabaseSchema, cells: readonly SourceCell[] = currentMcrSource.cells) {
  const current = new Map(cells.filter(cell => cell.sheet === "Main").map(cell => [cell.cell, cell]));
  const expected = new Map(currentMcrSource.cells.filter(cell => cell.sheet === "Main").map(cell => [cell.cell, cell]));
  const site = db.sites.find(site => site.key === "isitrust");
  // Validate the complete batch before changing any stored records.
  const plans = approvedIsitrustResidency.map(slice => {
    const key = `isitrust.${slice.productKey}.journey-residency`;
    const value = db.configurationValues.find(value => value.key === key);
    if (!value || !isResidencyPolicy(value.value) || !db.siteProducts.some(product => product.siteId === site?.id && product.enabled && product.productKey === slice.productKey)) throw new Error(`Missing ISITRUST residency owner: ${slice.productKey}`);
    if (!expected.has(slice.cell) || JSON.stringify(current.get(slice.cell)) !== JSON.stringify(expected.get(slice.cell))) throw new Error(`Approved residency source changed: Main!${slice.cell}`);
    const excluded = slice.excluded.split(" ").map(code => `US-${code}`);
    const definitionKey = `shared.${slice.productKey}.residency-policy`;
    const existingDefinition = db.configurationDefinitions.find(row => row.key === definitionKey);
    if (existingDefinition && JSON.stringify(existingDefinition.definition.target) !== JSON.stringify({ kind: "product-residency-policy", productKey: slice.productKey })) throw new Error(`Conflicting global residency definition: ${definitionKey}`);
    const policy: ResidencyPolicy = { ...structuredClone(value.value), allowedJurisdictions: retainedCountryScope.filter(code => !excluded.includes(code)),
      provisional: true, revisit: ["The v78 product exclusions are approved. Mainland US plus DC remains the existing provisional country scope; Canadian, territory and foreign availability still requires separate evidence."] };
    if (!isResidencyPolicy(policy)) throw new Error(`Invalid approved residency policy: ${slice.productKey}`);
    return { slice, key, definitionKey, policy, source: current.get(slice.cell)! };
  });
  for (const { slice, key, definitionKey, policy, source } of plans) {
    const reference = `${currentMcrSource.workbook}#Main!${slice.cell}; User approval October 20, 2026`;
    const existingDefinition = db.configurationDefinitions.find(row => row.key === definitionKey);
    if (existingDefinition && JSON.stringify(existingDefinition.definition.target) !== JSON.stringify({ kind: "product-residency-policy", productKey: slice.productKey })) throw new Error(`Conflicting global residency definition: ${definitionKey}`);
    if (!existingDefinition) db.configurationDefinitions.push({ ...metadata("configurationDefinitions", definitionKey, reference), position: 0,
      definition: { path: null, metadata: { reusable: true, assignmentRequired: true }, target: { kind: "product-residency-policy", productKey: slice.productKey } } });
    const value = db.configurationValues.find(row => row.key === key)!;
    const previousDefinition = value.configurationKey;
    Object.assign(value, { configurationKey: definitionKey, value: policy as unknown as Json, sourceReference: value.sourceReference?.includes(`${currentMcrSource.workbook}#Main!${slice.cell}`) ? value.sourceReference : reference });
    if (previousDefinition !== definitionKey && !db.configurationValues.some(row => row.configurationKey === previousDefinition)) db.configurationDefinitions = db.configurationDefinitions.filter(row => row.key !== previousDefinition);
    // Keep the earlier selected policy as historical evidence, explicitly superseded.
    const earlier = db.semanticRequirements.find(row => row.key === `provisional-decision.${key}`);
    if (earlier?.value && typeof earlier.value === "object" && !Array.isArray(earlier.value)) earlier.value = { ...earlier.value, sourceReconciliation: "superseded", runtimeActivation: "superseded", supersededBy: isitrustResidencyDecisionKey };
    const decisionKey = `${isitrustResidencyDecisionKey}.${slice.productKey}`;
    const generalPolicy = structuredClone(policy);
    delete generalPolicy.associationAllowedJurisdictions;
    const record = { ...metadata("semanticRequirements", decisionKey, reference), domain: "approved-business-decision", subjectTable: "sites", subjectKey: "isitrust", predicate: "product-residency-policy", status: "documented",
      value: { authority: "User approval October 20, 2026", approvalStatus: "approved", sourceReconciliation: "approved", scope: ["isitrust"], productKeys: [slice.productKey], sourceReferences: [`Main!${slice.cell}`],
        sourceValueHash: createHash("sha256").update(JSON.stringify(source.value)).digest("hex"), selected: generalPolicy, ...(slice.cell === "N280" ? { excludedCanadianJurisdictions: ["CA-YT"], interpretation: "YT means Yukon; do not exclude Utah by spelling repair. Country scope is unchanged." } : {}),
        destinations: [{ table: "configurationValues", key, column: "value" }], runtimeActivation: "reviewed-seed" } as unknown as Json };
    const index = db.semanticRequirements.findIndex(row => row.key === decisionKey);
    if (index < 0) db.semanticRequirements.push(record); else db.semanticRequirements[index] = record;
  }
}
