import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { isCoverageJourneyPolicy } from "../domain/coverageJourneyPolicy";
export const nsoCombinedLifeDecisionKey = "business-decision.rules-review.nso-combined-life-questionnaire";
export function applyNsoCombinedLifeQuestionnaireAdoption(db: DatabaseSchema) {
  const authority = "User decision October 21, 2026; SUP DI Health questions!A1:A4; Health Questions!A62:B75/A101:B104: NSO full source Life questions only for same-adult QD Life plus FUW Disability";
  const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, authority) });
  const products = db.siteProducts.filter(link => link.siteId === db.sites.find(site => site.key === "nso")?.id && link.enabled && db.products.some(product => product.key === link.productKey && product.categoryKey === "LI")).map(link => link.productKey);
  const selected = db.configurationValues.filter(row => row.siteKey === "nso" && products.some(key => row.key === `nso.${key}.journey-policy`)).flatMap(row => {
    if (!isCoverageJourneyPolicy(row.value)) throw new Error(`Missing NSO Life journey ${row.key}`);
    if (row.value.defaultUnderwritingPathway !== "QD" && !db.underwritingBands.some(band => band.siteKey === "nso" && row.key === `nso.${band.productKey}.journey-policy` && band.pathway === "QD")) return [];
    row.value.healthPageForPortfolio = { when: "qd-life-with-fuw-disability", pageId: "health-li" };
    return [{ key: row.key, healthPageForPortfolio: structuredClone(row.value.healthPageForPortfolio) }];
  });
  if (!selected.length) throw new Error("Missing NSO QD Life portfolio");
  const key = nsoCombinedLifeDecisionKey, row = { ...meta("semanticRequirements", key), domain: "approved-business-decision", subjectTable: "sites", subjectKey: "nso", predicate: "combined-life-health", status: "documented", value: {
    authority, approvalStatus: "approved", sourceReconciliation: "approved-new-template-interpretation", runtimeActivation: "reviewed-seed", sourceReferences: ["SUP DI Health questions!A1:A4", "Health Questions!A62:B75", "Health Questions!A101:B104"], selected,
    interpretation: "When the same NSO adult combines QD Life with FUW Disability, require the shared full source Life questionnaire in addition to the source supplemental DI form. Keep QD processing, native eligibility/benefit limits and the shorter Life-only QD flow. Other applicants, GI Life and other Sites do not inherit this override.",
    destinations: selected.map(row => ({ table: "configurationValues", key: row.key, column: "value" })),
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(row => row.key === key); if (index < 0) db.semanticRequirements.push(row); else db.semanticRequirements[index] = row;
}
