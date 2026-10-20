import type { DatabaseSchema } from "../persistence/types";

/** A current documentation record is not proof of a generic executable rule.
 * Source patterns and imported disclosure expressions remain reference models. */
export function ruleAuthority(row: DatabaseSchema["rules"][number]) {
  const definition = row.definition;
  if (definition.documentationStatus === "planned") return { kind: "planned", label: "Planned; not executable", owner: definition.ref } as const;
  if (definition.execution?.kind === "page-routing") return { kind: "routing", label: "Executable routing definition; assignment required", owner: `rules/${row.key}` } as const;
  if (definition.area === "Patterns") return { kind: "source-pattern", label: "Source pattern; reference only", owner: definition.ref } as const;
  if (row.sourceReference?.startsWith("canonical:") || definition.ref.startsWith("canonical:") || row.key.startsWith("rule-mcr.")) return { kind: "source-reference", label: "Source model; execution owned elsewhere", owner: definition.ref } as const;
  return { kind: "documented-behavior", label: "Documented behavior; implementation owns execution", owner: definition.ref } as const;
}
