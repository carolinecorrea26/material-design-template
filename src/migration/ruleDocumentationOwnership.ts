import type { DatabaseSchema } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { materializeRuleDocumentation } from "../domain/ruleDocumentation";

export function consolidateRuleDocumentationOwnership(db: DatabaseSchema) {
  const copies = db.ruleActions.filter(row => row.definition.kind === "documented-behavior" && row.key.endsWith(".behavior"));
  const seen = new Set<string>();
  for (const action of [...copies, ...db.ruleActions.filter(row => row.definition.kind === "rule-documentation")]) {
    if (seen.has(action.ruleKey)) throw new Error(`Ambiguous rule documentation: ${action.ruleKey}`);
    seen.add(action.ruleKey);
  }
  for (const action of copies) {
    const rules = db.rules.filter(rule => rule.key === action.ruleKey);
    const value = action.definition;
    if (rules.length !== 1 || value.kind !== "documented-behavior" || rules[0].definition.behavior !== value.description || rules[0].definition.ref !== value.source) throw new Error(`Unreconciled rule documentation: ${action.key}`);
  }
  for (const action of db.ruleActions.filter(row => row.definition.kind === "rule-documentation")) {
    const rule = db.rules.find(rule => rule.key === action.ruleKey);
    if (!rule) throw new Error(`Missing documentation rule: ${action.key}`);
    materializeRuleDocumentation(rule, action);
  }
  if (!copies.length) return;
  const key = "ownership-evidence.rule-documentation";
  db.semanticRequirements.push({ id: key, key, ...libraryMetadata("semanticRequirements", key, "Rule documentation ownership, October 19, 2026"),
    domain: "information-ownership", subjectTable: "rules", subjectKey: copies[0].ruleKey, predicate: "rule-documentation-references", status: "documented",
    value: { previousActions: JSON.parse(JSON.stringify(copies)), disposition: "rules owns behavior/ref prose; ruleActions links to that documentation. Additional rate-suppression detail stays descriptive. Supported rule execution and typed policies own behavior; prose, predicates and flow labels do not activate it." } });
  for (const action of copies) action.definition = { kind: "rule-documentation", version: 2 };
}
