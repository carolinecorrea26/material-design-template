import { createSeedDatabase } from "../persistence/seed";
import { effectiveSiteSnapshotTables } from "../repositories/portalDataRepository";
import { normalizedSnapshotTables } from "../persistence/snapshot";
import { getAnalyticsInventory } from "../analytics/inventory";
import { expect, it } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createReviewedMigrationDatabase } from "./fixtures";
import { validateMigrationDatabase } from "./integrity";
import { migrationSeedSql } from "./export";

it("exports the actual reviewed candidate separately from the compatibility fixture", () => {
  const db = createReviewedMigrationDatabase();
  db.analyticsTags = getAnalyticsInventory();
  expect(validateMigrationDatabase(db)).toEqual([]);
  const sql = migrationSeedSql(db);
  expect(sql).toContain("reviewed-numeric");
  expect(sql).toContain("military-exclusion");
  if (process.env.MIGRATION_EXPORT_DIR) {
    const directory = resolve(process.env.MIGRATION_EXPORT_DIR);
    mkdirSync(directory, { recursive: true });
    writeFileSync(resolve(directory, "seed.sql"), sql);
    // Upgrade fixtures must use the contract that existed before canonical
    // Association ownership was introduced, while preserving all source rows.
    const legacy = structuredClone(db);
    for (const site of legacy.sites) delete site.hostingAssociationId;
    writeFileSync(resolve(directory, "seed-legacy.sql"), migrationSeedSql(legacy));
    writeFileSync(resolve(directory, "operations-data.json"), JSON.stringify(createSeedDatabase()) + "\n");
    writeFileSync(resolve(directory, "database.json"), JSON.stringify(db) + "\n");
    writeFileSync(resolve(directory, "library-data.json"), JSON.stringify(Object.fromEntries([...new Set(normalizedSnapshotTables)].map(table => [table, db[table]]))) + "\n");
    writeFileSync(resolve(directory, "prototype-data.json"), JSON.stringify(Object.fromEntries([...new Set(effectiveSiteSnapshotTables)].map(table => [table, db[table]]))) + "\n");
    writeFileSync(resolve(directory, "analytics-tags.json"), JSON.stringify(db.analyticsTags) + "\n");
  }
}, 120000);
