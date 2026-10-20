import { describe, expect, it } from "vitest";
import { fieldValidationChecks, getFieldValidationRules } from "./fieldValidation";

describe("shared form and Library validation", () => {
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

it("combines authored lengths with numeric/format checks and measures currency digits", () => {
  const integer = getFieldValidationRules({ id: 'years', label: 'Years', inputType: 'number', maxLength: 2 }).validate!;
  expect(integer('12')).toBe(true);
  expect(integer('123')).toContain('2 characters');
  expect(integer('ab')).toContain('nonnegative');
  const amount = getFieldValidationRules({ id: 'amount', label: 'Amount', inputType: 'text', format: 'currency', maxLength: 4 }).validate!;
  expect(amount('$1,000')).toBe(true);
  expect(amount('$10,000')).toContain('4 characters');
});
