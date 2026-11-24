import { isConditionDefinition, evaluateConditionClause } from "../../domain/conditionValidation";
import { getPrototypeLibrary } from "../../domain/prototypeLibrary";
import type { ApplicationFormValues } from "../../app/ApplicationFormContext";
import { conditionDefinitions } from "./conditions";
import type { ConditionDefinition, ConditionId } from "./types";
import type { FieldDefinition } from "../../domain/fields";

const conditionsById = new Map(conditionDefinitions.map((definition) => [definition.id, definition]));

export function getConditionDefinition(conditionId: ConditionId) {
  const library = getPrototypeLibrary();
  return library ? library.site.configuration.conditions.find(c => c.value.definition.id === conditionId)?.value.definition : conditionsById.get(conditionId);
}

export function evaluateCondition(
  definition: ConditionDefinition,
  values: ApplicationFormValues,
  fields: FieldDefinition[] = [],
): boolean {
  if (!isConditionDefinition(definition)) return false;
  const matches = definition.conditions.map((clause) => evaluateConditionClause(clause, values, fields));
  return definition.match === "any" ? matches.some(Boolean) : matches.every(Boolean);
}

export function evaluateConditionDefinition(
  conditionId: ConditionId,
  values: ApplicationFormValues,
  fields: FieldDefinition[] = [],
): boolean {
  const definition = getConditionDefinition(conditionId);
  // Cross-page predicates (for example Membership outcomes on Eligibility)
  // use the same effective field metadata as their owning page. Local supplied
  // definitions retain precedence for synthetic and placement-specific checks.
  const ids = new Set(fields.map(field => field.id));
  const inherited = getPrototypeLibrary()?.site.configuration.pages.flatMap(page => page.fields.filter(field => field.included && !ids.has(field.definition.id)).map(field => field.definition)) ?? [];
  return definition ? evaluateCondition(definition, values, [...fields, ...inherited]) : false;
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
