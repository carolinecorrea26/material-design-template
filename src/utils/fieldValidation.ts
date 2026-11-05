import type { FieldDefinition } from "../domain/fields";

export type FieldValidationCheck = { rule: string; message: string; kind: "required" | "value"; validate: (value: unknown) => boolean };

/** Shared by the form renderer and Library: descriptions follow executable checks. */
export function fieldValidationChecks(field: FieldDefinition): FieldValidationCheck[] {
  const checks: FieldValidationCheck[] = [];
  const add = (rule: string, message: string, validate: FieldValidationCheck["validate"], kind: FieldValidationCheck["kind"] = "value") => checks.push({ rule, message, validate, kind });
  if (field.inputType === "checkbox") {
    if (field.required) add("Must be checked", `${field.label} is required.`, value => value === true);
    return checks;
  }
  if (field.inputType === "checkbox-group" || field.inputType === "multi-select") {
    if (field.required) add("Select at least one option", "Select at least one option.", value => Array.isArray(value) && value.length > 0);
    if (field.options?.length) add("Select available options", `Select available ${field.label} options.`, value => value === undefined || value === null || Array.isArray(value) && new Set(value).size === value.length && value.every(item => typeof item === "string" && field.options!.some(option => option.value === item)));
    return checks;
  }
  if (field.required) add("Required", `${field.label} is required.`, value => !!value, "required");
  if (["radio", "dropdown", "searchable-select"].includes(field.inputType) && field.options?.length) add("Select an available option", `Select an available ${field.label} option.`, value => value === undefined || value === null || value === "" || typeof value === "string" && field.options!.some(option => option.value === value));
  if (field.maxLength !== undefined) add(`At most ${field.maxLength} characters`, `${field.label} must be ${field.maxLength} characters or fewer.`, value => !value || (field.format === 'currency' || field.format === 'percent' ? String(value).replace(/[^0-9]/g, '').length : String(value).length) <= field.maxLength!);
  let valueCheck: FieldValidationCheck | undefined;
  const format = (rule: string, message: string, validate: FieldValidationCheck["validate"]) => { valueCheck = { kind: "value", rule, message, validate: value => !value || validate(value) }; };
  const digits = (value: unknown) => String(value).replace(/\D/g, "");
  if (field.autoComplete === "postal-code") format("ZIP / postal code: at least 5 characters", "Enter a valid ZIP / Postal Code.", value => String(value).trim().length >= 5);
  if (field.format === "email") format("Valid email address", "Enter a valid email address.", value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)));
  if (field.format === "phone") format("Phone number: exactly 10 digits", "Enter a valid 10-digit phone number.", value => digits(value).length === 10);
  if (field.format === "ssn") format("SSN: exactly 9 digits", "Enter a valid 9-digit SSN.", value => digits(value).length === 9);
  if (field.format === "percent") format("Percentage: up to 3 digits", "Enter a percent value with up to 3 digits.", value => digits(value).length <= 3);
  if (field.format === "month-year") format("Month / year: valid month and 4-digit year (MM/YYYY)", "Enter a valid month and year (MM/YYYY).", value => /^(0[1-9]|1[0-2])\/\d{4}$/.test(String(value)));
  if (field.inputType === "date") format("Valid calendar date (YYYY-MM-DD)", "Enter a valid date.", value => /^\d{4}-\d{2}-\d{2}$/.test(String(value)) && Number.isFinite(Date.parse(String(value))) && new Date(String(value)).toISOString().slice(0, 10) === value);
  if (field.inputType === "number") format(field.allowDecimal ? "Nonnegative number; decimals allowed" : "Nonnegative whole number", "Enter a valid nonnegative number.", value => (field.allowDecimal ? /^\d+(\.\d+)?$/ : /^\d+$/).test(String(value)));
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
