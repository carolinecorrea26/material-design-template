import type { PageId } from "./identities";
import type { CoverageCategoryId, CoverageUnderwritingType } from "./coverage";
import type { DatabaseSchema } from "../persistence/types";
import type { RuleProvenance } from "./effectiveSite";

export type FlowGate =
  | { kind: "selected-category"; categoryIds: CoverageCategoryId[] }
  | { kind: "selected-underwriting-type"; underwritingTypes: CoverageUnderwritingType[] }
  | { kind: "selected-coverage"; categoryId: CoverageCategoryId; underwritingType: CoverageUnderwritingType }
  | { kind: "selected-rider"; riderId: string };
export type FlowGateDefinition = { pageId: PageId; gate: FlowGate };
export type RoutingRuleExecution = { kind: "page-routing"; gates: FlowGateDefinition[] };
type RoutingData = Pick<DatabaseSchema, "rules" | "ruleAssignments" | "ruleConditions" | "pages">;
type Configuration = { key: string; value: unknown; provenance: RuleProvenance[] };
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const categories: CoverageCategoryId[] = ["LI", "AD", "DI", "OO", "SH"];
const pathways: CoverageUnderwritingType[] = ["QD", "FUW", "GI", "SI", "NA", "NCGI", "TELE"];
const category = (value: unknown): value is CoverageCategoryId => categories.some(key => key === value);
const pathway = (value: unknown): value is CoverageUnderwritingType => pathways.some(key => key === value);
const list = <T>(value: unknown, check: (value: unknown) => value is T): value is T[] => Array.isArray(value) && value.length > 0 && value.every(check) && new Set(value).size === value.length;
export function isFlowGate(value: unknown): value is FlowGate {
  if (!object(value)) return false;
  const only = (...keys: string[]) => Object.keys(value).every(key => ["kind", ...keys].includes(key));
  if (value.kind === "selected-category") return only("categoryIds") && list(value.categoryIds, category);
  if (value.kind === "selected-underwriting-type") return only("underwritingTypes") && list(value.underwritingTypes, pathway);
  if (value.kind === "selected-coverage") return only("categoryId", "underwritingType") && category(value.categoryId) && pathway(value.underwritingType);
  return value.kind === "selected-rider" && only("riderId") && typeof value.riderId === "string" && value.riderId.trim().length > 0;
}
export function parseFlowGates(value: unknown, pages: RoutingData["pages"]): FlowGateDefinition[] {
  if (!Array.isArray(value)) throw new Error("Invalid routing gates");
  const seen = new Set<string>();
  return value.map(row => {
    if (!object(row) || Object.keys(row).some(key => !["pageId", "gate"].includes(key)) || !isFlowGate(row.gate)) throw new Error("Invalid routing gate");
    const page = pages.find(page => page.key === row.pageId && page.definition.id === row.pageId);
    if (!page || seen.has(page.key)) throw new Error("Missing or duplicate routing page");
    seen.add(page.key);
    return { pageId: page.definition.id, gate: structuredClone(row.gate) };
  });
}

/** Exact references opt a saved revision into rule-owned routing. Rule prose and
 * other imported action/predicate types never become executable by implication. */
export function resolveRoutingRules(data: RoutingData, configuration: Configuration | undefined, siteKey: string, clientKey: string) {
  if (!configuration) return null;
  const value = configuration.value;
  if (Array.isArray(value)) return { source: "legacy" as const, definitions: parseFlowGates(value, data.pages), ruleKeys: [] as string[], provenance: [...configuration.provenance] };
  if (!object(value) || value.version !== 2 || value.source !== "rules" || !list(value.ruleKeys, (key): key is string => typeof key === "string" && key.length > 0)
    || Object.keys(value).some(key => !["version", "source", "ruleKeys"].includes(key))) throw new Error("Invalid routing rule references");
  const definitions: FlowGateDefinition[] = [];
  const provenance = [...configuration.provenance];
  for (const key of value.ruleKeys) {
    const rows = data.rules.filter(row => row.key === key);
    const assignments = data.ruleAssignments.filter(row => row.ruleKey === key && (row.scope === "global" && row.clientKey === null && row.siteKey === null
      || row.scope === "client" && row.clientKey === clientKey && row.siteKey === null || row.scope === "site" && row.siteKey === siteKey && row.clientKey === null));
    if (rows.length !== 1 || !assignments.length || new Set(assignments.map(row => row.scope)).size !== assignments.length) throw new Error(`Missing or ambiguous routing rule assignment: ${key}`);
    const rule = rows[0];
    if (rule.definition.id !== key || rule.definition.documentationStatus !== "current" || !object(rule.definition.execution)
      || rule.definition.execution.kind !== "page-routing" || Object.keys(rule.definition.execution).some(key => !["kind", "gates"].includes(key))) throw new Error(`Invalid executable routing rule: ${key}`);
    // Conditions and dependencies require separate semantics; do not silently
    // ignore them when a routing definition claims unconditional execution.
    if (rule.definition.dependsOn?.length || data.ruleConditions.some(row => row.ruleKey === key)) throw new Error(`Unsupported routing rule dependency: ${key}`);
    const gates = parseFlowGates(rule.definition.execution.gates, data.pages);
    if (!gates.length) throw new Error(`Empty routing rule: ${key}`);
    definitions.push(...gates);
    provenance.push({ table: "rules", key, sourceReference: rule.sourceReference }, ...assignments.map(row => ({ table: "ruleAssignments", key: row.key, sourceReference: row.sourceReference })));
  }
  if (new Set(definitions.map(row => row.pageId)).size !== definitions.length) throw new Error("Conflicting routing rules for a page");
  return { source: "rules" as const, definitions, ruleKeys: [...value.ruleKeys], provenance };
}
