import page from '../../../requirements/parked/health-di-supp.json';
import { healthPageQuestionFields, healthPageDetailMapping } from './healthPageFields';
const summaryRenderers = { assistance: 'renderAssistanceItem', fall: 'renderFallItem', condition: 'renderSpecificItem', general: 'renderGeneralItem' } as const;
export const createAnswerFields = (applicant: 'self' | 'spouse') => healthPageQuestionFields(page, applicant);
export const assistanceMapping = healthPageDetailMapping(page, 'healthDiq1Details');
export const fallDiagnosisMapping = healthPageDetailMapping(page, 'healthDiq2Details');
export const specificMapping = healthPageDetailMapping(page, 'healthDiq3Details');
export const generalMapping = healthPageDetailMapping(page, 'healthDiq7Details');
export const assistanceFields = assistanceMapping.fields;
export const fallDiagnosisFields = fallDiagnosisMapping.fields;
export const specificFields = specificMapping.fields;
export const generalFields = generalMapping.fields;
export const QUESTIONS = createAnswerFields('self').map(field => {
  const detail = page.questionDetails[field.id as keyof typeof page.questionDetails];
  return { key: field.id.replace('health-di-', ''), label: field.label,
    mapping: healthPageDetailMapping(page, detail.surface), renderKind: summaryRenderers[detail.summary as keyof typeof summaryRenderers] };
});
