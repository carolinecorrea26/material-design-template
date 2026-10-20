import { materializeRuleDocumentation } from "../domain/ruleDocumentation";
import { afterEach, expect, it } from "vitest";
import { createMigrationDatabase, createReviewedMigrationDatabase } from "./fixtures";
import { consolidateRoutingRuleOwnership } from "./routingRuleOwnership";
import { resolveEffectiveSite } from "../domain/effectiveSite";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { getFlowGateDefinition, resolveFlowGate, flowGateDefinitions } from "../config/flowGates";
import { libraryMetadata } from "../domain/provenance";
import { validateMigrationDatabase } from "./integrity";
import { activeSiteMigrationScope } from "./activeSiteScope";
import { createLibraryDraft } from "../domain/libraryDraft";
import { createSiteBuild } from "../domain/siteBuild";
import { createPortalDataRepository } from "../repositories/portalDataRepository";
import { LocalStorageAdapter } from "../persistence/localAdapter";

const db = createReviewedMigrationDatabase();
const preview = (data = db, site = "ama") => resolvePrototypeLibrary(data, site, "test:routing-ownership");
const config = (data = db) => data.configurationValues.find(row => row.key === "global.routing.gates")!;
const ruleKey = "rule-application-flow-beneficiary-routing";
const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, "routing regression") });
afterEach(() => installPrototypeLibrary(null));

it("preserves the six template gates across all Sites using five existing shared rule identities", () => {
  const previous = createMigrationDatabase();
  expect(config().value).toMatchObject({ version: 2, source: "rules", ruleKeys: expect.any(Array) });
  expect(config().value).not.toHaveProperty("gate");
  expect(db.rules.map(row => row.key)).toEqual(previous.rules.map(row => row.key));
  expect(db.ruleAssignments).toEqual(previous.ruleAssignments);
  for (const site of activeSiteMigrationScope.sites) {
    const library = preview(db, site.key);
    expect(library.settings.routingGates).toEqual(flowGateDefinitions);
    expect(library.site.configuration.routing).toMatchObject({ source: "rules", definitions: flowGateDefinitions });
    expect(library.site.configuration.routing!.ruleKeys).toHaveLength(5);
    expect(library.site.configuration.routing!.provenance.some(row => row.table === "ruleAssignments")).toBe(true);
    expect(library.site.configuration.rules.filter(rule => rule.executionStatus === "resolved")).toHaveLength(5);
    expect(library.site.configuration.issues.some(issue => issue.domain === "rules" && issue.key === ruleKey)).toBe(false);
  }
  expect(db.rules.filter(row => row.definition.documentationStatus === "planned").every(row => !row.definition.execution)).toBe(true);
  expect(db.ruleActions.map(action => ({ ...action, definition: materializeRuleDocumentation(db.rules.find(rule => rule.key === action.ruleKey)!, action) }))).toEqual(previous.ruleActions);
  expect(db.semanticRequirements.find(row => row.predicate === "shared-routing-rules")!.value).toMatchObject({ previousValue: flowGateDefinitions });
  const repeated = structuredClone(db);
  consolidateRoutingRuleOwnership(repeated);
  expect(repeated).toEqual(db);
  expect(validateMigrationDatabase(db)).toEqual([]);
});

it("reads gates from the installed rule definition even when prose differs", () => {
  const changed = structuredClone(db);
  const rule = changed.rules.find(row => row.key === ruleKey)!;
  rule.definition.execution = { kind: "page-routing", gates: [{ pageId: "beneficiary", gate: { kind: "selected-category", categoryIds: ["DI"] } }] };
  rule.definition.behavior = "Documentation deliberately does not control execution";
  const library = preview(changed);
  installPrototypeLibrary(library);
  expect(getFlowGateDefinition("beneficiary")!.gate).toEqual({ kind: "selected-category", categoryIds: ["DI"] });
  expect(resolveFlowGate("beneficiary", { coverageSelections: ["li-term"], productApplicants: { "li-term": ["member"] }, coverageAmounts: { "li-term:member": 100000 } })).toBe(false);
  expect(resolveFlowGate("beneficiary", { coverageSelections: ["di-level-rated"], productApplicants: { "di-level-rated": ["member"] }, coverageAmounts: { "di-level-rated:member": 1000 } })).toBe(true);
  expect(library.settings.routingGates).toEqual(library.site.configuration.routing!.definitions);
});

