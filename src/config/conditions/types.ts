import type { FieldId } from "../fields/types";

export type ConditionId = `condition-${string}`;
export type ConditionOperator = "equals" | "notEquals" | "includes";

export type ConditionClause = {
  fieldId: FieldId;
  operator: ConditionOperator;
  value: unknown;
};

export type ConditionDefinition = {
  id: ConditionId;
  conditions: ConditionClause[];
  match: "all" | "any";
};
