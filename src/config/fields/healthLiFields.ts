import page from '../../../requirements/parked/health-tele.json';
import { healthPageQuestionFields, healthPageDetailMapping } from './healthPageFields';
export const createQuestionFields = (applicant: 'self' | 'spouse') => healthPageQuestionFields(page, applicant);
export const HEALTH_QUESTIONS = createQuestionFields('self').map(field => field.label);
export const detailsMapping = healthPageDetailMapping(page, 'healthLiDetails');
export const detailsFields = detailsMapping.fields;
