import type { FieldDefinition } from './fields';
import { fieldValidationChecks } from '../utils/fieldValidation';

export type HealthAnswerDefinition = { id: string; label: string; required?: boolean; options?: FieldDefinition['options'] };
export type HealthFollowUp = { answer: HealthAnswerDefinition; collection: string; fields: FieldDefinition[]; fieldToKey: Record<string, string>; maxItems?: number; maximumLengths?: Record<string, number> };

/** One validator for new and restored health answers, including conditional detail records. */
export function healthFieldError(field: FieldDefinition, value: unknown): string | undefined {
  if (field.required && (value === undefined || value === null || value === '' || typeof value === 'string' && !value.trim())) return `${field.label} is required.`;
  if (value !== undefined && value !== null && value !== '' && ['text', 'number', 'date', 'percent'].includes(field.inputType) && typeof value !== 'string' && typeof value !== 'number') return `Enter a valid value for ${field.label}.`;
  if (field.options && value !== undefined && value !== null && value !== '' && (['multi-select', 'checkbox-group'].includes(field.inputType) ? !Array.isArray(value) || value.some(choice => !field.options!.some(option => option.value === choice)) || new Set(value).size !== value.length : !field.options.some(option => option.value === value))) return `Answer ${field.label}`;
  if (value && field.inputType === 'date' && (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value)) return `Enter a valid date for ${field.label}.`;
  if (value && field.format === 'month-year' && !/^(0[1-9]|1[0-2])\/\d{4}$/.test(String(value))) return `Enter a valid month and year for ${field.label}.`;
  return fieldValidationChecks(field).find(check => !check.validate(value === 0 ? '0' : value))?.message;
}

/** Checks newly entered and restored repeatable details. Hidden questions retain data. */
export function validateHealthFollowUps(questions: HealthFollowUp[], values: Record<string, unknown>): string | undefined {
  for (const question of questions) {
    const answer = values[question.answer.id];
    if (question.answer.required && answer !== 'yes' && answer !== 'no') return `Answer ${question.answer.label}`;
    if (answer !== 'yes' || !question.fields.length) continue;
    const rows = values[question.collection];
    if (!Array.isArray(rows) || !rows.length) return `Add details for ${question.answer.label}`;
    if (question.maxItems !== undefined && rows.length > question.maxItems) return `Use at most ${question.maxItems} detail records for ${question.answer.label}`;
    for (const row of rows) {
      if (!row || typeof row !== 'object' || Array.isArray(row)) return `Update details for ${question.answer.label}`;
      for (const field of question.fields) {
        const key = question.fieldToKey[field.id];
        const value = (row as Record<string, unknown>)[key];
        const error = healthFieldError(field, value);
        if (error) return `${error} (${question.answer.label})`;
        const maximum = question.maximumLengths?.[key];
        if (maximum && typeof value === 'string' && value.length > maximum) return `${field.label} must be ${maximum} characters or fewer.`;
      }
    }
  }
}
