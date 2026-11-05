import type { DatabaseSchema, Json } from "../persistence/types";
import type { FieldDefinition } from "../domain/fields";
import type { HealthItem, HealthQuestionnairePolicy } from "../domain/configuredHealthQuestionnaire";
import { isCoverageJourneyPolicy } from "../domain/coverageJourneyPolicy";
import { libraryMetadata } from "../domain/provenance";
import source from "./sources/health-forms-questions.json";

export const abeHealthDecisionKey = "business-decision.rules-review.abe-source-health-forms";
export function applyAbeHealthQuestionnairesAdoption(db: DatabaseSchema) {
  const authority = "User decisions October 22, 2026: use MCR CI questions and health_forms_questions for forms and corresponding questions. CI has its own Health page; smoker stays on Coverage and is excluded from CI forms. Supplemental DI uses the supplied workbook on the existing DI Health page.";
  const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, authority) });
  const fields: FieldDefinition[] = [];
  const field = (id: string, label: string, extra: Partial<FieldDefinition> = {}) => {
    if (!fields.some(row => row.id === id)) fields.push({ id, label, inputType: "text", required: true, labelVariant: "standard", ...extra });
    return id;
  };
  const answer = (row: typeof source.questions[number], label = row.text!, fieldKeys: string[] = [], repeated = false): HealthItem => {
    const key = `health-abe-form-${row.row}`;
    return { key, questionFieldKey: field(key, label, { inputType: "radio", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] }), fieldKeys, ...(repeated ? { repeated: true } : {}), sourceReferences: [`health_forms_questions.xlsx#Health questions!D${row.row}${row.notes ? `:E${row.row}` : ""}`] };
  };
  const ciItems = (form: string) => {
    const rows = source.questions.filter(row => row.form === form), prefix = rows.find(row => row.id === "4")!.text!, impairment = rows.find(row => row.id === "l")!.text!.replace(/^l\.\s*/, "");
    return rows.filter(row => !["3", "4", "l"].includes(row.id!)).flatMap((row, index): HealthItem[] => {
      const item = {
        ...answer(row, ["1", "2"].includes(row.id!) ? row.text! : `${prefix} ${Number(row.id) >= 17 ? `${impairment} ${row.text}` : row.text!.replace(/^[a-k]\.\s*/, "")}`),
        groupKey: `ci-2014-question-${index + 1}`,
      };
      if (![91, 209].includes(row.row)) return [item];
      const key = `${item.key}-ca`;
      return [{ ...item, when: { exceptJurisdictions: ["CA"] } }, {
        key, groupKey: `${item.groupKey}-ca`,
        questionFieldKey: field(key, `${prefix} Substance Abuse?`, { displayName: `Health ABE form ${row.row} California`, inputType: "radio", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] }),
        fieldKeys: [], when: { jurisdictions: ["CA"] },
        sourceReferences: [`health_forms_questions.xlsx#Health questions!E${row.row === 91 ? 97 : 215}`],
      }];
    });
  };
  const ci = "sh-critical-illness";
  const ciPolicy: HealthQuestionnairePolicy = { version: 1, applicability: "site", associationKeys: [], pageId: "health-ci", variants: [
    { key: "CI-2014-ci-only", when: { only: [ci] }, items: ciItems("CI-2014 - CI only applications") },
    { key: "CI-2014-combined", when: { any: [ci], otherThan: [ci] }, items: ciItems("CI-2014") },
  ] };
  const detail = (name: string, label: string, extra: Partial<FieldDefinition> = {}) => field(`health-abe-supp-di-detail-${name}`, label, { maxLength: 300, multiline: true, minRows: 2, ...extra });
  const physician = detail("physician", "Name and address of physician and hospital");
  const medical = [detail("onset", "Date of onset (MM/YYYY)", { format: "month-year", multiline: false }), detail("illness", "Illness or injury"), detail("symptoms", "Symptoms"), detail("last-treatment", "Last date of treatment (MM/YYYY)", { format: "month-year", multiline: false }), detail("episodes", "Number of episodes"), detail("treatment-results", "Treatment and results"), physician];
  const diRows = source.questions.filter(row => row.form === "Supp DI"), diPrefix = diRows.find(row => row.row === 162)!.text!;
  const diItems = diRows.filter(row => row.row !== 162).map(row => {
    const details = row.row === 160 ? [detail("date", "Date", { inputType: "date", multiline: false }), detail("treatment", "Treatment"), detail("condition", "Condition"), physician] : row.row === 161 ? [detail("medication", "Medication/Treatment"), detail("dosage", "Dosage"), detail("frequency", "Frequency"), detail("reason", "Reason for use of medication"), physician] : row.row <= 166 ? medical : row.row === 167 ? [detail("last-use", "Date of last use", { inputType: "date", multiline: false }), detail("frequency", "Frequency"), detail("drug", "Drug"), detail("drug-details", "Details")] : [detail("benefits", "Details")];
    const text = row.text!.replace(/^[a-d]\)\s*/, "");
    return answer(row, row.row >= 163 && row.row <= 166 ? `${diPrefix} ${text}` : text, details, row.row !== 168);
  });
  const diPolicy: HealthQuestionnairePolicy = { version: 1, applicability: "site", associationKeys: [], pageId: "health-di", whenProcessing: "qd-life-with-disability", variants: [{ key: "Supp-DI", when: { any: ["di-ltd-plus", "di-ltd", "di-mtd"] }, items: diItems }] };
  for (const [index, definition] of fields.entries()) {
    const row = { ...meta("fields", definition.id), position: 32000 + index, definition }, indexInDb = db.fields.findIndex(row => row.key === definition.id);
    if (indexInDb < 0) db.fields.push(row); else db.fields[indexInDb] = row;
  }
  for (const policy of [ciPolicy, diPolicy]) {
    const configurationKey = `shared.abe-source-forms.${policy.pageId}`;
    if (!db.configurationDefinitions.some(row => row.key === configurationKey)) db.configurationDefinitions.push({ ...meta("configurationDefinitions", configurationKey), position: 0, definition: { path: null, metadata: { reusable: true, assignmentRequired: true }, target: { kind: "site-health-questionnaires" } } });
    const key = `abe.${policy.pageId}.source-questionnaire`, row = { ...meta("configurationValues", key), position: 0, scope: "site" as const, siteKey: "abe", clientKey: null, configurationKey, value: policy as unknown as Json }, index = db.configurationValues.findIndex(row => row.key === key);
    if (index < 0) db.configurationValues.push(row); else db.configurationValues[index] = row;
  }
  const page = db.sitePages.find(row => row.siteKey === "abe" && row.pageKey === "health-ci"); if (!page) throw new Error("Missing CI page assignment"); page.requirement = "required";
  const siPage = db.sitePages.find(row => row.siteKey === "abe" && row.pageKey === "health-si");
  if (!siPage) throw new Error("Missing ABE SI page assignment");
  siPage.requirement = "none";
  const journey = db.configurationValues.find(row => row.key === `abe.${ci}.journey-policy`);
  if (!journey || !isCoverageJourneyPolicy(journey.value)) throw new Error("Missing ABE CI journey");
  journey.value.healthPageByUnderwriting = { ...journey.value.healthPageByUnderwriting, FUW: "health-ci" };
  journey.value.questions = journey.value.questions.map(row => ({ ...row, healthPage: row.applicantKey === "child" ? null : "health-ci" }));
  for (const productKey of ["di-ltd-plus", "di-ltd", "di-mtd"]) {
    const journey = db.configurationValues.find(row => row.key === `abe.${productKey}.journey-policy`);
    if (!journey || !isCoverageJourneyPolicy(journey.value)) throw new Error("Missing ABE DI journey");
    journey.value.healthPageForPortfolio = { when: "qd-life-with-disability", pageId: "health-di" };
  }
  const key = abeHealthDecisionKey, decision = { ...meta("semanticRequirements", key), domain: "approved-business-decision", subjectTable: "sites", subjectKey: "abe", predicate: "abe-source-health-questionnaires", status: "documented", value: {
    authority, approvalStatus: "approved", runtimeActivation: "reviewed-seed", sourceReconciliation: "approved-new-template-interpretation", workbook: source.workbook, workbookSha256: source.sha256,
    selected: { ciPolicy, diPolicy, fields }, sourceReferences: ["Health Questions!A41:B44", "Health Questions!A81:B84", "SUP DI Health questions!T50", "health_forms_questions.xlsx#Health questions!A79:E97", "health_forms_questions.xlsx#Health questions!A160:E168", "health_forms_questions.xlsx#Health questions!A197:E215"],
    interpretation: "CI-2014 questions use their own page for each participating adult. Source group headings provide context rather than extra answers. The tobacco item is deliberately omitted here: the existing Coverage category smoker question remains the only collection. Supplemental DI uses all eight answer questions and source-required detail records when the same adult requests QD Life and DI. FUW is post-submission underwriting and does not itself collect online health questions. Only explicitly assigned forms, including TELE where configured, activate online collection. Existing TELE routes and forms are preserved. Explicit CI and supplemental DI forms remain active under their own guards. QD remains externally hosted. Member and spouse answers are independent. Financial questions stay on Profile.",
    destinations: [{ table: "configurationValues", key: "abe.health-ci.source-questionnaire" }, { table: "configurationValues", key: "abe.health-di.source-questionnaire" }, { table: "sitePages", key: page.key }, ...[ci, "di-ltd-plus", "di-ltd", "di-mtd"].map(productKey => ({ table: "configurationValues", key: `abe.${productKey}.journey-policy`, column: "value" }))],
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(row => row.key === key); if (index < 0) db.semanticRequirements.push(decision); else db.semanticRequirements[index] = decision;
}
