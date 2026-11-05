import type { DatabaseSchema, Json } from "../persistence/types";
import type { FieldDefinition } from "../domain/fields";
import type { HealthItem, HealthQuestionnairePolicy } from "../domain/configuredHealthQuestionnaire";
import { libraryMetadata } from "../domain/provenance";
import source from "./sources/health-forms-questions.json";

export function applyAbeCirQuestionnaireAdoption(db: DatabaseSchema) {
  const authority = "User clarification October 23, 2026: preserve the supplied CIR questionnaire and updated Life health forms; show the separate CIR page only when the Site enables CIR health questions and that adult selects CIR. ABE does not enable the separate CIR page.";
  const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, authority) });
  const formMeta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, "health_forms_questions.xlsx#Health questions!A98:D109") });
  const fields: FieldDefinition[] = [];
  const field = (id: string, label: string, extra: Partial<FieldDefinition> = {}) => {
    fields.push({ id, label, inputType: "radio", required: true, labelVariant: "standard", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }], ...extra });
    return id;
  };
  const activities = field("health-chr-activities", "Activities requiring assistance or supervision", { inputType: "multi-select", options: ["Bathing", "Dressing", "Eating", "Walking", "Moving in/out of a bed or chair or wheel chair", "Toileting", "Bowel or bladder control"].map(label => ({ label, value: label })) });
  const dwellingOther = field("health-chr-dwelling-other", "Please specify", { inputType: "text", options: undefined, maxLength: 300 });
  const rows = source.questions.filter(row => row.form === "CHR");
  if (rows.length !== 12) throw new Error("Re-review the supplied CHR questionnaire");
  const items: HealthItem[] = rows.map(row => {
    const key = `health-chr-form-${row.row}`;
    const dwelling = row.id === "11";
    const questionFieldKey = field(key, dwelling ? "In what type of dwelling do you reside?" : row.text!, dwelling ? {
      inputType: "dropdown", options: ["Private Home", "Apartment", "Retirement Home", "Congregate Care Community", "Nursing Care Facility", "Mobile Home", "Continuing Care/Care Community", "Retirement Community", "Assisted Living Unit", "Personal Care Home or an Adult Care Home", "Other"].map(label => ({ label, value: label === "Other" ? "other" : label })),
    } : {});
    return { key, questionFieldKey, fieldKeys: row.id === "1" ? [activities] : dwelling ? [dwellingOther] : [], ...(dwelling ? { detailsAnswer: "other" } : {}), sourceReferences: [`health_forms_questions.xlsx#Health questions!D${row.row}`, `Health Questions!B${row.row - 52}`] };
  });
  const policy: HealthQuestionnairePolicy = { version: 1, applicability: "site", associationKeys: [], pageId: "health-cir", whenRider: { productKey: "li-term", riderId: "cir" }, variants: [{ key: "CHR", when: { any: ["li-term"] }, items }] };
  for (const [position, definition] of fields.entries()) {
    const row = { ...formMeta("fields", definition.id), definition, position: 33000 + position };
    const index = db.fields.findIndex(field => field.key === row.key);
    if (index < 0) db.fields.push(row); else db.fields[index] = row;
  }
  const configurationKey = "shared.chr-health-questionnaire";
  const definition: DatabaseSchema["configurationDefinitions"][number] = { ...formMeta("configurationDefinitions", configurationKey), position: 0, definition: { path: null, metadata: { reusable: true, assignmentRequired: true }, target: { kind: "site-health-questionnaires" } } };
  const definitionIndex = db.configurationDefinitions.findIndex(row => row.key === configurationKey);
  if (definitionIndex < 0) db.configurationDefinitions.push(definition); else db.configurationDefinitions[definitionIndex] = definition;
  const key = "abe.health-cir.source-questionnaire";
  const configuration = { ...meta("configurationValues", key), configurationKey, scope: "site" as const, siteKey: "abe", clientKey: null, position: 0, value: policy as unknown as Json };
  const index = db.configurationValues.findIndex(row => row.key === key);
  if (index < 0) db.configurationValues.push(configuration); else db.configurationValues[index] = configuration;
  const page = db.sitePages.find(row => row.siteKey === "abe" && row.pageKey === "health-cir");
  if (!page) throw new Error("Missing ABE CIR page assignment");
  page.requirement = "none";
  const decisionKey = "business-decision.rules-review.abe-cir-source-questionnaire";
  const decision = { ...meta("semanticRequirements", decisionKey), domain: "approved-business-decision", subjectTable: "sites", subjectKey: "abe", predicate: "abe-cir-source-questionnaire", status: "documented", value: {
    authority, approvalStatus: "approved", sourceReconciliation: "approved-new-template-interpretation", runtimeActivation: "reviewed-seed", workbook: source.workbook, workbookSha256: source.sha256,
    sourceReferences: ["Main!L39", "Riders!A32:D32", "Riders!M32:N32", "Health Questions!A46:B57", "health_forms_questions.xlsx#Health questions!A98:D109"],
    selected: { separateCirPage: false, availableQuestionnaire: policy, fields }, interpretation: "ABE R28 is attached to Term Life. ABE does not show the separate CIR health page or collect its answers. The supplied CHR questionnaire remains available for a Site that enables CIR health questions; only the selecting adult participates. Underwriting flags alone do not establish a separate online questionnaire assignment. Preserve existing Life-health routing, updated health forms and other Sites' configuration.",
  } as unknown as Json };
  const decisionIndex = db.semanticRequirements.findIndex(row => row.key === decisionKey);
  if (decisionIndex < 0) db.semanticRequirements.push(decision); else db.semanticRequirements[decisionIndex] = decision;
}
