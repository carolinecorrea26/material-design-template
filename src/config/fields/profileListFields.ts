import profile from '../../../requirements/parked/profile.json';
import { resolveMappedFields } from '../../domain/requirementFields';

/** Default/inspection adapter of the same fresh-start dialog used by both adult collections. */
const definitions = new Map(resolveMappedFields(profile.fieldMapping, { page: profile.page }).map(field => [field.id, field]));
const bindings = profile.surfaces.disabilityCompany.definition.fields;
export const disabilityCompanyFields = bindings.map(binding => {
  const field = definitions.get(binding.fieldKey);
  if (!field) throw new Error(`Missing configured disability record field: ${binding.fieldKey}`);
  return field;
});
export const disabilityCompanyMapping = {
  fields: disabilityCompanyFields,
  fieldToKey: Object.fromEntries(bindings.map(binding => [binding.fieldKey, binding.valueKey])),
};
