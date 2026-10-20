import { homeQuoteFieldIds } from '../config/fields/homeQuoteFields';
import { BENEFICIARY_INDIVIDUAL_FIELDS, BENEFICIARY_TRUST_FIELDS, beneficiaryInfoOptInField } from '../config/fields/beneficiaryFields';
import { detailsMapping as li } from '../config/fields/healthLiFields';
import { detailsMapping as si } from '../config/fields/healthSiFields';
import { QUESTIONS as di } from '../config/fields/healthDiFields';
import { needsCalculatorFields } from '../config/fields/needsCalculatorFields';
import { paymentInfoOptInField, paymentMethodOptions, paymentFrequencyOptions } from '../config/fields/paymentFields';
import { SECURITY_QUESTIONS } from '../config/fields/verificationFields';
import { fieldCatalog } from '../config/fields';
import type { FieldDefinition } from '../domain/fields';
import type { EffectiveSiteData } from '../domain/effectiveSite';
import type { Json } from '../persistence/types';
import { libraryMetadata } from '../domain/provenance';

export type { FieldSurfaceDefinition } from '../domain/fieldSurfaces';
import type { FieldSurfaceDefinition } from '../domain/fieldSurfaces';

/** Catalog defaults are inserted only by export or explicit snapshot conversion. */
export function fieldSurfaceDefaults() {
  const fields: FieldDefinition[] = [];
  const surfaces: Record<string, FieldSurfaceDefinition> = {};
  const add = (name: string, pageKey: string, label: string, definitions: FieldDefinition[], maxItems?: number, prefix = '', grid: string[] = []) => {
    fields.push(...definitions.map(field => ({ ...field, id: prefix + field.id })));
    surfaces[name] = { pageKey, label, ...(maxItems ? { maxItems } : {}), fields: definitions.map(field => ({ fieldKey: prefix + field.id, valueKey: field.id, ...(grid.includes(field.id) ? { grid: true } : {}) })) };
  };
  add('beneficiaryIndividual', 'beneficiary', 'Beneficiary', BENEFICIARY_INDIVIDUAL_FIELDS, 10, 'beneficiary-', ['firstName', 'lastName']);
  add('beneficiaryTrust', 'beneficiary', 'Trust', BENEFICIARY_TRUST_FIELDS, 10, 'beneficiary-');
  add('beneficiaryControls', 'beneficiary', 'Beneficiary', [beneficiaryInfoOptInField, { id: 'beneficiaryType', label: 'Beneficiary Type', inputType: 'radio', options: [{ value: 'individual', label: 'Individual' }, { value: 'trust', label: 'Trust' }] }]);
  add('healthLiDetails', 'health-li', 'details', li.fields, 10, 'health-li-detail-');
  add('healthSiDetails', 'health-si', 'details', si.fields, 10, 'health-si-detail-');
  for (const question of di) add(`healthDi${question.key}Details`, 'health-di', 'details', question.mapping.fields, 10, `health-di-${question.key}-detail-`);
  add('needsCalculator', 'home', 'Coverage needs calculator', needsCalculatorFields.map(field => ({ ...field, inputType: field.id === 'needs-years-to-replace' ? 'number' : 'text', maxLength: field.id === 'needs-years-to-replace' ? 2 : 10, inputMode: 'numeric', format: field.id === 'needs-years-to-replace' ? undefined : 'currency', helperText: field.id === 'needs-years-to-replace' ? 'A common recommendation is 10–12 years' : undefined })));
  add('quoteInputs', 'home', 'Quote calculator', [...homeQuoteFieldIds.map(id => fieldCatalog[id]),
    { id: 'quote-selection', label: 'Select for myself', inputType: 'checkbox' },
    { id: 'quote-amount', label: 'Benefit amount', inputType: 'dropdown' },
    { id: 'quote-monthly-amount', label: 'Monthly benefit amount', inputType: 'dropdown' },
    { id: 'quote-categories', label: 'Which coverage are you interested in?', inputType: 'checkbox-group', required: true },
    { id: 'quote-rate-frequency', label: 'Toggle between monthly and annual', inputType: 'radio', options: [{ value: 'monthly', label: 'Monthly' }, { value: 'annual', label: 'Annual' }] },
  ]);
  add('paymentControls', 'payment', 'Payment', [paymentInfoOptInField,
    { id: 'payment-method', label: 'Payment Method', inputType: 'radio', options: [...paymentMethodOptions, { value: 'credit-card', label: 'Credit card' }] },
    { id: 'payment-frequency', label: 'Payment Frequency', inputType: 'dropdown', placeholder: 'Select frequency', options: paymentFrequencyOptions.map(({ value, label }) => ({ value, label })) },
    { id: 'payment-shared-method', label: 'Payment method for all products', inputType: 'radio', required: true, options: [...paymentMethodOptions, { value: 'credit-card', label: 'Credit card' }] },
    { id: 'payment-shared-frequency', label: 'Payment frequency for all products', inputType: 'dropdown', required: true, placeholder: 'Select frequency', options: paymentFrequencyOptions.map(({ value, label }) => ({ value, label })) },
  ]);
  add('paymentBank', 'payment', 'Banking Information', ['bank-name-on-account', 'bank-institution', 'bank-routing-number', 'bank-account-number', 'bank-authorization'].map(id => (fieldCatalog as Record<string, FieldDefinition>)[id]));
  add('verificationControls', 'eligibility', 'Member verification', [{ id: 'verification-method', label: 'Choose how to provide verification', inputType: 'radio', required: true, options: [
    { value: 'text', label: 'Send text code' }, { value: 'voice', label: 'Send voice code' }, { value: 'security-questions', label: 'Answer security questions' }, { value: 'skip', label: 'Proceed without member verification' },
  ] }]);
  add('verificationQuestions', 'eligibility', 'Security questions', SECURITY_QUESTIONS.map(question => ({ id: question.id, label: question.question, inputType: 'radio', required: true, options: question.options.map(value => ({ value, label: value })) })));
  return { fields, surfaces };
}
export function migrateFieldSurfaceData(data: EffectiveSiteData) {
  const { fields, surfaces } = fieldSurfaceDefaults();
  const changes: string[] = [];
  const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, 'Stored field surface upgrade') });
  for (const field of fields) if (!data.fields.some(row => row.key === field.id)) {
    data.fields.push({ ...meta('fields', field.id), position: data.fields.length, definition: structuredClone(field) }); changes.push(`fields:${field.id}`);
  }
  if (data.configurationDefinitions.some(row => row.definition.path?.join('.') === 'fieldSurfaces')) return changes;
  const key = 'field-surfaces';
  data.configurationDefinitions.push({ ...meta('configurationDefinitions', key), position: data.configurationDefinitions.length, definition: { path: ['fieldSurfaces'], metadata: null } });
  data.configurationValues.push({ ...meta('configurationValues', `global.${key}`), position: data.configurationValues.length, configurationKey: key, scope: 'global', clientKey: null, siteKey: null, value: surfaces as unknown as Json });
  changes.push(`configurationDefinitions:${key}`, `configurationValues:global.${key}`);
  return changes;
}
