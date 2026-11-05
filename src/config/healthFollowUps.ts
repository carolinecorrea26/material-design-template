import { getClientPageFields } from './clientFields/getClientPageFields';
import { applicantParticipatesInPage } from './flowGates';
import { getHealthDetailSurface } from './fields/storedSurfaces';
import { validateHealthFollowUps } from '../domain/healthQuestionnaire';
import type { ApplicationFormValues } from '../app/ApplicationFormContext';
import { configuredHealthQuestionnaire, validateConfiguredHealthQuestionnaire } from '../domain/configuredHealthQuestionnaire';
import { getPrototypeLibrary } from '../domain/prototypeLibrary';

/** Uses effective fields and existing mappings. Candidate forms cannot activate here. */
export function validateHealthPage(pageId: 'health-li' | 'health-si' | 'health-di' | 'health-ci' | 'health-cir', values: ApplicationFormValues) {
  const library = getPrototypeLibrary();
  const configuredApplicants = new Set<string>();
  if (library && ['health-li', 'health-di', 'health-ci', 'health-cir'].includes(pageId)) {
    for (const applicant of ['member', 'spouse'] as const) {
      if (!applicantParticipatesInPage(pageId, applicant, values)) continue;
      const result = configuredHealthQuestionnaire(library.site, pageId, applicant, values);
      if (result.status === 'unassigned') continue;
      configuredApplicants.add(applicant);
      const error = validateConfiguredHealthQuestionnaire(result, values); if (error) return error;
    }
  }
  if (pageId === "health-ci") return library && (["member", "spouse"] as const).some(applicant => applicantParticipatesInPage(pageId, applicant, values) && !configuredApplicants.has(applicant)) ? "No critical illness questionnaire is assigned." : undefined;
  if (pageId === "health-cir") return library && (["member", "spouse"] as const).some(applicant => applicantParticipatesInPage(pageId, applicant, values) && !configuredApplicants.has(applicant)) ? "Unable to load health questions. Please try again." : undefined;
  const fields = getClientPageFields(pageId, values);
  const questions = (['self', 'spouse'] as const).flatMap(applicant => {
    if (configuredApplicants.has(applicant === "self" ? "member" : applicant) || !applicantParticipatesInPage(pageId, applicant, values)) return [];
    return fields.filter(field => field.id.startsWith(`${pageId}-q`) && field.id.endsWith('-spouse') === (applicant === 'spouse')).map(answer => {
      const surface = getHealthDetailSurface(pageId, answer.id);
      return { answer, collection: `${answer.id}-details`, fields: surface.mapping.fields, fieldToKey: surface.mapping.fieldToKey, maxItems: surface.maxItems };
    });
  });
  return validateHealthFollowUps(questions, values);
}
