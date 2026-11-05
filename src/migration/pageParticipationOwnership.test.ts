import { afterEach, expect, it } from "vitest";
import { createMigrationDatabase, createReviewedMigrationDatabase } from "./fixtures";
import { activeSiteMigrationScope } from "./activeSiteScope";
import { consolidatePageParticipationOwnership } from "./pageParticipationOwnership";
import { isPageParticipationPath } from "../domain/pageParticipation";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { getClientPageRequirement } from "../config/client/getClientPageRequirement";
import { resolvePageVisibility } from "../config/resolvers/resolveClientPages";
import { getResolvedFormFlow, shouldSkipPage } from "../config/formFlow";
import { resolveFlowGate } from "../config/flowGates";
import { storedApplicationPageRows } from "../pages/admin/library/storedLibraryModel";
import { validateMigrationDatabase } from "./integrity";
import { libraryMetadata } from "../domain/provenance";
import { createLibraryDraft, editDraftParticipation } from "../domain/libraryDraft";
import { createPortalDataRepository } from "../repositories/portalDataRepository";
import { LocalStorageAdapter } from "../persistence/localAdapter";
import { createSiteBuild } from "../domain/siteBuild";

const db = createReviewedMigrationDatabase();
const preview = (data = db, site = "asce") => resolvePrototypeLibrary(data, site, "test:page-owner");
const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, "page ownership regression") });
const marker = (data = db) => data.configurationValues.find(row => row.key === "ownership.asce.page-participation")!;
afterEach(() => installPrototypeLibrary(null));

it("preserves every business Site assignment and derives compatibility modes without competing copies", () => {
  const business = activeSiteMigrationScope.sites.filter(site => site.mcrRequired);
  const assignments = db.sitePages.filter(row => business.some(site => site.key === row.siteKey));
  expect(assignments).toHaveLength(business.length * db.pages.length);
  expect(db.semanticRequirements.filter(row => row.predicate === "site-page-participation")).toHaveLength(9);
  expect(db.configurationValues.filter(row => isPageParticipationPath(db.configurationDefinitions.find(definition => definition.key === row.configurationKey)?.definition.path)).map(row => row.clientKey)).toEqual(["demo", "demo"]);
  for (const site of business) {
    const library = preview(db, site.key);
    expect(library.site.configuration.pageParticipation.source).toBe("sitePages");
    expect(library.client.pages.participationSource).toBe("sitePages");
    for (const page of library.pages) {
      const expected = assignments.find(row => row.siteKey === site.key && row.pageKey === page.key)?.requirement ?? "none";
      expect(getClientPageRequirement(page.definition.id, structuredClone(library.client))).toBe(expected);
      expect(resolvePageVisibility(page.definition.id, structuredClone(library.client)).effective.requirement).toBe(expected);
    }
  }
  expect(preview(db, "abe").client.pages.requirements?.beneficiary).toBe("optional");
  expect(preview(db, "demo").client.pages.participationSource).toBeUndefined();
  const repeated = structuredClone(db);
  consolidatePageParticipationOwnership(repeated);
  expect(repeated).toEqual(db);
  expect(validateMigrationDatabase(db)).toEqual([]);
});

it("uses stored health-page participation before applying independent routing gates", () => {
  const values = { coverageRiders: { "li-term:cir:member": true } };
  installPrototypeLibrary(preview());
  expect(resolveFlowGate("health-cir", values)).toBe(true);
  expect(shouldSkipPage("health-cir", values)).toBe(false);
  const changed = structuredClone(db);
  changed.sitePages.find(row => row.siteKey === "asce" && row.pageKey === "health-cir")!.requirement = "none";
  const library = preview(changed);
  installPrototypeLibrary(library);
  expect(resolveFlowGate("health-cir", values)).toBe(true);
  expect(shouldSkipPage("health-cir", values)).toBe(true);
  expect(getResolvedFormFlow()).not.toContain("health-cir");
  expect(resolvePageVisibility("health-cir", structuredClone(library.client))).toMatchObject({ status: "disabled", effective: { included: false, requirement: "none" } });
  expect(storedApplicationPageRows({ data: changed, revision: "test", analyticsTags: [] }, "asce").find(row => row.key === "health-cir")).toBeUndefined();
  expect(preview(db, "ama").client.pages.requirements?.["health-cir"]).toBe("required");
});

it("derives disabled unassigned pages and optional modes from the same records", () => {
  const changed = structuredClone(db);
  changed.sitePages = changed.sitePages.filter(row => !(row.siteKey === "asce" && row.pageKey === "contact"));
  changed.sitePages.find(row => row.siteKey === "asce" && row.pageKey === "payment")!.requirement = "optional";
  const library = preview(changed);
  installPrototypeLibrary(library);
  expect(getResolvedFormFlow()).not.toContain("contact");
  expect(getClientPageRequirement("contact", structuredClone(library.client))).toBe("none");
  expect(getClientPageRequirement("payment", structuredClone(library.client))).toBe("optional");
  expect(library.client.pages.optional).toContain("payment");
  expect(library.client.pages.excluded).toContain("contact");
});

