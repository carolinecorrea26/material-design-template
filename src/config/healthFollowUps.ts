import { getClientPageFields } from './clientFields/getClientPageFields';
import { applicantParticipatesInPage } from './flowGates';
import { getHealthDetailSurface } from './fields/storedSurfaces';
import { validateHealthFollowUps } from '../domain/healthQuestionnaire';
import type { ApplicationFormValues } from '../app/ApplicationFormContext';

/** Uses effective fields and existing mappings. Candidate forms cannot activate here. */
export function validateHealthPage(pageId: 'health-li' | 'health-si' | 'health-di', values: ApplicationFormValues) {
  const fields = getClientPageFields(pageId);
  const questions = (['self', 'spouse'] as const).flatMap(applicant => {
    if (!applicantParticipatesInPage(pageId, applicant, values)) return [];
    return fields.filter(field => field.id.startsWith(`${pageId}-q`) && field.id.endsWith('-spouse') === (applicant === 'spouse')).map(answer => {
      const surface = getHealthDetailSurface(pageId, answer.id);
      return { answer, collection: `${answer.id}-details`, fields: surface.mapping.fields, fieldToKey: surface.mapping.fieldToKey, maxItems: surface.maxItems };
    });
  });
  return validateHealthFollowUps(questions, values);
}
