import { describe, it, expect } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createMigrationDatabase } from "./fixtures";
import { migrationTableSpecs } from "./schema";
import { migrationSeedSql } from "./export";
import { validateMigrationDatabase } from "./integrity";
import { canonicalSchemaSql } from "./canonical";
import { mcrCoverageReport } from "./mcr";

describe("migration schema and deterministic export", () => {
  const db = createMigrationDatabase();
  it("validates every row, scope, foreign key, graph endpoint and serialized column", () => {
    expect(validateMigrationDatabase(db)).toEqual([]);
    expect(Object.keys(migrationTableSpecs).length).toBeGreaterThan(30);
  });
  it("rejects orphaned and cross-client relationships", () => {
    const changed = structuredClone(db);
    changed.siteAssociations[0].associationKey = "missing";
    expect(validateMigrationDatabase(changed).some((e) => e.includes("orphan"))).toBe(true);
    changed.siteAssociations[0].associationKey = db.siteAssociations[0].associationKey;
    changed.siteAssociations[0].siteKey = "waepa-gi";
    expect(validateMigrationDatabase(changed).some((e) => e.includes("Cross-client"))).toBe(true);
  });
  it("exports repeatable SQL with natural-key foreign keys and no operational rewrites", () => {
    const sql = migrationSeedSql(db);
    expect(sql).toBe(migrationSeedSql(createMigrationDatabase()));
    expect(sql).not.toMatch(/insert into public\.(applications|change_requests|releases|audit_events) /);
    expect(sql).not.toMatch(/\b(delete from|truncate|drop table)\b/i);
    if (process.env.MIGRATION_EXPORT_DIR) {
      const directory = resolve(process.env.MIGRATION_EXPORT_DIR);
      mkdirSync(directory, { recursive: true });
      writeFileSync(resolve(directory, "seed.sql"), sql);
      writeFileSync(resolve(directory, "canonical.sql"), canonicalSchemaSql());
      writeFileSync(resolve(directory, "mcr-coverage.json"), JSON.stringify(mcrCoverageReport(db), null, 2) + "\n");
      writeFileSync(resolve(directory, "database.json"), JSON.stringify(db, null, 2) + "\n");
      writeFileSync(resolve(directory, "inventory.json"), JSON.stringify({ sites: db.sites.map((s) => s.key), tables: Object.fromEntries(Object.entries(db).map(([key, rows]) => [key, rows.length])), integrityErrors: validateMigrationDatabase(db) }, null, 2) + "\n");
    }
  });
});