it.each(["missing-rule", "unassigned", "duplicate-assignment", "planned", "condition", "dependency", "duplicate-page", "bad-gate", "bad-page", "bad-contract"])("rejects %s without a static or prose fallback", scenario => {
  const changed = structuredClone(db);
  const rule = changed.rules.find(row => row.key === ruleKey)!;
  if (scenario === "missing-rule") changed.rules = changed.rules.filter(row => row !== rule);
  if (scenario === "unassigned") changed.ruleAssignments = changed.ruleAssignments.filter(row => row.ruleKey !== ruleKey);
  if (scenario === "duplicate-assignment") changed.ruleAssignments.push({ ...changed.ruleAssignments.find(row => row.ruleKey === ruleKey)!, ...meta("ruleAssignments", "test.duplicate") });
  if (scenario === "planned") rule.definition.documentationStatus = "planned";
  if (scenario === "condition") changed.ruleConditions.push({ ...meta("ruleConditions", "test.condition"), ruleKey, conditionKey: "condition-spouse-selected", position: 0 });
  if (scenario === "dependency") rule.definition.dependsOn = ["rule-validation-page-advance"];
  if (scenario === "duplicate-page") rule.definition.execution!.gates.push(rule.definition.execution!.gates[0]);
  if (scenario === "bad-gate") Object.assign(rule.definition.execution!.gates[0], { gate: { kind: "unknown" } });
  if (scenario === "bad-page") Object.assign(rule.definition.execution!.gates[0], { pageId: "missing" });
  if (scenario === "bad-contract") config(changed).value = { version: 9, source: "rules", ruleKeys: [ruleKey] };
  expect(() => preview(changed)).toThrow();
  expect(validateMigrationDatabase(changed)).toContain("Invalid executable routing policy global.routing.gates");
});

it("supports explicit Site references without changing another Site and copies their assignments", async () => {
  const changed = structuredClone(db);
  const key = "rule-test-ama-beneficiary";
  changed.rules.push({ ...changed.rules.find(row => row.key === ruleKey)!, ...meta("rules", key), definition: {
    ...changed.rules.find(row => row.key === ruleKey)!.definition, id: key,
    execution: { kind: "page-routing", gates: [{ pageId: "beneficiary", gate: { kind: "selected-category", categoryIds: ["DI"] } }] },
  } });
  changed.ruleAssignments.push({ ...meta("ruleAssignments", "test.ama.assignment"), ruleKey: key, scope: "site", siteKey: "ama", clientKey: null, position: 0 });
  const value = config(changed).value;
  if (!value || typeof value !== "object" || Array.isArray(value) || !Array.isArray(value.ruleKeys)) throw new Error("Missing references");
  changed.configurationValues.push({ ...config(changed), ...meta("configurationValues", "test.ama.routing"), scope: "site", siteKey: "ama", clientKey: null,
    value: { ...value, ruleKeys: value.ruleKeys.map(current => current === ruleKey ? key : current) } });
  expect(preview(changed).site.configuration.routing!.definitions[0].gate).toEqual({ kind: "selected-category", categoryIds: ["DI"] });
  expect(preview(changed, "avma").site.configuration.routing!.definitions[0].gate).toEqual(flowGateDefinitions[0].gate);
  const revision = await createPortalDataRepository(new LocalStorageAdapter(changed)).open();
  const draft = createLibraryDraft(revision, "ama");
  draft.data.organizations = changed.organizations;
  draft.data.organizationProfiles = changed.organizationProfiles;
  const client = changed.clients.find(row => row.key === "ama")!;
  const organization = changed.organizations.find(row => row.id === client.organizationId)!;
  const copied = createSiteBuild(draft, { siteKey: "ama-routing-copy", siteName: "Routing copy", template: "multi", clientKey: client.key, clientName: client.name, organizationKey: organization.key, organizationName: organization.name, newClient: false, newOrganization: false });
  expect(resolveEffectiveSite(copied.data, copied.siteKey).configuration.routing!.definitions).toEqual(preview(changed).site.configuration.routing!.definitions);
  expect(validateMigrationDatabase(changed)).toEqual([]);
});

it("refuses a new array override over linked routing and preserves archived array behavior", () => {
  const changed = structuredClone(db);
  changed.configurationValues.push({ ...config(changed), ...meta("configurationValues", "test.array-override"), scope: "site", siteKey: "ama", clientKey: null, value: [] });
  expect(() => preview(changed)).toThrow("Routing arrays cannot override");
  const original = createMigrationDatabase();
  config(changed).value = config(original).value;
  for (const rule of changed.rules) delete rule.definition.execution;
  const before = JSON.stringify(changed);
  expect(preview(changed).site.configuration.routing).toMatchObject({ source: "legacy", definitions: [] });
  expect(JSON.stringify(changed)).toBe(before);
});

it("rejects an unaccounted-for source gate before mutating shared rows", () => {
  const original = createMigrationDatabase();
  const value = config(original).value;
  if (!Array.isArray(value)) throw new Error("Missing source gates");
  value.push({ pageId: "membership", gate: { kind: "selected-category", categoryIds: ["DI"] } });
  const before = JSON.stringify(original);
  expect(() => consolidateRoutingRuleOwnership(original)).toThrow("Unmapped routing source page");
  expect(JSON.stringify(original)).toBe(before);
});
