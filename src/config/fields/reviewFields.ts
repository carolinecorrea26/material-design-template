import review from '../../../requirements/parked/review.json';
import { resolveMappedFields } from '../../domain/requirementFields';
import type { FieldDefinition } from './types';

/** Inspection defaults use the same raw fields and answer aliases as the page compiler. */
type ReviewFieldId = 'review-self-consent' | 'review-spouse-consent' | 'dividend-acknowledgement' | 'dividend-first-name' | 'dividend-last-name' | 'dividend-birth-date';
export const reviewFieldDefinitions = Object.fromEntries(Object.values(review.surfaces).flatMap(surface => {
  const person = 'for' in surface && surface.for === 'spouse' ? 'spouse' : 'self';
  const raw = new Map(resolveMappedFields(surface.mapping, { person }).map(field => [field.id, field]));
  const aliases: Record<string, { field: string }> = 'aliases' in surface ? surface.aliases : {};
  return surface.definition.fields.map(binding => {
    const alias = aliases[binding.fieldKey];
    const field = raw.get(alias?.field ?? binding.fieldKey);
    if (!field) throw new Error(`Missing configured Review field: ${binding.fieldKey}`);
    return [binding.fieldKey, { ...field, id: binding.fieldKey } as FieldDefinition];
  });
})) as Record<ReviewFieldId, FieldDefinition>;
