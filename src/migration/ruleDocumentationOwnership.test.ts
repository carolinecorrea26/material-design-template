import { expect, it, afterEach } from "vitest";
import { existsSync, writeFileSync } from "node:fs";
import { createMigrationDatabase, createReviewedMigrationDatabase } from "./fixtures";
import { consolidateRuleDocumentationOwnership } from "./ruleDocumentationOwnership";
import { materializeRuleDocumentation } from "../domain/ruleDocumentation";
import { ruleAuthority } from "../domain/ruleAuthority";
import { validateMigrationDatabase } from "./integrity";
import { resolveEffectiveSite } from "../domain/effectiveSite";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { evaluateConditionDefinition } from "../config/conditions/evaluateConditions";

const db = createReviewedMigrationDatabase();
afterEach(() => installPrototypeLibrary(null));

it("replaces 95 duplicate descriptions with rule documentation links and retains the distinct source detail", () => {
  const previous = createMigrationDatabase();
  expect(db.ruleActions.filter(row => row.definition.kind === "rule-documentation")).toHaveLength(95);
  for (const action of db.ruleActions) {
    const rule = db.rules.find(rule => rule.key === action.ruleKey)!;
    expect(materializeRuleDocumentation(rule, action)).toEqual(previous.ruleActions.find(row => row.key === action.key)!.definition);
  }
  expect(db.ruleActions.find(row => row.key === "rule-hide-unavailable-rates.hide")!.definition).toMatchObject({ kind: "documented-behavior", description: expect.stringContaining("product-card") });
  const repeated = structuredClone(db);
  consolidateRuleDocumentationOwnership(repeated);
  expect(repeated).toEqual(db);
  expect(validateMigrationDatabase(db)).toEqual([]);
}, 120000);

it("makes documentation edits follow their owner without activating the documented behavior", () => {
  const changed = structuredClone(db);
  const rule = changed.rules.find(rule => rule.key === "rule-coverage-dependent-only-selection-confirmation")!;
  rule.definition.behavior = "Saved description";
  rule.definition.ref = "Saved implementation reference";
  const result = resolveEffectiveSite(changed, "asce").configuration.rules.find(row => row.key === rule.key)!;
  expect(result.executionStatus).toBe("documented");
  expect(result.actions[0].provenance).toContainEqual(expect.objectContaining({ table: "rules", key: rule.key }));
  expect(result.actions[0].value.definition).toEqual({ kind: "documented-behavior", description: "Saved description", source: "Saved implementation reference" });
  expect(rule.definition.execution).toBeUndefined();
  const competing = structuredClone(changed);
  Object.assign(competing.ruleActions.find(action => action.ruleKey === rule.key)!.definition, { description: "Competing copy" });
  expect(() => resolveEffectiveSite(competing, "asce")).toThrow("Competing rule documentation");
});

it("rejects source disagreement atomically and preserves historical prose precedence", () => {
  const old = createMigrationDatabase();
  const action = old.ruleActions.find(row => row.key.endsWith(".behavior"))!;
  if (action.definition.kind !== "documented-behavior") throw new Error("Missing legacy action");
  action.definition.description = "Historical independent copy";
  const before = JSON.stringify(old);
  expect(() => consolidateRuleDocumentationOwnership(old)).toThrow("Unreconciled rule documentation");
  expect(JSON.stringify(old)).toBe(before);
  expect(materializeRuleDocumentation(old.rules.find(rule => rule.key === action.ruleKey)!, action).description).toBe("Historical independent copy");
});

it("keeps active-duty applicability shared while Standard-only qualification rules stay scoped", () => {
  const keys = db.rules.filter(row => row.key.startsWith("rule-membership-waepa-")).map(row => row.key);
  expect(keys).toHaveLength(5);
  expect(resolveEffectiveSite(db, "waepa").configuration.rules.filter(rule => keys.includes(rule.key))).toHaveLength(5);
  const giRules = resolveEffectiveSite(db, "waepa-gi").configuration.rules.filter(rule => keys.includes(rule.key));
  expect(giRules.map(rule => rule.key)).toEqual(["rule-membership-waepa-active-duty-prevents-application"]);
  expect(resolveEffectiveSite(db, "ama").configuration.rules.some(rule => keys.includes(rule.key))).toBe(false);
  for (const site of ["waepa", "waepa-gi"]) {
    installPrototypeLibrary(resolvePrototypeLibrary(db, site, "test:rule-conditions"));
    expect(evaluateConditionDefinition("condition-active-military", { "active-military": "yes" })).toBe(true);
    expect(evaluateConditionDefinition("condition-active-military", { "active-military": "no" })).toBe(false);
  }
});

