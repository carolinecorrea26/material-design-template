import { describe, expect, it } from "vitest";
import { evaluateVisibilityRules } from "./evaluateVisibilityRules";
import type { SectionVisibilityRule } from "./types";

describe("evaluateVisibilityRules", () => {
  it("is visible when no rules are given", () => {
    expect(evaluateVisibilityRules(undefined, {})).toBe(true);
    expect(evaluateVisibilityRules([], {})).toBe(true);
  });

  it("evaluates equals", () => {
    const rules: SectionVisibilityRule[] = [{ fieldId: "membership", equals: "new" }];
    expect(evaluateVisibilityRules(rules, { membership: "new" })).toBe(true);
    expect(evaluateVisibilityRules(rules, { membership: "current" })).toBe(false);
    expect(evaluateVisibilityRules(rules, {})).toBe(false);
  });

  it("evaluates notEquals", () => {
    const rules: SectionVisibilityRule[] = [{ fieldId: "membership", notEquals: "new" }];
    expect(evaluateVisibilityRules(rules, { membership: "current" })).toBe(true);
    expect(evaluateVisibilityRules(rules, { membership: "new" })).toBe(false);
  });

  it("evaluates includes against an array value", () => {
    const rules: SectionVisibilityRule[] = [{ fieldId: "dependents", includes: "spouse" }];
    expect(evaluateVisibilityRules(rules, { dependents: ["spouse", "child"] })).toBe(true);
    expect(evaluateVisibilityRules(rules, { dependents: ["child"] })).toBe(false);
    expect(evaluateVisibilityRules(rules, { dependents: "spouse" })).toBe(false);
  });

  it("requires every rule to match", () => {
    const rules: SectionVisibilityRule[] = [
      { fieldId: "dependents", includes: "spouse" },
      { fieldId: "spouse-smoker", equals: "yes" },
    ];
    expect(
      evaluateVisibilityRules(rules, { dependents: ["spouse"], "spouse-smoker": "yes" }),
    ).toBe(true);
    expect(
      evaluateVisibilityRules(rules, { dependents: ["spouse"], "spouse-smoker": "no" }),
    ).toBe(false);
  });
});
