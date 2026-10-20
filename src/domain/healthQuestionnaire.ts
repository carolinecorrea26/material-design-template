import type { FieldDefinition } from './fields';
import { fieldValidationChecks } from '../utils/fieldValidation';

export type HealthAnswerDefinition = { id: string; label: string; required?: boolean; options?: FieldDefinition['options'] };
export type HealthFollowUp = { answer: HealthAnswerDefinition; collection: string; fields: FieldDefinition[]; fieldToKey: Record<string, string>; maxItems?: number; maximumLengths?: Record<string, number> };

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
        if (field.required && (typeof value !== 'string' || !value.trim())) return `${field.label} is required for ${question.answer.label}`;
        const invalid = fieldValidationChecks(field).find(check => !check.validate(value));
        if (invalid) return `${invalid.message} (${question.answer.label})`;
        const maximum = question.maximumLengths?.[key];
        if (maximum && typeof value === 'string' && value.length > maximum) return `${field.label} must be ${maximum} characters or fewer.`;
      }
    }
  }
}
