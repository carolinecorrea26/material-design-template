import type { FieldDefinition } from './fields';
/** A companion defaults to the number's own namespace, never another phone's value. */
export const getPhoneTypeFieldId = (field: Pick<FieldDefinition, 'id' | 'phoneTypeFieldId'>) => field.phoneTypeFieldId ?? `${field.id}-type`;

/** Distinct phone answers cannot share a number/type binding. Repeated uses of one answer remain valid. */
export function validatePhoneFieldBindings(fields: FieldDefinition[]) {
  const owners = new Map<string, string>();
  for (const field of fields) {
    if (field.format !== 'phone' || field.showPhoneTypeSelector === false) continue;
    const id = getPhoneTypeFieldId(field);
    if (id === field.id) throw new Error(`Phone number and type require distinct field IDs: ${field.id}`);
    const previous = owners.get(id);
    if (previous && previous !== field.id) throw new Error(`Shared phone type binding: ${previous} and ${field.id} use ${id}`);
    const companion = fields.find(field => field.id === id);
    if (!companion || companion.format === 'phone' || !companion.options?.length) throw new Error(`Missing configured phone type field: ${id}`);
    owners.set(id, field.id);
  }
}
