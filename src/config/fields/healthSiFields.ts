import page from '../../../requirements/parked/health-si.json';
import { healthPageQuestionFields, healthPageDetailMapping } from './healthPageFields';
export const createAnswerFields = (applicant: 'self' | 'spouse') => healthPageQuestionFields(page, applicant);
export const QUESTIONS = createAnswerFields('self').map(field => ({ key: field.id.replace('health-si-', ''), label: field.label }));
export const detailsMapping = healthPageDetailMapping(page, 'healthSiDetails');
export const detailsFields = detailsMapping.fields;
