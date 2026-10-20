import { expect, it } from "vitest";
import { isConditionDefinition } from "./conditionValidation";
import { evaluateCondition } from "../config/conditions/evaluateConditions";
import type { ConditionDefinition } from "./rules";

const valid: ConditionDefinition = { id: "condition-test", match: "all", conditions: [{ fieldId: "dependents", operator: "includes", value: "spouse" }] };
it.each([
  { ...valid, match: "unknown" }, { ...valid, conditions: [] }, { ...valid, conditions: [{ ...valid.conditions[0], operator: "unknown" }] },
  { ...valid, conditions: [{ ...valid.conditions[0], value: ["spouse"] }] }, { ...valid, conditions: [null] },
])("rejects unsupported condition shapes without producing an affirmative result", definition => {
  expect(isConditionDefinition(definition)).toBe(false);
  expect(evaluateCondition(definition as ConditionDefinition, { dependents: ["spouse"] })).toBe(false);
});
it("preserves all/any and the three supported operators", () => {
  expect(evaluateCondition(valid, { dependents: ["spouse"] })).toBe(true);
  expect(evaluateCondition(valid, { dependents: [] })).toBe(false);
  const conditions: ConditionDefinition["conditions"] = [{ fieldId: "membership", operator: "equals", value: "new" }, { fieldId: "membership", operator: "notEquals", value: "current" }];
  expect(evaluateCondition({ ...valid, conditions }, { membership: "new" })).toBe(true);
  expect(evaluateCondition({ ...valid, conditions }, { membership: "current" })).toBe(false);
  expect(evaluateCondition({ ...valid, match: "any", conditions }, { membership: "other" })).toBe(true);
});
