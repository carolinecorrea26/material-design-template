import { healthFieldError } from '../../src/domain/healthQuestionnaire';
import type { SourceQuestion } from './catalog';

export function sourceFormErrors(questions: SourceQuestion[], applicants: string[], values: Record<string, unknown>) {
  const errors: Array<{ id: string; message: string }> = [];
  for (const question of questions) for (const applicant of applicants) {
    const id = `${question.key}-${applicant}`;
    if (question.field) {
      const message = healthFieldError(question.field, values[id]);
      if (message) errors.push({ id, message });
    }
    const pastAlcohol = question.row === 146 && values[id] === 'no';
    if (pastAlcohol && !['yes', 'no'].includes(String(values[`${id}-past-use`]))) errors.push({ id: `${id}-past-use`, message: 'Answer whether you consumed alcoholic beverages in the past five years.' });
    const showDetails = !question.field || values[id] === question.showDetailsOn || pastAlcohol && values[`${id}-past-use`] === 'yes';
    if (!showDetails || !question.details.length) continue;
    const rows = question.repeat ? values[`${id}-details`] : [values];
    if (!Array.isArray(rows) || !rows.length) { errors.push({ id, message: `Add details for ${question.label}` }); continue; }
    for (const row of rows) {
      if (!row || typeof row !== 'object' || Array.isArray(row)) { errors.push({ id, message: `Update details for ${question.label}` }); continue; }
      for (const field of question.details) {
        const fieldId = `${pastAlcohol ? `${id}-past-use` : id}-${field.id}`;
        const message = healthFieldError(field, (row as Record<string, unknown>)[fieldId]);
        if (message) errors.push({ id: question.repeat ? id : fieldId, message });
      }
    }
  }
  return errors;
}
