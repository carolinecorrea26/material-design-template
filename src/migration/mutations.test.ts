import { expect, it } from "vitest";
import { createMigrationDatabase } from "./fixtures";
import { resolveDatabaseSite, resolveDatabaseAssociation } from "./resolve";
import { LocalStorageAdapter, LOCAL_DATABASE_KEY } from "../persistence/localAdapter";
import { createSeedDatabase } from "../persistence/seed";
import { emptyLibrary } from "../persistence/emptyLibrary";
import type { DatabaseSchema } from "../persistence/types";
import { readFileSync } from "node:fs";

const original = createMigrationDatabase();
const baseline = resolveDatabaseSite(original, "ama");
const changes: [string, (db: DatabaseSchema) => void][] = [
  ["branding", (db) => { db.brandingProfiles.find((r) => r.clientKey === "ama")!.definition.logo = "/changed.png"; }],
  ["support", (db) => { db.supportProfiles.find((r) => r.clientKey === "ama")!.definition.email = "changed@example.test"; }],
  ["pages", (db) => { db.sitePages.find((r) => r.siteKey === "ama" && r.pageKey === "payment")!.requirement = "none"; }],
  ["fields", (db) => { db.validationRules.find((r) => r.fieldKey === "email")!.definition.required = false; }],
  ["coverage", (db) => { db.siteProducts.find((r) => r.siteId === "ama" && r.enabled)!.enabled = false; }],
  ["rules", (db) => { db.ruleAssignments = db.ruleAssignments.filter((r) => r.ruleKey !== baseline.rules[0].id); }],
  ["flows", (db) => { db.flowSteps[0].definition.label = "changed step"; }],
  ["features", (db) => { db.configurationValues.find((r) => r.clientKey === "ama" && r.configurationKey === "features.scheduleUrl")!.value = "https://example.test/changed"; }],
  ["content", (db) => { db.contentValues.find((r) => r.scope === "global" && r.contentKey === "footer.administeredByLabel")!.value = "changed"; }],
  ["configurations", (db) => { db.configurationValues.find((r) => r.clientKey === "ama" && r.configurationKey === "theme.preset")!.value = "teal"; }],
  ["associations", (db) => { db.siteAssociations.find((r) => r.siteKey === "ama")!.enabled = false; }],
  ["emailConfiguration", (db) => { db.supportProfiles.find((r) => r.clientKey === "ama")!.definition.phoneDisplay = "changed"; }],
];
it.each(changes)("a persisted %s mutation changes the independently resolved behavior", (domain, change) => {
  const changed = structuredClone(original);
  change(changed);
  expect(resolveDatabaseSite(changed, "ama")[domain as keyof typeof baseline]).not.toEqual(baseline[domain as keyof typeof baseline]);
});
it("adapter upgrades missing tables without overwriting existing local edits", async () => {
  const legacy = createSeedDatabase() as unknown as Record<string, unknown>;
  for (const key of Object.keys(emptyLibrary())) delete legacy[key];
  (legacy.sites as DatabaseSchema["sites"])[0].name = "Local unsaved configuration";
  let stored = JSON.stringify(legacy);
  const storage = { getItem: (key: string) => key === LOCAL_DATABASE_KEY ? stored : null, setItem: (_key: string, value: string) => { stored = value; }, removeItem: () => { stored = ""; } };
  const adapter = new LocalStorageAdapter(createSeedDatabase(), storage);
  const before = stored;
  expect(await adapter.list("pages")).toEqual([]);
  expect((await adapter.list("sites"))[0].name).toBe("Local unsaved configuration");
  expect(stored).toBe(before);
  await adapter.insert("pages", original.pages[0]);
  expect((await adapter.list("sites"))[0].name).toBe("Local unsaved configuration");
  expect(await adapter.list("pages")).toEqual([original.pages[0]]);
});
it("URL association selection rejects missing, disabled and foreign associations", () => {
  const db = structuredClone(original);
  db.sitePolicies.find((r) => r.siteKey === "ama")!.definition.associationSelection = { mode: "url-parameter" };
  expect(resolveDatabaseAssociation(db, "ama").status).toBe("missing");
  expect(resolveDatabaseAssociation(db, "ama", { urlAssociationId: "american-society-of-civil-engineers" }).status).toBe("invalid");
  expect(resolveDatabaseAssociation(db, "ama", { urlAssociationId: "american-medical-association" }).status).toBe("resolved");
  db.siteAssociations.find((r) => r.siteKey === "ama")!.enabled = false;
  expect(resolveDatabaseAssociation(db, "ama", { urlAssociationId: "american-medical-association" }).status).toBe("invalid");
});
it("new resolver runtime imports cannot read legacy registries or fixtures", () => {
  for (const file of ["src/migration/resolve.ts", "src/migration/values.ts"]) {
    const imports = readFileSync(file, "utf8").split("\n").filter((line) => line.startsWith("import ") && !line.startsWith("import type "));
    expect(imports.every((line) => /from "(?:\.\/values|\.\.\/domain\/ruleDocumentation)"/.test(line))).toBe(true);
  }
});