it.each(["contract", "scope", "competing-copy", "duplicate-marker", "bad-mode", "duplicate-page"])("rejects %s without falling back to old settings", scenario => {
  const changed = structuredClone(db);
  if (scenario === "contract") marker(changed).value = { version: 9, source: "sitePages" };
  if (scenario === "scope") Object.assign(marker(changed), { scope: "global", siteKey: null });
  if (scenario === "competing-copy") changed.configurationValues.push({ ...meta("configurationValues", "test.old-copy"), position: 0, scope: "site", siteKey: "asce", clientKey: null, configurationKey: "pages.requirements.beneficiary", value: "none" });
  if (scenario === "duplicate-marker") {
    const definition = changed.configurationDefinitions.find(row => row.key === marker(changed).configurationKey)!;
    changed.configurationDefinitions.push({ ...definition, ...meta("configurationDefinitions", "test.second-marker") });
    changed.configurationValues.push({ ...marker(changed), ...meta("configurationValues", "test.second-marker"), configurationKey: "test.second-marker" });
  }
  if (scenario === "bad-mode") Object.assign(changed.sitePages.find(row => row.siteKey === "asce")!, { requirement: "sometimes" });
  if (scenario === "duplicate-page") changed.sitePages.push({ ...changed.sitePages.find(row => row.siteKey === "asce")!, ...meta("sitePages", "test.duplicate") });
  expect(() => preview(changed)).toThrow();
  expect(validateMigrationDatabase(changed)).toContain("Invalid Site page participation policy ownership.asce.page-participation");
});

it("keeps copied Site participation and subsequent draft edits independent", async () => {
  const revision = await createPortalDataRepository(new LocalStorageAdapter(db)).open();
  const draft = createLibraryDraft(revision, "asce");
  draft.data.organizations = db.organizations;
  draft.data.organizationProfiles = db.organizationProfiles;
  const client = db.clients.find(row => row.key === "asce")!;
  const organization = db.organizations.find(row => row.id === client.organizationId)!;
  const copied = createSiteBuild(draft, { siteKey: "asce-page-copy", siteName: "Page copy", template: "multi", clientKey: client.key, clientName: client.name, organizationKey: organization.key, organizationName: organization.name, newClient: false, newOrganization: false });
  const edited = editDraftParticipation(copied, "page", "health-cir", false);
  const library = resolvePrototypeLibrary(edited.data, copied.siteKey, "test");
  expect(library.client.pages.requirements?.["health-cir"]).toBe("none");
  expect(resolvePrototypeLibrary(edited.data, "asce", "test").client.pages.requirements?.["health-cir"]).toBe("required");
  expect(edited.data.configurationValues.some(row => row.siteKey === copied.siteKey && isPageParticipationPath(edited.data.configurationDefinitions.find(definition => definition.key === row.configurationKey)?.definition.path))).toBe(false);
});

it("keeps saved legacy settings and the historical health summary behavior without rewriting their payload", () => {
  const legacy = structuredClone(db);
  const original = createMigrationDatabase();
  const markerKeys = new Set(legacy.configurationDefinitions.filter(row => row.definition.target?.kind === "site-page-participation").map(row => row.key));
  legacy.configurationValues = legacy.configurationValues.filter(row => !markerKeys.has(row.configurationKey) && !isPageParticipationPath(legacy.configurationDefinitions.find(definition => definition.key === row.configurationKey)?.definition.path));
  legacy.configurationValues.push(...original.configurationValues.filter(row => isPageParticipationPath(original.configurationDefinitions.find(definition => definition.key === row.configurationKey)?.definition.path)));
  legacy.sitePages.find(row => row.siteKey === "asce" && row.pageKey === "health-cir")!.requirement = "none";
  const before = JSON.stringify(legacy);
  const library = preview(legacy);
  expect(library.site.configuration.pageParticipation.source).toBe("legacy");
  expect(library.client.pages.participationSource).toBeUndefined();
  expect(resolvePageVisibility("health-cir", library.client).effective.included).toBe(true);
  expect(JSON.stringify(legacy)).toBe(before);
});

it.each(["value", "conflict"])("rejects an unresolved source %s before mutation", scenario => {
  const original = createMigrationDatabase();
  original.configurationValues.find(row => row.key === "client:asce.pages.requirements.beneficiary")!.value = scenario === "value" ? "sometimes" : "none";
  const before = JSON.stringify(original);
  expect(() => consolidatePageParticipationOwnership(original)).toThrow(scenario === "value" ? "Unresolved page participation copy" : "Unreconciled page participation");
  expect(JSON.stringify(original)).toBe(before);
});

it("reconciles legacy excluded/optional arrays with explicit requirement precedence", () => {
  const original = createMigrationDatabase();
  for (const [property, value] of [["excluded", ["health-cir", "contact"]], ["optional", ["health-cir", "profile", "beneficiary"]]] as const) {
    const key = `pages.${property}`;
    original.configurationDefinitions.push({ ...meta("configurationDefinitions", key), position: 0, definition: { path: ["pages", property], metadata: null } });
    original.configurationValues.push({ ...meta("configurationValues", `test.asce.${property}`), position: 0, scope: "client", siteKey: null, clientKey: "asce", configurationKey: key, value: [...value] });
  }
  for (const row of original.sitePages.filter(row => row.siteKey === "asce")) {
    if (["health-cir", "contact"].includes(row.pageKey)) row.requirement = "none";
    if (row.pageKey === "profile") row.requirement = "optional";
  }
  const before = structuredClone(original.sitePages);
  consolidatePageParticipationOwnership(original);
  expect(original.sitePages).toEqual(before);
  expect(original.sitePages.find(row => row.siteKey === "asce" && row.pageKey === "beneficiary")?.requirement).toBe("required");
  expect(original.configurationValues.some(row => row.key === "test.asce.excluded" || row.key === "test.asce.optional")).toBe(false);
  const evidence = original.semanticRequirements.find(row => row.key === "ownership-evidence.asce.page-participation")!.value;
  expect(JSON.stringify(evidence)).toContain("test.asce.excluded");
  expect(JSON.stringify(evidence)).toContain("test.asce.optional");
});
