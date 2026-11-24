import { resolveMappedFields } from './requirementFieldDefinitions.mjs';

/** Ordinary controls and explicitly fictional fixture fields share one surface contract. */
export function requirementSurfaceFields(surface, page, source, siteId) {
  if (surface.fixture) {
    if (surface.fixture !== 'verification' || surface.mapping) throw new Error('Invalid fresh-start surface fixture');
    const questions = source.verification.questions;
    if (!Array.isArray(questions) || !questions.length || new Set(questions.map(question => question.id)).size !== questions.length) throw new Error('Invalid verification question fixture');
    return questions.map(question => {
      if (!question.id || !question.question || !Array.isArray(question.options) || !question.options.length || new Set(question.options).size !== question.options.length || question.options.some(value => typeof value !== 'string' || !value.trim())) throw new Error('Invalid verification question fixture');
      return { id: question.id, displayName: question.question, label: question.question, inputType: 'radio', required: true, options: question.options.map(value => ({ value, label: value })) };
    });
  }
  if (!surface.mapping) throw new Error(`Missing fresh-start surface mapping: ${page}`);
  return resolveMappedFields(surface.mapping, { page, person: surface.for ?? 'self', siteId, source: source.fields });
}
