import { defaultHealthQuestionIds, effectiveHealthFollowUps } from './fields/healthPageFields';
import { requirementValidationMessage } from '../domain/requirementValidations';
import { getClientPageFields } from './clientFields/getClientPageFields';
import { applicantParticipatesInPage, applicantHasSelectedCategory } from './flowGates';
import { getHealthDetailSurface } from './fields/storedSurfaces';
import { validateHealthFollowUps } from '../domain/healthQuestionnaire';
import type { ApplicationFormValues } from '../app/ApplicationFormContext';
import { configuredHealthQuestionnaire, validateConfiguredHealthQuestionnaire } from '../domain/configuredHealthQuestionnaire';
import { getPrototypeLibrary } from '../domain/prototypeLibrary';

/** Uses effective fields and existing mappings. Candidate forms cannot activate here. */
export function validateHealthPage(pageId: 'health-tele' | 'health-si' | 'health-di-supp' | 'health-cir', values: ApplicationFormValues) {
  const library = getPrototypeLibrary();
  const configuredApplicants = new Set<string>();
  if (library && ['health-tele', 'health-di-supp', 'health-cir'].includes(pageId)) {
    for (const applicant of ['member', 'spouse'] as const) {
      if (!applicantParticipatesInPage(pageId, applicant, values)) continue;
      const result = configuredHealthQuestionnaire(library.site, pageId, applicant, values);
      if (result.status === 'unassigned') continue;
      configuredApplicants.add(applicant);
      const error = validateConfiguredHealthQuestionnaire(result, values); if (error) return error;
    }
  }
  if (pageId === "health-tele" && library && (["member", "spouse"] as const).some(applicant => applicantParticipatesInPage(pageId, applicant, values) && applicantHasSelectedCategory(values, applicant, ["SH"]) && !configuredApplicants.has(applicant))) return requirementValidationMessage("health-ci-questionnaire-assignment");
  if (pageId === "health-cir") return library && (["member", "spouse"] as const).some(applicant => applicantParticipatesInPage(pageId, applicant, values) && !configuredApplicants.has(applicant)) ? requirementValidationMessage('health-cir-questionnaire-assignment') : undefined;
  const fields = getClientPageFields(pageId, values);
  const questions = (['self', 'spouse'] as const).flatMap(applicant => {
    if (configuredApplicants.has(applicant === "self" ? "member" : applicant) || !applicantParticipatesInPage(pageId, applicant, values)) return [];
    if (library) return effectiveHealthFollowUps(library.site, pageId, applicant);
    const ids = defaultHealthQuestionIds(pageId, applicant);
    return fields.filter(field => ids.has(field.id)).map(answer => {
      const surface = getHealthDetailSurface(pageId, answer.id);
      return { answer, collection: `${answer.id}-details`, fields: surface.mapping.fields, fieldToKey: surface.mapping.fieldToKey, maxItems: surface.maxItems };
    });
  });
  return validateHealthFollowUps(questions, values);
}
