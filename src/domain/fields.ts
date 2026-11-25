import type { ConditionId } from "./rules";

let installedFieldDefinitions: ReadonlyMap<string, FieldDefinition> | null = null;
export function installFieldDefinitions(fields: FieldDefinition[] | null) {
  installedFieldDefinitions = fields ? new Map(fields.map(field => [field.id, field])) : null;
}
export function activeFieldDefinitions() { return installedFieldDefinitions; }

export type FieldOption = {
  value: string;
  label: string;
  /** Semantic result of a configured choice, independent of its saved value. */
  outcome?: string;
};

export type FieldInputType =
  | "text"
  | "number"
  | "date"
  | "radio"
  | "dropdown"
  | "searchable-select"
  | "checkbox"
  | "checkbox-group"
  | "multi-select"
  | "percent";

export type FieldId =
  | "dividend-acknowledgement"
  | "dividend-first-name"
  | "dividend-last-name"
  | "dividend-birth-date"
  | "membership"
  | "membership-status"
  | "title"
  | "first-name"
  | "last-name"
  | "email"
  | "phone"
  | "active-military"
  | "actively-at-work"
  | "phone-type"
  | "zip-postal-code"
  | "state-province"
  | "birth-date"
  | "dependents"
  | "spouse-first-name"
  | "spouse-last-name"
  | "spouse-birth-date"
  | "spouse-membership"
  | "child-first-name"
  | "child-last-name"
  | "child-full-time-student"
  | "child-birth-date"
  | "child-gender"
  | "gender"
  | "smoker"
  | "tobacco-last-used"
  | "tobacco-products"
  | "average-monthly-income"
  | "hours-worked-per-week"
  | "monthly-business-expenses"
  | "business-expense-responsibility"
  | "spouse-gender"
  | "spouse-smoker"
  | "spouse-tobacco-last-used"
  | "spouse-tobacco-products"
  | "spouse-average-monthly-income"
  | "spouse-hours-worked-per-week"
  | "spouse-phone"
  | "spouse-phone-type"
  | "street-address"
  | "apt-suite"
  | "city"
  | "state"
  | "zip-code"
  | "correspondence-to"
  | "business-name"
  | "business-type"
  | "business-address-same-as-home"
  | "business-street-address"
  | "business-apt-suite"
  | "business-city"
  | "business-state"
  | "business-zip-code"
  | "business-phone"
  | "business-phone-type"
  | "spouse-email"
  | "physician-first-name"
  | "physician-last-name"
  | "physician-phone"
  | "medical-facility-name"
  | "medical-facility-street-address"
  | "medical-facility-apt-suite"
  | "medical-city"
  | "medical-state"
  | "medical-zip-code"
  | "height-feet"
  | "height-inches"
  | "weight-lbs"
  | "weight-12-months-ago-lbs"
  | "social-security-number"
  | "marital-status"
  | "has-drivers-license"
  | "drivers-license-number"
  | "drivers-license-state"
  | "intend-live-outside-us"
  | "outside-us-months"
  | "outside-us-country"
  | "travel-outside-us-six-months"
  | "travel-outside-us-country"
  | "spouse-height-feet"
  | "spouse-height-inches"
  | "spouse-weight-lbs"
  | "spouse-weight-12-months-ago-lbs"
  | "spouse-social-security-number"
  | "spouse-has-drivers-license"
  | "spouse-drivers-license-number"
  | "spouse-drivers-license-state"
  | "spouse-intend-live-outside-us"
  | "spouse-outside-us-months"
  | "spouse-outside-us-country"
  | "spouse-travel-outside-us-six-months"
  | "spouse-travel-outside-us-country"
  | "spouse-physician-first-name"
  | "spouse-physician-last-name"
  | "spouse-physician-phone"
  | "spouse-medical-facility-name"
  | "spouse-medical-facility-street-address"
  | "spouse-medical-facility-apt-suite"
  | "spouse-medical-city"
  | "spouse-medical-state"
  | "spouse-medical-zip-code"
  | "has-other-life-insurance"
  | "existing-life-insurance-amount"
  | "is-replacing-life-insurance"
  | "has-pending-life-insurance-applications"
  | "pending-life-insurance-amount"
  | "pending-life-insurance-company"
  | "has-disability-insurance"
  | "disability-carrier"
  | "disability-monthly-benefit"
  | "disability-benefit-period"
  | "disability-waiting-period"
  | "is-replacing-disability-insurance"
  | "disability-replacement-amount"
  | "total-net-worth"
  | "total-annual-unearned-income"
  | "is-self-employed"
  | "is-sole-proprietor"
  | "is-professional-corporation"
  | "sole-proprietor-gross-income"
  | "sole-proprietor-gross-earnings"
  | "sole-proprietor-business-expenses"
  | "professional-corporation-annual-salary"
  | "professional-corporation-s-corp-distribution"
  | "professional-corporation-dividends"
  | "professional-corporation-bonus"
  | "bonus-payment-frequency"
  | "professional-corporation-commission"
  | "commission-payment-frequency"
  | "professional-corporation-benefits-cost"
  | "years-self-employed"
  | "work-from-home"
  | "has-work-location-outside-home"
  | "work-location-details"
  | "spouse-has-other-life-insurance"
  | "spouse-existing-life-insurance-amount"
  | "spouse-is-replacing-life-insurance"
  | "spouse-has-pending-life-insurance-applications"
  | "spouse-pending-life-insurance-amount"
  | "spouse-pending-life-insurance-company"
  | "spouse-has-disability-insurance"
  | "spouse-disability-carrier"
  | "spouse-monthly-benefit"
  | "spouse-benefit-period"
  | "spouse-waiting-period"
  | "spouse-is-replacing-disability-insurance"
  | "spouse-disability-replacement-amount"
  | "bank-name-on-account"
  | "bank-institution"
  | "bank-routing-number"
  | "bank-account-number"
  | "bank-authorization"
  | "review-self-consent"
  | "review-spouse-consent"
  | "advisor-flow-type"
  | "advisor-email"
  | "advisor-phone"
  | "advisor-code"
  | "applicant-email"
  | "resume-phone"
  | "resume-email"
  | "resume-delivery-method"
  | "resume-security-code"
  | "waepa-declaration"
  | "waepa-attestation"
  | "waepa-employer"
  | "waepa-start-date"
  | "waepa-retired-employer"
  | "waepa-retirement-date"
  | "waepa-member-first-name"
  | "waepa-member-last-name"
  | "waepa-member-id"
  | "member-id"
  | "avma-vet-college"
  | "avma-graduation-year"
  | "avma-occupation"
  | "average-employees-6-months"
  | "ama-physician-type"
  | "ama-physician-title"
  | "ama-physician-first-name"
  | "ama-physician-last-name"
  | "ama-physician-birth-date"
  | "ama-physician-email"
  | "csea-performing-duties"
  | "csea-occupation-group";

