import { applicantHasSelectedCategory } from '../config/flowGates';
import type { ApplicationFormValues } from '../app/ApplicationFormContext';
import type { PrototypeLibrary } from './prototypeLibrary';
import { validateFieldCollection } from './fieldCollections';
import { requirementValidationMessage } from './requirementValidations';
import { getClientPageFields } from '../config/clientFields/getClientPageFields';

/** Hidden/inapplicable carrier answers never block submission. Validate restored records too. */
export function validateProfile(values: ApplicationFormValues, library: PrototypeLibrary): string | undefined {
  const available = new Set(getClientPageFields('profile', values).map(field => field.id));
  for (const applicant of ['self', 'spouse'] as const) {
    const question = applicant === 'self' ? 'has-disability-insurance' : 'spouse-has-disability-insurance';
    if (!available.has(question) || !applicantHasSelectedCategory(values, applicant, ['DI'], library.products) || values[question] !== 'yes') continue;
    const collection = library.fieldCollections[`${applicant}DisabilityCompanies`];
    if (!collection) throw new Error(`Missing configured disability collection for ${applicant}`);
    const records = values[collection.name];
    if (!Array.isArray(records) || records.length < (collection.minItems ?? 0)) return requirementValidationMessage('profile-disability-record-required', { applicant: library.client.applicantLabels?.[applicant === 'self' ? 'member' : 'spouse'] ?? (applicant === 'self' ? 'member' : 'spouse') });
    const error = validateFieldCollection(collection, records);
    if (error) return error;
  }
}
