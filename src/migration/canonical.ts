import { canonicalTableSpecs } from "./canonicalSchema";
import { migrationTableSpecs } from "./schema";
import { tableNames } from "../persistence/tableNames";
import { libraryMetadata } from "../domain/provenance";
import type { DatabaseSchema } from "../persistence/types";

export const metadataColumns = { display_id: "bigint not null unique check (display_id > 0)", provided_by: "text references public.provenance_tags(key)", source_reference: "text" };
export const expandedTableSpecs: Record<string, { columns: Record<string, string>; constraints: readonly string[] }> = {
  ...Object.fromEntries(Object.entries(migrationTableSpecs).map(([name, spec]) => [name, { ...spec, columns: { ...spec.columns, ...metadataColumns } }])),
  ...canonicalTableSpecs,
  components: { columns: { id: "text primary key", key: "text not null unique", position: "integer not null default 0", definition: "jsonb not null", ...metadataColumns }, constraints: [] },
  source_requirements: { ...canonicalTableSpecs.source_requirements, columns: { ...canonicalTableSpecs.source_requirements.columns,
    promotion_state: "text not null", promotion_reason: "text not null", active_site_keys: "jsonb not null",
  } },
};

/** Migration-only enrichment. Production seeds and consumers stay on existing sources. */
export function addLibraryMetadata(db: DatabaseSchema) {
  for (const [name, rows] of Object.entries(db)) {
    if (!(tableNames[name as keyof DatabaseSchema] in expandedTableSpecs) && !["organizations", "clients", "sites"].includes(name)) continue;
    for (const row of rows as Array<{ key: string }>) Object.assign(row, { ...libraryMetadata(name, row.key, `prototype:${name}/${row.key}`), ...row });
  }
  for (const table of ["siteCoverages", "siteProducts", "siteRiders"] as const) for (const row of db[table]) {
    const target = "productKey" in row ? row.productKey : "coverageKey" in row ? row.coverageKey : row.riderKey;
    const site = db.sites.find(s => s.id === row.siteId)!;
    const key = `${site.key}.${target}`;
    Object.assign(row, { key, ...libraryMetadata(table, key, `prototype:${table}/${key}`) });
  }
}
