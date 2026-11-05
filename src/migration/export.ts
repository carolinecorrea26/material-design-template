import type { DatabaseSchema } from "../persistence/types";
import { tableNames } from "../persistence/tableNames";
import { expandedTableSpecs as migrationTableSpecs } from "./canonical";
import { validateMigrationDatabase } from "./integrity";

const quote = (s: string) => `'${s.replaceAll("'", "''")}'`;
const snake = (s: string) => s.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
const valueSql = (v: unknown, json = false): string => v === null ? (json ? "'null'::jsonb" : "null") : json ? `${quote(JSON.stringify(v))}::jsonb` : typeof v === "boolean" || typeof v === "number" ? String(v) : quote(String(v));
const uuid = (table: string, key: string) => `md5(${quote(`portal-migration:${table}:${key}`)})::uuid`;
const lookup = (table: string, key: string) => `(select id from public.${table} where key = ${quote(key)})`;
function insert(table: string, values: Record<string, string>, conflict = ["key"]) {
  const columns = Object.keys(values);
  return `insert into public.${table} (${columns.map((c) => `"${c}"`).join(", ")}) values (${Object.values(values).join(", ")}) on conflict (${conflict.map((c) => `"${c}"`).join(", ")}) do update set ${columns.filter((c) => c !== "id" && !conflict.includes(c)).map((c) => `"${c}" = excluded."${c}"`).join(", ")};`;
}

/** Explicit review export only. Does not execute SQL or touch a configured database. */
export function migrationSeedSql(db: DatabaseSchema): string {
  const errors = validateMigrationDatabase(db);
  if (errors.length) throw new Error(errors.join("\n"));
  const statements = ["-- Deterministic Phase 3 fixture export. Apply only to a disposable review database.", "-- Existing operational tables are intentionally excluded. No runtime switch is performed.", "begin;"];
  for (const tag of db.analyticsTags) statements.push(insert("analytics_tags", Object.fromEntries(Object.entries(tag).map(([key, value]) => [snake(key), valueSql(value, typeof value === "object")])), ["id"]));
  for (const tag of db.provenanceTags) statements.push(insert("provenance_tags", Object.fromEntries(Object.entries(tag).map(([key, value]) => [snake(key), valueSql(value)]))));
  for (const table of ["organizations", "clients", "sites"] as const) {
    for (const row of db[table]) {
      const values: Record<string, string> = {};
      for (const [key, value] of Object.entries(row)) {
        const column = snake(key);
        if (key === "id") values[column] = uuid(table, row.key);
        else if (key === "organizationId") values[column] = lookup("organizations", db.organizations.find((r) => r.id === value)!.key);
        else if (key === "clientId") values[column] = lookup("clients", db.clients.find((r) => r.id === value)!.key);
        else if (key === 'hostingAssociationId') values[column] = lookup('clients', db.clients.find(r => r.id === value)!.key);
        else values[column] = valueSql(value);
      }
      statements.push(insert(table, values));
    }
  }
  for (const table of ["siteCoverages", "siteProducts", "siteRiders"] as const) {
    const keyColumn = table === "siteCoverages" ? "coverage_key" : table === "siteProducts" ? "product_key" : "rider_key";
    for (const row of db[table]) {
      const values = Object.fromEntries(Object.entries(row).map(([key, value]) => [snake(key), key === "id" ? uuid(tableNames[table], row.id) : key === "siteId" ? lookup("sites", db.sites.find((r) => r.id === value)!.key) : valueSql(value)]));
      statements.push(insert(tableNames[table], values, ["site_id", keyColumn]));
    }
  }
  for (const [sqlName, spec] of Object.entries(migrationTableSpecs)) {
    if (sqlName === "provenance_tags") continue;
    const table = Object.entries(tableNames).find(([, name]) => name === sqlName)![0] as keyof DatabaseSchema;
    for (const row of db[table]) {
      const values = Object.fromEntries(Object.entries(row).map(([key, value]) => {
        const column = snake(key);
        const type = (spec.columns as Record<string, string>)[column];
        return [column, valueSql(value, type.startsWith("jsonb"))];
      }));
      statements.push(insert(sqlName, values));
    }
  }
  return statements.join("\n") + "\ncommit;\n";
}
