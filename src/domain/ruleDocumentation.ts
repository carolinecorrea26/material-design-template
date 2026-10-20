import type { DatabaseSchema } from "../persistence/types";

/** Documentation links never activate behavior. Only an explicitly supported
 * execution contract may do so; historical prose remains descriptive. */
export function materializeRuleDocumentation(rule: DatabaseSchema["rules"][number], action: DatabaseSchema["ruleActions"][number]) {
  const value = action.definition;
  if (action.ruleKey !== rule.key) throw new Error(`Mismatched rule documentation: ${action.key}`);
  if (value.kind === "rule-documentation") {
    if (value.version !== 2 || Object.keys(value).some(key => !["kind", "version"].includes(key))) throw new Error(`Competing rule documentation: ${action.key}`);
    return { kind: "documented-behavior" as const, description: rule.definition.behavior, source: rule.definition.ref };
  }
  if (value.kind !== "documented-behavior" || typeof value.description !== "string" || typeof value.source !== "string") throw new Error(`Invalid rule documentation: ${action.key}`);
  return value;
}