it("accounts for every rule while distinguishing routing, planned behavior and non-executable source models", () => {
  const rows = db.rules.map(row => {
    const refs = [...row.definition.ref.matchAll(/(?:src|scripts)\/[\w./-]+\.(?:tsx|ts|mjs)(?![\w])/g)].map(match => match[0]);
    return { key: row.key, name: row.definition.rule, area: row.definition.area, documentedIn: row.definition.documentedIn,
      authority: ruleAuthority(row), behavior: row.definition.behavior, organization: row.definition.organization, implementationReferences: refs.map(path => ({ path, exists: existsSync(path) })),
      assignments: db.ruleAssignments.filter(assignment => assignment.ruleKey === row.key), conditionKeys: db.ruleConditions.filter(link => link.ruleKey === row.key).map(link => link.conditionKey),
      sourcePredicateKeys: db.rulePredicates.filter(predicate => predicate.ruleKey === row.key).map(predicate => predicate.key), sourceActionKeys: db.structuredRuleActions.filter(action => action.ruleKey === row.key).map(action => action.key) };
  });
  expect(rows).toHaveLength(115);
  expect(new Set(rows.map(row => row.key)).size).toBe(115);
  expect(rows.filter(row => row.authority.kind === "routing")).toHaveLength(5);
  expect(rows.filter(row => row.authority.kind === "planned")).toHaveLength(4);
  expect(rows.filter(row => row.authority.kind === "source-pattern")).toHaveLength(9);
  expect(rows.flatMap(row => row.implementationReferences).filter(reference => !reference.exists)).toEqual([]);
  const oldTemplateKey = "rule-form-template-single-template-forces-the-narrow-screen-layout-not-a-separate-one-page-form";
  expect(rows.find(row => row.key === oldTemplateKey)?.behavior).toContain("SinglePageSections");
  expect(rows.filter(row => row.authority.kind === "planned").every(row => !db.rules.find(rule => rule.key === row.key)!.definition.execution)).toBe(true);
  if (process.env.RULE_REVIEW_EXPORT_PATH) writeFileSync(process.env.RULE_REVIEW_EXPORT_PATH, JSON.stringify({ scope: "Rules only; field/rider decisions stay settled. Pages/flows and presentation ownership are deferred from this pass.",
    boundary: "Complete catalog classification with implementation references and bounded corrections; not a claim that all described behavior is executed by a generic rule engine or has received exhaustive semantic review.",
    counts: Object.fromEntries([...new Set(rows.map(row => row.authority.kind))].map(kind => [kind, rows.filter(row => row.authority.kind === kind).length])),
    conditionDefinitions: db.conditions.map(condition => ({ key: condition.key, definition: condition.definition,
      ruleKeys: db.ruleConditions.filter(link => link.conditionKey === condition.key).map(link => link.ruleKey),
      sectionKeys: db.pageSections.filter(section => section.definition.visibilityConditionId === condition.key).map(section => section.key),
      fieldKeys: db.fields.filter(field => field.definition.visibilityConditionId === condition.key || field.definition.optionExclusions?.some(exclusion => exclusion.conditionId === condition.key)).map(field => field.key),
      scopedFieldKeys: db.siteFieldConfigurations.filter(field => field.values.visibilityConditionId === condition.key || field.values.optionExclusions?.some(exclusion => exclusion.conditionId === condition.key)).map(field => field.key) })),
    remainingSemanticReview: "Review the documented behavior groups against current implementation and accepted business policies. Catalog classification and working references do not certify every described behavior.", rows }, null, 2) + "\n");
});
