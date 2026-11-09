import { describe, expect, it } from "vitest";
import { fieldValidationChecks, getFieldValidationRules } from "./fieldValidation";
import { resolveMappedFields } from '../domain/requirementFields';

describe("shared form and Library validation", () => {
  it.each(["radio", "dropdown", "searchable-select"] as const)("validates restored %s answers against the configured choices", inputType => {
    const field = { id: "choice", label: "Choice", inputType, options: [{ value: "rn", label: "RN" }] };
    const validate = getFieldValidationRules(field).validate!;
    expect(validate("rn")).toBe(true);
    for (const value of ["RN", "unknown", false, [], {}]) expect(validate(value)).toContain("Select an available");
    expect(validate("")).toBe(true);
  });
  it("preserves optional email blanks and rejects malformed addresses", () => {
    const field = { id: "email", label: "Email", inputType: "text" as const, format: "email" as const };
    const rules = getFieldValidationRules(field);
    expect(rules.required).toBeUndefined();
    expect(rules.validate!("")).toBe(true);
    expect(rules.validate!("invalid")).toBe("Enter a valid email address.");
    expect(rules.validate!("person@example.com")).toBe(true);
    expect(fieldValidationChecks(field)[0].message).toBe(rules.validate!("invalid"));
  });
  it("requires a true checkbox or a nonempty selection", () => {
    const checkbox = getFieldValidationRules({ id: "consent", label: "Consent", inputType: "checkbox", required: true });
    expect(checkbox.validate!(false)).toBe("Consent is required.");
    expect(checkbox.validate!(true)).toBe(true);
    const group = getFieldValidationRules({ id: "choices", label: "Choices", inputType: "multi-select", required: true });
    expect(group.validate!([])).toBe("Select at least one option.");
    expect(group.validate!(["choice"])).toBe(true);
  });
  it("uses the configured decimal policy and rejects negative and exponent values", () => {
    const base = { id: "amount", label: "Amount", inputType: "number" as const };
    const integer = getFieldValidationRules(base).validate!;
    const decimal = getFieldValidationRules({ ...base, allowDecimal: true }).validate!;
    expect(integer("1.5")).toBe("Enter a valid nonnegative number.");
    expect(decimal("1.5")).toBe(true);
    expect(decimal("-1")).toBe("Enter a valid nonnegative number.");
    expect(decimal("1e3")).toBe("Enter a valid nonnegative number.");
    expect(integer("0")).toBe(true);
  });
  it("lists the effective format check when it supersedes a postal-code check", () => {
    const field = { id: "email", label: "Email", inputType: "text" as const, autoComplete: "postal-code", format: "email" as const, required: true };
    expect(fieldValidationChecks(field).map(check => check.rule)).toEqual(["Required", "Valid email address"]);
    expect(getFieldValidationRules(field).required).toBe("Email is required.");
  });
});

it('applies ASCE identifier restrictions without restricting global alphanumeric identifiers', () => {
  const id = (siteId?: string) => resolveMappedFields({ component: 'membership' }, { siteId, includeAll: true }).find(field => field.id === 'member-id')!;
  expect(id('asce')).toMatchObject({ inputType: 'text', format: 'digits', inputMode: 'numeric', minLength: 6 });
  const validate = getFieldValidationRules(id('asce')).validate!;
  expect(validate('001234')).toBe(true);
  expect(validate('12345')).toBe('Membership ID must be at least 6 characters.');
  expect(validate('ABC123')).toBe('Membership ID must contain digits only.');
  expect(id()).not.toHaveProperty('format');
  expect(getFieldValidationRules(id()).validate).toBeUndefined();
});

it.each(['10001', '10001-1234', '100011234', 'K1A 0B1', 'k1a0b1', '00901', '00000'])('accepts ZIP/postal format %s independently of location lookup', value => {
  const field = resolveMappedFields({ component: 'eligibility' }).find(field => field.id === 'zip-postal-code')!;
  expect(getFieldValidationRules(field).validate!(value)).toBe(true);
});
it.each(['1234', '10001-12', 'K1A', 'K1A 0B', '1234567890'])('rejects incomplete ZIP/postal format %s on validation', value => {
  expect(getFieldValidationRules({ id: 'zip', label: 'ZIP', inputType: 'text', format: 'postal-code', autoComplete: 'off' }).validate!(value)).toBe('Enter a valid ZIP / Postal Code.');
});

it("combines authored lengths with numeric/format checks and measures currency digits", () => {
  const integer = getFieldValidationRules({ id: 'years', label: 'Years', inputType: 'number', maxLength: 2 }).validate!;
  expect(integer('12')).toBe(true);
  expect(integer('123')).toContain('2 characters');
  expect(integer('ab')).toContain('nonnegative');
  const amount = getFieldValidationRules({ id: 'amount', label: 'Amount', inputType: 'text', format: 'currency', maxLength: 4 }).validate!;
  expect(amount('$1,000')).toBe(true);
  expect(amount('$10,000')).toContain('4 characters');
});

it.each(['00/2020', '13/2020', '1/2020', '012020', 'ab/2020', '01/20'])('rejects invalid health month/year %s in the shared editor', value => {
  const validate = getFieldValidationRules({ id: 'onset', label: 'Date of onset', inputType: 'text', format: 'month-year' }).validate!;
  expect(validate(value)).toContain('valid month and year');
  expect(validate('01/2020')).toBe(true);
  expect(validate('12/2020')).toBe(true);
});
it.each([['2024-02-29', true], ['2026-02-29', false], ['2026-02-30', false], ['2026-13-01', false]] as const)('checks calendar date %s in direct and dialog fields', (value, valid) => {
  const result = getFieldValidationRules({ id: 'treatment', label: 'Treatment date', inputType: 'date' }).validate!(value);
  expect(result === true).toBe(valid);
});
