import { requirementValidationMessage } from "../domain/requirementValidations";
import type { FieldDefinition } from "../domain/fields";
import { isValidZipOrPostalCode } from './zipToStateProvince';

export type FieldValidationCheck = { rule: string; message: string; kind: "required" | "value"; validate: (value: unknown) => boolean };

/** Shared by the form renderer and Library: descriptions follow executable checks. */
export function fieldValidationChecks(field: FieldDefinition): FieldValidationCheck[] {
  const checks: FieldValidationCheck[] = [];
  const add = (rule: string, message: string, validate: FieldValidationCheck["validate"], kind: FieldValidationCheck["kind"] = "value") => checks.push({ rule, message, validate, kind });
  if (field.inputType === "checkbox") {
    if (field.required) add("Must be checked", requirementValidationMessage("required-fields", { label: field.label }), value => value === true);
    return checks;
  }
  if (field.inputType === "checkbox-group" || field.inputType === "multi-select") {
    if (field.required) add("Select at least one option", requirementValidationMessage("required-selection"), value => Array.isArray(value) && value.length > 0);
    if (field.options?.length) add("Select available options", requirementValidationMessage("available-selections", { label: field.label }), value => value === undefined || value === null || Array.isArray(value) && new Set(value).size === value.length && value.every(item => typeof item === "string" && field.options!.some(option => option.value === item)));
    return checks;
  }
  if (field.required) add("Required", requirementValidationMessage("required-fields", { label: field.label }), value => !!value, "required");
  if (field.minLength !== undefined) add(`At least ${field.minLength} characters`, requirementValidationMessage('field-minimum-length', { label: field.label, minimumLength: String(field.minLength) }), value => !value || String(value).length >= field.minLength!);
  if (["radio", "dropdown", "searchable-select"].includes(field.inputType) && field.options?.length) add("Select an available option", requirementValidationMessage("available-selection", { label: field.label }), value => value === undefined || value === null || value === "" || typeof value === "string" && field.options!.some(option => option.value === value));
  if (field.maxLength !== undefined) add(`At most ${field.maxLength} characters`, requirementValidationMessage("field-maximum-length", { label: field.label, maximumLength: String(field.maxLength) }), value => !value || (field.format === 'currency' || field.format === 'percent' ? String(value).replace(/[^0-9]/g, '').length : String(value).length) <= field.maxLength!);
  let valueCheck: FieldValidationCheck | undefined;
  const format = (rule: string, message: string, validate: FieldValidationCheck["validate"]) => { valueCheck = { kind: "value", rule, message, validate: value => !value || validate(value) }; };
  const digits = (value: unknown) => String(value).replace(/\D/g, "");
  if (field.format === 'postal-code' || field.autoComplete === "postal-code") format("US ZIP (5 or 9 digits) or Canadian postal code", requirementValidationMessage("postal-code-format"), value => isValidZipOrPostalCode(String(value)));
  if (field.format === 'digits') format('Digits only', requirementValidationMessage('field-digits', { label: field.label }), value => /^\d+$/.test(String(value)));
  if (field.format === "email") format("Valid email address", requirementValidationMessage("field-email"), value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)));
  if (field.format === "phone") format("Phone number: exactly 10 digits", requirementValidationMessage("field-phone"), value => digits(value).length === 10);
  if (field.format === "ssn") format("SSN: exactly 9 digits", requirementValidationMessage("field-ssn"), value => digits(value).length === 9);
  if (field.format === "percent") format("Percentage: up to 3 digits", requirementValidationMessage("field-percent"), value => digits(value).length <= 3);
  if (field.format === "month-year") format("Month / year: valid month and 4-digit year (MM/YYYY)", requirementValidationMessage("field-month-year"), value => /^(0[1-9]|1[0-2])\/\d{4}$/.test(String(value)));
  if (field.inputType === "date") format("Valid calendar date (YYYY-MM-DD)", requirementValidationMessage("date-value-format"), value => /^\d{4}-\d{2}-\d{2}$/.test(String(value)) && Number.isFinite(Date.parse(String(value))) && new Date(String(value)).toISOString().slice(0, 10) === value);
  if (field.inputType === "number") format(field.allowDecimal ? "Nonnegative number; decimals allowed" : "Nonnegative whole number", requirementValidationMessage("field-number"), value => (field.allowDecimal ? /^\d+(\.\d+)?$/ : /^\d+$/).test(String(value)));
  if (valueCheck) checks.push(valueCheck);
  return checks;
}

export function getFieldValidationRules(field: FieldDefinition) {
  const rules: { required?: string; validate?: (value: unknown) => true | string } = {};
  const checks = fieldValidationChecks(field);
  const required = checks.find(check => check.kind === 'required');
  if (required) rules.required = required.message;
  const valueChecks = checks.filter(check => check.kind !== 'required');
  if (valueChecks.length) rules.validate = value => valueChecks.find(check => !check.validate(value))?.message ?? true;
  return rules;
}
