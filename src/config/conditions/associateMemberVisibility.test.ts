import { expect, it } from "vitest";
import { conditionDefinitions } from "./conditions";
import { evaluateCondition } from "./evaluateConditions";
import { isConditionDefinition } from "../../domain/conditionValidation";
it("ignores retained Associate Member answers in current-member drafts and requires a recognized new-member choice", () => {
  const condition = conditionDefinitions.find(row => row.id === "condition-waepa-associated-member")!;
  for (const value of ["spouse-associate", "child-associate", "parent-associate", "sibling-associate"]) {
    expect(evaluateCondition(condition, { membership: "new", "waepa-attestation": value })).toBe(true);
    expect(evaluateCondition(condition, { membership: "current", "waepa-attestation": value })).toBe(false);
  }
  for (const value of ["", "federal-active", "former-federal", "unknown"]) expect(evaluateCondition(condition, { membership: "new", "waepa-attestation": value })).toBe(false);
  for (const value of [[], ["one", "one"], [""], "one"]) expect(isConditionDefinition({ id: "condition-invalid-list", match: "all", conditions: [{ fieldId: "membership", operator: "oneOf", value }] })).toBe(false);
});
