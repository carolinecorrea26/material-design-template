import type { EffectiveSite } from "../domain/effectiveSite";
import type { CoverageJourneyInput } from "../domain/coverageJourney";
import { configuredHealthQuestionnaire, healthAnswerId, isHealthQuestionnairePolicy } from "../domain/configuredHealthQuestionnaire";
import type { FieldDefinition } from "../domain/fields";
/** Synthetic passing answers for acceptance fixtures; never runtime defaults. */
export function completeSourceHealthFixture(site: EffectiveSite, input: CoverageJourneyInput) {
  const selected = [...new Set([input.productKey, ...(input.eligibility?.selectedPlans?.filter(plan => plan.applicantKey === input.applicantKey).map(plan => plan.productKey) ?? [])])];
  const answers: Record<string, unknown> = { gender: "male", "spouse-gender": "male", ...input.answers };
  const value = (field: FieldDefinition) => field.options?.find(option => option.value === "no")?.value ?? field.options?.[0]?.value ?? (field.inputType === "date" ? "2000-01-01" : field.format === "month-year" ? "01/2020" : field.format === "phone" ? "2025550123" : ["number", "percent"].includes(field.inputType) ? 10 : field.inputType === "checkbox" ? true : "Mock answer");
  for (const row of site.configuration.healthQuestionnairePolicies) if (isHealthQuestionnairePolicy(row.value)) for (const variant of row.value.variants) for (const item of variant.items) {
    if (!item.questionFieldKey || !/^health-(?:abe|chr)-form-/.test(item.questionFieldKey)) continue;
    const field = row.fields.find(field => field.key === item.questionFieldKey)?.definition;
    if (field && answers[healthAnswerId(field.id, input.applicantKey)] === undefined) answers[healthAnswerId(field.id, input.applicantKey)] = value(field);
  }
  // Complete synthetic health evidence also covers a request that falls through
  // from QD to FUW. Runtime validation still selects and cleans only active fields.
  for (const page of site.configuration.pages) for (const field of page.fields.filter(field => field.included && /^health-(?:li|di|si|qd)-q/.test(field.key) && field.key.endsWith("-spouse") === (input.applicantKey === "spouse"))) if (answers[field.key] === undefined) answers[field.key] = value(field.definition);
  for (let round = 0; round < 2; round++) {
    const result = configuredHealthQuestionnaire(site, "health-li", input.applicantKey, { ...answers, association: input.associationKey, state: input.jurisdiction, coverageSelections: selected, productApplicants: Object.fromEntries(selected.map(key => [key, [input.applicantKey]])) });
    if (result.status !== "resolved") break;
    for (const field of result.fields) answers[field.id] = value(field);
  }
  return answers;
}
