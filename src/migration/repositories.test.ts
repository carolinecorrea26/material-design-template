import { describe, expect, it } from "vitest";
import { migrationSiteKeys } from "./fixtures";
import { LocalStorageAdapter } from "../persistence/localAdapter";
import { loadPersistedSiteAdapter } from "../repositories/persistedSiteAdapter";
import { createSiteRepository } from "../repositories/siteRepository";
import { staticSiteAdapter } from "../repositories/staticSiteAdapter";
import { createCanonicalMetadataRepository } from "../repositories/canonicalMetadataRepository";
import { mcrCoverageReport } from "./mcr";
import { resolveClientCoverage, resolveClientFields, resolveClientPages, resolveClientFlows } from "../config/resolvers";
import type { PersistenceAdapter } from "../persistence/adapter";
import type { TableName } from "../persistence/types";
import { createLegacyCompatibilityFixture } from "./legacyCompatibilityFixture";

const db = createLegacyCompatibilityFixture();
const adapter = new LocalStorageAdapter(db);
const persisted = createSiteRepository(await loadPersistedSiteAdapter(adapter));
const original = createSiteRepository(staticSiteAdapter);
const clean = (value: unknown) => JSON.parse(JSON.stringify(value));

// Architecture contract: additions require deliberate compatibility review.
// All other tables (including future normalized decision tables) are isolated.
const compatibilityTables = new Set<TableName>([
  "clients", "sites", "organizations", "organizationProfiles", "associations",
  "siteAssociations", "sitePolicies", "configurationDefinitions", "configurationValues",
  "brandingProfiles", "supportProfiles", "flows", "flowSteps", "flowTransitions", "siteFlows",
]);
function expectCompatibilityUnchanged(actual: ReturnType<typeof createSiteRepository>) {
  for (const siteId of migrationSiteKeys) {
    const config = actual.getEffectiveSiteConfig(siteId);
    const expected = persisted.getEffectiveSiteConfig(siteId);
    expect(config).toEqual(expected);
    expect(resolveClientCoverage(config)).toEqual(resolveClientCoverage(expected));
    expect(resolveClientFields(config)).toEqual(resolveClientFields(expected));
    expect(resolveClientPages(config)).toEqual(resolveClientPages(expected));
    expect(resolveClientFlows(config)).toEqual(resolveClientFlows(expected));
  }
}

describe("Phase 5 persisted compatibility transport", () => {
  for (const siteId of migrationSiteKeys) it(`${siteId} remains equivalent after adapter readback`, () => {
    const actual = persisted.getEffectiveSiteConfig(siteId);
    const expected = original.getEffectiveSiteConfig(siteId);
    expect(clean(actual)).toEqual(clean(expected));
    expect(clean(resolveClientCoverage(actual))).toEqual(clean(resolveClientCoverage(expected)));
    expect(clean(resolveClientFields(actual))).toEqual(clean(resolveClientFields(expected)));
    expect(clean(resolveClientPages(actual))).toEqual(clean(resolveClientPages(expected)));
    expect(clean(resolveClientFlows(actual))).toEqual(clean(resolveClientFlows(expected)));
    expect(persisted.getAssociationsForSite(siteId)).toEqual(original.getAssociationsForSite(siteId));
  });
  it("carries approved canonical metadata without activating normalized changes", async () => {
    const metadata = await createCanonicalMetadataRepository(adapter).forSite("asce");
    expect(metadata.underwriting.filter(b => b.status === "underwriting-unspecified")).toHaveLength(0);
    expect(metadata.underwriting.filter(b => b.sourceReference?.includes("asce-business-decisions")).map(b => b.pathway)).toEqual(["FUW", "FUW", "FUW", "FUW"]);
    const sample = structuredClone(db);
    expect(sample.underwritingBands.length).toBeGreaterThan(0);
    for (const band of sample.underwritingBands) { band.pathway = "QD"; band.status = "documented"; }
    const changed = createSiteRepository(await loadPersistedSiteAdapter(new LocalStorageAdapter(sample)));
    expectCompatibilityUnchanged(changed);
  });
  it("cannot activate normalized eligibility changes for any prototype Site", async () => {
    const sample = structuredClone(db);
    expect(sample.eligibilityConstraints.length).toBeGreaterThan(0);
    for (const constraint of sample.eligibilityConstraints) {
      constraint.minimumAgeDays = 365;
      constraint.minimumAgeYears = 90;
      constraint.maximumAgeYears = 99;
      constraint.studentMaximumAgeYears = 99;
      constraint.minimumWorkHours = 100;
    }
    expect(sample.eligibilityConstraints).not.toEqual(db.eligibilityConstraints);
    expectCompatibilityUnchanged(createSiteRepository(await loadPersistedSiteAdapter(new LocalStorageAdapter(sample))));
  });
  it("does not read inspection, migration or normalized metadata, including future tables", async () => {
    const guarded: PersistenceAdapter = {
      kind: "local",
      list: async (table) => {
        if (!compatibilityTables.has(table)) throw new Error(`Forbidden compatibility read: ${table}`);
        return adapter.list(table);
      },
      get: async (table, id) => {
        if (!compatibilityTables.has(table)) throw new Error(`Forbidden compatibility read: ${table}`);
        return adapter.get(table, id);
      },
      insert: async () => { throw new Error("Compatibility hydration must not write"); },
      update: async () => { throw new Error("Compatibility hydration must not write"); },
      remove: async () => { throw new Error("Compatibility hydration must not write"); },
    };
    expectCompatibilityUnchanged(createSiteRepository(await loadPersistedSiteAdapter(guarded)));
  });
  it("preserves every Site when all non-compatibility tables are removed", async () => {
    const sample = structuredClone(db);
    for (const table of Object.keys(sample) as TableName[]) {
      if (!compatibilityTables.has(table)) sample[table] = [];
    }
    expectCompatibilityUnchanged(createSiteRepository(await loadPersistedSiteAdapter(new LocalStorageAdapter(sample))));
  });
  it("is ready for Phase 6 after approved canonical decisions without runtime activation", () => {
    const report = mcrCoverageReport(db);
    expect(report.phase5Ready).toBe(true);
    expect(report.phase5Blockers).toEqual([]);
    expect(report.phase6Ready).toBe(true);
    expect(report.blockers).toEqual([]);
  });
  it("does not defer new unknowns or incomplete Site data", async () => {
    const sample = structuredClone(db);
    const definition = sample.configurationDefinitions.find(d => d.definition.path?.includes("unresolved"))!;
    const value = sample.configurationValues.find(v => v.configurationKey === definition.key && v.siteKey === "asce") ?? sample.configurationValues.find(v => v.configurationKey === definition.key && v.clientKey === "asce")!;
    if (!Array.isArray(value.value)) throw new Error("Expected unresolved array");
    value.value.push({ id: "new-unknown", description: "New unreviewed requirement", source: "synthetic" });
    expect(mcrCoverageReport(sample).phase5Ready).toBe(false);
    sample.sitePolicies = sample.sitePolicies.filter(p => p.siteKey !== "asce");
    await expect(loadPersistedSiteAdapter(new LocalStorageAdapter(sample))).rejects.toThrow("Incomplete compatibility site");
  });
});
