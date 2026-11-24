import paymentOrder from '../../../requirements/mappings/page-sections/payment.json';
import type { RequirementPage } from '../../domain/requirementCatalog.mjs';
import { requirementPageSections } from '../../domain/requirementPagePresentation.mjs';
import { requirementText } from '../../domain/requirementContent';
import type { PageSectionConfig } from '../pageSections/types';
import payment from '../../../requirements/parked/payment.json';
import { resolveMappedFields } from '../../domain/requirementFields';
import type { FieldDefinition } from './types';

type PaymentFieldId = 'payment-information-opt-in' | 'payment-method' | 'payment-frequency' | 'payment-shared-method' | 'payment-shared-frequency' | 'bank-name-on-account' | 'bank-institution' | 'bank-routing-number' | 'bank-account-number' | 'bank-authorization';
/** Inspection/default adapter of the same fields compiled into Payment's surfaces. */
export const paymentFieldDefinitions = Object.fromEntries(resolveMappedFields(payment.fieldMapping).map(field => [field.id, field])) as Record<PaymentFieldId, FieldDefinition>;
export const paymentMethodOptions = paymentFieldDefinitions['payment-method'].options!;
export const paymentFrequencyOptions = paymentFieldDefinitions['payment-frequency'].options!;
export const PAYMENT_INFO_OPT_IN_FIELD_ID = 'payment-information-opt-in';
export const paymentInfoOptInField = paymentFieldDefinitions[PAYMENT_INFO_OPT_IN_FIELD_ID];
export const paymentDefaultSurfaces = Object.fromEntries(Object.entries(payment.surfaces).map(([name, surface]) => [name, surface.definition.fields.map(binding => paymentFieldDefinitions[binding.fieldKey as PaymentFieldId])]));

/** Source-only placement projection for standalone examples; application pages use compiled sections. */
export const paymentDefaultSections = requirementPageSections(payment as RequirementPage, { payment: paymentOrder.sections }).map(([, section]) => ({
  id: section.id as PageSectionConfig['id'], pageId: 'payment' as const, fieldIds: [],
  ...(section.title ? { title: requirementText(section.title) } : {}),
}));
