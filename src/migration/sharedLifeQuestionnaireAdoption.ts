import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { healthQuestionnaireFieldKeys, isHealthQuestionnairePolicy, type HealthQuestionnairePolicy } from "../domain/configuredHealthQuestionnaire";
import { isCoverageJourneyPolicy } from "../domain/coverageJourneyPolicy";
export const sharedLifeQuestionnaireDecisionKey = "business-decision.rules-review.waepa-nso-source-life";
export function applySharedLifeQuestionnaireAdoption(db: DatabaseSchema) {
  const authority = "User decisions October 20, 2026; Health Questions!A62:B75; Main!AA379: shared source Life forms for WAEPA and NSO, all adult WAEPA Life requests";
  const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, authority) });
  const base = db.configurationValues.find(row => row.key === "isitrust.general.health-questionnaires");
  if (!base || !isHealthQuestionnairePolicy(base.value)) throw new Error("Missing shared source Life definitions");
  const life = base.value.variants.find(variant => variant.key === "life"); if (!life) throw new Error("Missing shared source Life variant");
  const selected = ["waepa", "nso"].map(siteKey => {
    const site = db.sites.find(site => site.key === siteKey)!;
    const products = db.siteProducts.filter(link => link.siteId === site.id && link.enabled && db.products.some(product => product.key === link.productKey && product.categoryKey === "LI")).map(link => link.productKey);
    const policy: HealthQuestionnairePolicy = { version: 1, applicability: "site", associationKeys: [], pageId: "health-li", variants: [{ key: "life", when: { any: products }, items: structuredClone(life.items) }] };
    const key = `${siteKey}.general.health-questionnaires`, value = { ...meta("configurationValues", key), configurationKey: base.configurationKey, position: 0, scope: "site" as const, siteKey, clientKey: null, value: policy as unknown as Json };
    const index = db.configurationValues.findIndex(row => row.key === key); if (index < 0) db.configurationValues.push(value); else db.configurationValues[index] = value;
    return { siteKey, key, policy, fields: healthQuestionnaireFieldKeys(policy).map(key => ({ key, definition: structuredClone(db.fields.find(field => field.key === key)!.definition) })) };
  });
  const journey = db.configurationValues.find(row => row.key === "waepa.li-group-term.journey-policy");
  if (!journey || !isCoverageJourneyPolicy(journey.value)) throw new Error("Missing WAEPA Life journey");
  journey.value.healthPageByUnderwriting = { ...journey.value.healthPageByUnderwriting, QD: "health-li", FUW: "health-li", SI: "health-li", TELE: "health-li" };
  journey.value.questions = journey.value.questions.map(question => question.applicantKey === "child" ? question : { ...question, healthPage: "health-li" });
  const key = sharedLifeQuestionnaireDecisionKey;
  const record = { ...meta("semanticRequirements", key), domain: "approved-business-decision", subjectTable: "sites", subjectKey: "waepa", predicate: "shared-source-life-questionnaires", status: "documented", value: {
    authority, approvalStatus: "approved", sourceReconciliation: "approved-new-template-interpretation", runtimeActivation: "reviewed-seed", sourceReferences: ["Health Questions!A62:B75", "Main!AA379", "Main!W379"], selected,
    waepaHealthScope: { key: journey.key, healthPageByUnderwriting: journey.value.healthPageByUnderwriting, questions: journey.value.questions },
    preserved: "Processing bands, eligibility and benefit limits remain separate. NSO shorter QD processing and WAEPA STD retain their approved routing. WAEPA GI and child-only requests do not inherit these Life questions. Existing ISITRUST/ATPE assignments remain distinct.",
    destinations: [...selected.map(row => ({ table: "configurationValues", key: row.key, column: "value" })), { table: "configurationValues", key: journey.key, column: "value" }],
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(row => row.key === key); if (index < 0) db.semanticRequirements.push(record); else db.semanticRequirements[index] = record;
}
