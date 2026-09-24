import type { ApplicationFormValues } from "../../app/ApplicationFormContext";
import { conditionDefinitions } from "./conditions";
import type { ConditionClause, ConditionDefinition, ConditionId } from "./types";

const conditionsById = new Map(conditionDefinitions.map((definition) => [definition.id, definition]));

export function getConditionDefinition(conditionId: ConditionId) {
  return conditionsById.get(conditionId);
}

function evaluateClause(clause: ConditionClause, values: ApplicationFormValues): boolean {
  const actual = values[clause.fieldId];
  if (clause.operator === "equals") return actual === clause.value;
  if (clause.operator === "notEquals") return actual !== clause.value;
  return Array.isArray(actual) && typeof clause.value === "string" && actual.includes(clause.value);
}

export function evaluateCondition(
  definition: ConditionDefinition,
  values: ApplicationFormValues,
): boolean {
  const matches = definition.conditions.map((clause) => evaluateClause(clause, values));
  return definition.match === "any" ? matches.some(Boolean) : matches.every(Boolean);
}

export function evaluateConditionDefinition(
  conditionId: ConditionId,
  values: ApplicationFormValues,
): boolean {
  const definition = getConditionDefinition(conditionId);
  return definition ? evaluateCondition(definition, values) : false;
}

export function formatConditionDefinition(conditionId: ConditionId): string {
  const definition = getConditionDefinition(conditionId);
  if (!definition) return conditionId;
  const joiner = definition.match === "any" ? " OR " : " AND ";
  const expression = definition.conditions
    .map(({ fieldId, operator, value }) => `${fieldId} ${operator} ${String(value)}`)
    .join(joiner);
  return expression;
}