export type FieldDefinition = {
  id: string;
  /** Selected configuration of this shared field, when it has variants. */
  configuration?: string;
  /** Supported shared variants, projected from the field's authored configurations. */
  configurations?: Record<string, { inputType: FieldInputType; label: string; placeholder?: string; labelVariant?: 'floating' | 'standard'; options?: FieldOption[]; optionSource?: string; optionOutcome?: string }>;
  optionSource?: string;
  optionOutcome?: string;
  /** Stable catalog name, separate from applicant-facing input copy. */
  displayName?: string;
  defaultValue?: string | boolean | string[];
  label: string;
  tooltip?: string;
  inputType: FieldInputType;
  required?: boolean;
  /** Optional authored limit, measured in unformatted characters. */
  maxLength?: number;
  minLength?: number;
  minimum?: number;
  maximum?: number;
  underwritingVariants?: Partial<Record<'default' | 'QD', { label?: string; hidden?: boolean }>>;
  coverageCategories?: string[];
  /** Optional only when every active election for this person is listed. */
  optionalForProducts?: string[];
  helperTextWhen?: { values: string[]; text: string; marker?: string };
  /** Permit fractional numeric facts, such as years of employment. */
  allowDecimal?: boolean;
  placeholder?: string;
  helperText?: string;
  options?: FieldOption[];
  optionExclusions?: Array<{ conditionId: ConditionId; values: string[] }>;
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel" | "numeric" | "decimal";
  format?: "email" | "phone" | "ssn" | "currency" | "percent" | "month-year" | "digits" | "postal-code" | "alphanumeric";
  labelVariant?: "floating" | "standard";
  multiline?: boolean;
  minRows?: number;
  disabled?: boolean;
  /** Override the companion field ID (default: "<number-field-id>-type"); distinct answers must not share it */
  phoneTypeFieldId?: string;
  /** Whether to show the companion phone type selector (default: true) */
  showPhoneTypeSelector?: boolean;
  /** Canonical executable visibility source for any configurable field. */
  visibilityConditionId?: ConditionId;
  /** Same-page questions that must remain visible before this follow-up can participate. */
  visibilityDependencies?: string[];
};

export type Field = { id: FieldId };

/** Long labels sit above the control so they can wrap without clipping. */
export function getLabelVariant(field: Pick<FieldDefinition, "label" | "labelVariant">) {
  return field.labelVariant ?? ((field.label?.length ?? 0) >= 40 ? "standard" : "floating");
}

/** Library shows product-dependent requiredness without pretending an election is active. */
export function fieldRequirednessLabel(field: Pick<FieldDefinition, 'required' | 'optionalForProducts'>): string {
  return field.required && field.optionalForProducts?.length ? 'By product' : field.required ? 'Yes' : 'No';
}
