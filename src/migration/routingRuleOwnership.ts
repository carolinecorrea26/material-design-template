import type { DatabaseSchema, Json } from "../persistence/types";
import { parseFlowGates, type RoutingRuleExecution } from "../domain/routingRules";
import { libraryMetadata } from "../domain/provenance";

const owners: Record<string, string> = {
  beneficiary: "rule-application-flow-beneficiary-routing",
  "health-si": "rule-application-flow-health-si-routing",
  "health-qd": "rule-application-flow-health-qd-routing",
  "health-li": "rule-application-flow-health-tele-supp-routing",
  "health-di": "rule-application-flow-health-tele-supp-routing",
  "health-cir": "rule-application-flow-health-uw-cir-routing",
};
const authority = "Shared routing rule ownership, October 19, 2026";

/** Reviewed exports only; the original array stays in ownership evidence.
 * Existing rule identities and assignments are reused. Planned rule prose and
 * source-only normalized predicates/actions remain non-executable. */
export function consolidateRoutingRuleOwnership(db: DatabaseSchema) {
  const definition = db.configurationDefinitions.find(row => row.key === "routing.gates");
  const values = db.configurationValues.filter(row => row.configurationKey === definition?.key);
  if (!definition || values.length !== 1 || values[0].scope !== "global") throw new Error("Expected one global routing source");
  const configuration = values[0];
  if (!Array.isArray(configuration.value)) return; // Already compiled; effective validation checks references.
  const gates = parseFlowGates(configuration.value, db.pages);
  if (gates.length !== Object.keys(owners).length || gates.some(row => !owners[row.pageId])) throw new Error("Unmapped routing source page");
  const executions = new Map<string, RoutingRuleExecution>();
  for (const gate of gates) {
    const key = owners[gate.pageId];
    const rules = db.rules.filter(row => row.key === key);
    if (rules.length !== 1 || rules[0].definition.id !== key || rules[0].definition.documentationStatus !== "current"
      || rules[0].definition.execution || rules[0].definition.dependsOn?.length || db.ruleConditions.some(row => row.ruleKey === key)
      || db.ruleAssignments.filter(row => row.ruleKey === key && row.scope === "global" && row.clientKey === null && row.siteKey === null).length !== 1) throw new Error(`Unresolved routing owner: ${key}`);
    const execution = executions.get(key) ?? { kind: "page-routing", gates: [] };
    execution.gates.push(gate);
    executions.set(key, execution);
  }
  const key = "ownership-evidence.routing.gates";
  if (!db.semanticRequirements.some(row => row.key === key)) db.semanticRequirements.push({ id: key, key, ...libraryMetadata("semanticRequirements", key, authority), domain: "information-ownership",
    subjectTable: "configurationDefinitions", subjectKey: definition.key, predicate: "shared-routing-rules", status: "documented",
    value: { authority, previousValue: structuredClone(configuration.value), ruleKeys: [...executions.keys()], previousRules: JSON.parse(JSON.stringify(db.rules.filter(row => executions.has(row.key)))),
      disposition: "Preserve existing template behavior; rule definitions own gates, assignments own applicability, configuration selects exact rules. Rule prose is documentation and does not activate behavior." } });
  for (const [key, execution] of executions) {
    const row = db.rules.find(row => row.key === key);
    if (!row) throw new Error("Missing captured routing owner");
    row.definition.execution = execution;
  }
  definition.definition.target = { kind: "site-routing-policy" };
  configuration.value = { version: 2, source: "rules", ruleKeys: [...executions.keys()] } satisfies Json;
}
