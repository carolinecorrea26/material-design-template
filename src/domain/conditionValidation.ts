import type { ConditionDefinition } from "./rules";

/** Only these predicate shapes are executable. Unknown operators must never
 * fall through to includes, and empty groups must not become unconditional. */
export function isConditionDefinition(value: unknown): value is ConditionDefinition {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const definition = value as Record<string, unknown>;
  return Object.keys(definition).every(key => ["id", "match", "conditions"].includes(key)) && typeof definition.id === "string" && definition.id.startsWith("condition-")
    && (definition.match === "all" || definition.match === "any")
    && Array.isArray(definition.conditions) && definition.conditions.length > 0
    && definition.conditions.every(clause => clause && typeof clause === "object" && !Array.isArray(clause)
      && Object.keys(clause).every(key => ["fieldId", "operator", "value"].includes(key))
      && typeof clause.fieldId === "string" && clause.fieldId.length > 0 && Object.hasOwn(clause, "value")
      && ["equals", "notEquals", "includes"].includes(clause.operator)
      && (clause.operator !== "includes" || typeof clause.value === "string"));
}
