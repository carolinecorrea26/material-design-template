import type { EffectiveSite } from "../../domain/effectiveSite";
import type { CoverageJourneyInput } from "../../domain/coverageJourney";
import { configuredHealthQuestionnaire, healthAnswerId, isHealthQuestionnairePolicy } from "../../domain/configuredHealthQuestionnaire";
import { defaultHealthQuestionIds } from '../../config/fields/healthPageFields';
import type { FieldDefinition } from "../../domain/fields";
/** Fictional answers shared by internal scenarios and acceptance checks; never applicant defaults. */
export function completeSourceHealthFixture(site: EffectiveSite, input: CoverageJourneyInput) {
  const selected = [...new Set([input.productKey, ...(input.eligibility?.selectedPlans?.filter(plan => plan.applicantKey === input.applicantKey).map(plan => plan.productKey) ?? [])])];
  const answers: Record<string, unknown> = { gender: "male", "spouse-gender": "male", ...input.answers };
  const value = (field: FieldDefinition) => field.options?.find(option => option.value === "no")?.value ?? field.options?.[0]?.value ?? (field.inputType === "date" ? "2000-01-01" : field.format === "month-year" ? "01/2020" : field.format === "phone" ? "2025550123" : ["number", "percent"].includes(field.inputType) ? 10 : field.inputType === "checkbox" ? true : "Mock answer");
  for (const row of site.configuration.healthQuestionnairePolicies) if (isHealthQuestionnairePolicy(row.value)) for (const variant of row.value.variants) for (const item of variant.items) {
    const field = row.fields.find(field => field.key === item.questionFieldKey)?.definition;
    const answer = field && healthAnswerId(field.id, input.applicantKey);
    if (field && answer && answers[answer] === undefined) answers[answer] = value(field);
    // Always-collected physician details also belong to forms selected only by
    // complete portfolio processing. Seed their authored bindings here; runtime
    // validation still selects and submits only the active form's fields.
    if (!item.repeated && (!answer || answers[answer] === (item.detailsAnswer ?? 'yes'))) for (const key of item.fieldKeys) {
      const detail = row.fields.find(field => field.key === key)?.definition;
      if (detail) answers[healthAnswerId(`${item.key}-${key}`, input.applicantKey)] = value(detail);
    }
  }
  // Complete synthetic health evidence also covers a request that falls through
  // from QD to FUW. Runtime validation still selects and cleans only active fields.
  for (const pageId of ['health-tele', 'health-si', 'health-di-supp'] as const) {
    const ids = defaultHealthQuestionIds(pageId, input.applicantKey === 'spouse' ? 'spouse' : 'self');
    for (const field of site.configuration.pages.find(page => page.key === pageId)?.fields ?? []) if (field.included && ids.has(field.key) && answers[field.key] === undefined) answers[field.key] = value(field.definition);
  }
  for (let round = 0; round < 2; round++) for (const pageId of ['health-tele', 'health-di-supp', 'health-cir']) {
    const result = configuredHealthQuestionnaire(site, pageId, input.applicantKey, { ...answers, dependents: input.applicantKey === 'member' ? [] : [input.applicantKey], association: input.associationKey, 'state-province': input.jurisdiction, coverageSelections: selected, productApplicants: Object.fromEntries(selected.map(key => [key, [input.applicantKey]])) });
    if (result.status !== "resolved") continue;
    for (const field of result.fields) answers[field.id] = value(field);
  }
  return answers;
}
