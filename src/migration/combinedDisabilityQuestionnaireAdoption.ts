import type { DatabaseSchema, Json } from "../persistence/types";
import type { FieldDefinition } from "../domain/fields";
import type { HealthItem, HealthQuestionnairePolicy } from "../domain/configuredHealthQuestionnaire";
import { libraryMetadata } from "../domain/provenance";
import { currentMcrSource } from "./currentMcr";
export const combinedDisabilityQuestionnaireDecisionKey = "business-decision.rules-review.combined-source-supplemental-di";
export function applyCombinedDisabilityQuestionnaireAdoption(db: DatabaseSchema) {
  const authority = "User decision October 21, 2026; Health Questions!A101:B104; SUP DI Health questions!A1:A4: source supplemental DI for WAEPA/NSO QD Life + FUW Disability";
  const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, authority) });
  const source = (cell: string) => String(currentMcrSource.cells.find(row => row.sheet === "Health Questions" && row.cell === cell)?.value ?? "");
  if (!source("A101").startsWith("WAEPA, HPSO/NSO")) throw new Error("Supplemental DI source scope changed");
  const fields: FieldDefinition[] = [];
  const field = (name: string, label: string, extra: Partial<FieldDefinition> = {}) => {
    const id = `health-source-supp-di-${name}`;
    fields.push({ id, label, inputType: "text", required: true, labelVariant: "standard", ...extra }); return id;
  };
  const shared = (key: string) => { if (!db.fields.some(row => row.key === key)) throw new Error(`Missing shared health detail ${key}`); return key; };
  const detail = (name: string, label: string) => field(`detail-${name}`, label, { maxLength: 300, multiline: true, minRows: 2 });
  const medical = [shared("health-source-detail-onset"), shared("health-source-detail-illness"), shared("health-source-detail-symptoms"), shared("health-source-detail-last-treatment"), detail("episodes", "Number of episodes"), shared("health-source-detail-treatment-results"), shared("health-source-detail-physician-hospital")];
  const questionText = (cell: string, marker: string) => { const text = source(cell); const start = text.indexOf(marker); if (start < 0 || text.indexOf("?", start) < 0) throw new Error(`Supplemental DI question boundary changed ${cell}/${marker}`); return text.slice(start + marker.length, text.indexOf("?", start) + 1).trim(); };
  const question = (key: string, label: string, cell: string, fieldKeys: string[], repeated = true): HealthItem => ({ key: `health-source-supp-di-${key}`, questionFieldKey: field(key, label, { inputType: "radio", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] }), fieldKeys, repeated, sourceReferences: [`Health Questions!${cell}`] });
  const items: HealthItem[] = [
    question("contemplated-treatment", questionText("B101", "a)"), "B101", [shared("health-source-detail-month"), shared("health-source-detail-treatment"), shared("health-source-detail-condition"), medical[6]]),
    question("current-treatment", questionText("B101", "b)"), "B101", [detail("medication-treatment", "Medication/Treatment"), shared("health-source-detail-dosage"), shared("health-source-detail-frequency"), shared("health-source-detail-reason-for-use"), medical[6]]),
    ...["a", "b", "c", "d"].map((marker, index) => question(`condition-${index + 1}`, `During the past five years have you ever been medically diagnosed by a physician as having or been treated for ${questionText("B102", `${marker})`)}`, "B102", medical)),
    question("drugs", questionText("B103", "a)"), "B103", [field("detail-last-use", "Date of last use", { inputType: "date" }), shared("health-source-detail-frequency"), shared("health-source-detail-drug"), shared("health-source-detail-drug-details")]),
    question("benefits", questionText("B104", "a)"), "B104", [shared("health-source-detail-details")], false),
  ];
  for (const [index, definition] of fields.entries()) {
    const row = { ...meta("fields", definition.id), position: 31000 + index, definition };
    const position = db.fields.findIndex(row => row.key === definition.id); if (position < 0) db.fields.push(row); else db.fields[position] = row;
  }
  const configurationKey = "shared.supplemental-di-questionnaires";
  if (!db.configurationDefinitions.some(row => row.key === configurationKey)) db.configurationDefinitions.push({ ...meta("configurationDefinitions", configurationKey), position: 0, definition: { path: null, metadata: { reusable: true, assignmentRequired: true }, target: { kind: "site-health-questionnaires" } } });
  const selected = ["waepa", "nso"].map(siteKey => {
    const site = db.sites.find(row => row.key === siteKey)!;
    const products = db.siteProducts.filter(link => link.siteId === site.id && link.enabled && db.products.some(product => product.key === link.productKey && product.categoryKey === "DI")).map(link => link.productKey);
    const policy: HealthQuestionnairePolicy = { version: 1, applicability: "site", associationKeys: [], pageId: "health-di", whenProcessing: "qd-life-with-fuw-disability", variants: [{ key: "combined-supplemental-di", when: { any: products }, items: structuredClone(items) }] };
    const key = `${siteKey}.combined.supplemental-di-questionnaires`, row = { ...meta("configurationValues", key), position: 0, scope: "site" as const, siteKey, clientKey: null, configurationKey, value: policy as unknown as Json };
    const index = db.configurationValues.findIndex(row => row.key === key); if (index < 0) db.configurationValues.push(row); else db.configurationValues[index] = row;
    return { siteKey, key, policy };
  });
  const key = combinedDisabilityQuestionnaireDecisionKey, row = { ...meta("semanticRequirements", key), domain: "approved-business-decision", subjectTable: "pages", subjectKey: "health-di", predicate: "combined-source-supplemental-di", status: "documented", value: {
    authority, approvalStatus: "approved", runtimeActivation: "reviewed-seed", sourceReconciliation: "approved-new-template-interpretation", sourceReferences: ["Health Questions!A101:B104", "SUP DI Health questions!A1:A4"], selected,
    fields: [...new Set(items.flatMap(item => [...(item.questionFieldKey ? [item.questionFieldKey] : []), ...item.fieldKeys]))].map(key => ({ key, definition: structuredClone(db.fields.find(row => row.key === key)!.definition) })),
    interpretation: "For each adult on WAEPA or NSO, require the source supplemental DI questions on Health DI only when that adult has QD Life plus FUW Disability. Use native processing, independent answers and complete conditional detail records. Replace the generic DI questions for that combined applicant; Life questions keep their own approved scope. DI-only retains its existing provisional questionnaire. Unknown combined processing fails closed. PDF splitting and output remain deferred.",
    destinations: selected.map(row => ({ table: "configurationValues", key: row.key, column: "value" })),
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(row => row.key === key); if (index < 0) db.semanticRequirements.push(row); else db.semanticRequirements[index] = row;
}
