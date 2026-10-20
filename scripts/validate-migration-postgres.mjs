import { verifyFieldSurfaceUpgrade } from './verify-field-surfaces-postgres.mjs';
/** Runs only against the named disposable container; never reads credentials or .env. */
import { spawn, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { verifyPageCatalogUpgrade } from "./verify-page-catalog-postgres.mjs";
import { verifyFieldCollectionUpgrade } from "./verify-field-collections-postgres.mjs";
import { verifyApplicationRelationships } from "./verify-application-relationships-postgres.mjs";

const container = "portal-migration-review";
const reviewed = process.argv.includes("--reviewed");
if (process.argv.slice(2).some(argument => argument !== "--reviewed")) throw new Error("Usage: npm run migration:postgres -- [--reviewed]");
const directory = resolve(process.env.MIGRATION_EXPORT_DIR ?? "/tmp/portal-migration-review");
const database = `portal_review_${process.pid}`;
mkdirSync(directory, { recursive: true });
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...options });
  if (result.error || result.status !== 0) throw new Error(`${command} failed: ${result.error ?? result.stderr ?? result.stdout}`);
  return result.stdout;
}
function sql(input, target = database) {
  return run("docker", ["exec", "-i", container, "psql", "-U", "postgres", "-d", target, "-v", "ON_ERROR_STOP=1", "-qAt"], { input });
}
console.log(run("npx", ["vitest", "run", reviewed ? "src/migration/reviewedExport.test.ts" : "src/migration/export.test.ts"], { env: { ...process.env, MIGRATION_EXPORT_DIR: directory } }));
sql(`create database ${database};`, "postgres");
try {
  // Supabase roles are cluster-wide; only add them when absent on a fresh review server.
  sql("do $$ begin if not exists(select from pg_roles where rolname='anon') then create role anon; end if; if not exists(select from pg_roles where rolname='authenticated') then create role authenticated; end if; if not exists(select from pg_roles where rolname='service_role') then create role service_role; end if; end $$;");
  // Minimal Supabase auth stand-ins only inside this disposable database.
  // These checks do not claim to verify real Supabase authentication.
  sql("create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql as 'select null::uuid'; create function auth.jwt() returns jsonb language sql as $$ select '{}'::jsonb $$;");
  for (const file of ["202609240001_initial_portal_schema.sql", "202609240002_analytics_domain.sql", "202609240003_portal_library.sql", "202609250001_site_environment_links.sql", "202609280001_canonical_normalization.sql", "202609280002_source_promotion.sql", "202610010001_normalized_snapshot.sql", "202610020001_library_publication.sql", "202610050001_migration_schedule.sql", "202610050002_analytics_tags.sql", "202610120001_portal_components.sql"]) sql(readFileSync(`supabase/migrations/${file}`, "utf8"));
  const fixture = JSON.parse(readFileSync(resolve(directory, "database.json"), "utf8"));
  sql(readFileSync("supabase/migrations/202610120002_application_relationships.sql", "utf8"));
  const newTables = Object.keys(fixture).filter((name) => !["organizations", "clients", "sites", "siteCoverages", "siteProducts", "siteRiders", "siteConfigurations", "applications", "applicationParticipants", "applicationEvents", "changeRequests", "changeItems", "releases", "releaseChanges", "siteBuilderDrafts", "users", "roles", "userRoles", "userScopes", "auditEvents", "analyticsMetrics", "analyticsMeasurements"].includes(name));
  const tables = ["organizations", "clients", "sites", "siteCoverages", "siteProducts", "siteRiders", ...newTables.filter(name => !['applicants', 'applicationApplicants', 'applicationAssociations'].includes(name))];
  const snake = (key) => key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  const dump = () => sql(`select jsonb_object_agg(name, rows) from (${tables.map(name => `select '${snake(name)}'::text as name, (select coalesce(jsonb_agg(to_jsonb(t) order by id),'[]'::jsonb) from public.${snake(name)} t) as rows`).join(" union all ")}) tables;`).trim();
  const seed = readFileSync(resolve(directory, "seed.sql"), "utf8");
  sql(seed);
  verifyApplicationRelationships(sql);
  const pageCatalogUpgrade = verifyPageCatalogUpgrade(sql);
  sql(readFileSync("supabase/migrations/202610090001_page_catalog_contract.sql", "utf8"));
  const fieldCollectionUpgrade = verifyFieldCollectionUpgrade(sql);
  sql(readFileSync("supabase/migrations/202610090002_field_collections.sql", "utf8"));
  const fieldSurfaceUpgrade = verifyFieldSurfaceUpgrade(sql);
  sql(readFileSync("supabase/migrations/202610090003_field_surfaces.sql", "utf8"));
  const first = dump();
  sql(seed);
  if (first !== dump()) throw new Error("Second seed application changed persisted rows");
  const readback = resolve(directory, "postgres.json");
  writeFileSync(readback, first + "\n");
  const snapshotSql = readFileSync("supabase/migrations/202610010001_normalized_snapshot.sql", "utf8");
  const allowed = snapshotSql.match(/allowed_tables constant text\[\] := array\[(.*?)\]/s)[1];
  const snapshotPath = resolve(directory, "postgres-snapshot.json");
  writeFileSync(snapshotPath, sql(`select public.portal_read_snapshot(array[${allowed}]);`));
  console.log(run("npx", ["vitest", "run", "src/migration/postgres.test.ts"], { env: { ...process.env, MIGRATION_POSTGRES_READBACK: readback, MIGRATION_POSTGRES_SNAPSHOT: snapshotPath, MIGRATION_POSTGRES_REVIEWED: reviewed ? "1" : "" } }));
  const reject = (statement) => {
    try { sql(`begin; ${statement}; rollback;`); } catch { return; }
    throw new Error(`PostgreSQL accepted invalid data: ${statement}`);
  };
  reject("insert into public.site_associations(id,key,site_key,association_key,enabled) values ('bad','bad','ama','missing',true)");
  reject("insert into public.content_values(id,key,scope,client_key,site_key,content_key,value) select 'bad','bad','global','ama',null,key,'null'::jsonb from public.content_entries limit 1");
  reject("insert into public.page_fields(id,key,page_key,field_key,position) select 'bad','bad',page_key,field_key,position from public.page_fields limit 1");
  reject("insert into public.site_associations(id,key,site_key,association_key,enabled) values ('cross-client','cross-client','waepa-gi','american-medical-association',true)");
  reject("insert into public.site_environment_links(id,key,site_key,environment,link_type,label,url,active) values ('bad-url','bad-url','asce','production','launch','Bad','javascript:alert(1)',true)");
  reject("insert into public.site_environment_links(id,key,site_key,environment,link_type,label,url,active) values ('bad-site','bad-site','missing','production','launch','Bad','https://example.test',true)");
  reject("insert into public.site_environment_links(id,key,site_key,environment,link_type,label,url,active) values ('bad-environment','bad-environment','asce','unknown','launch','Bad','https://example.test',true)");
  const invalidPageWrites = [
    "update public.pages set definition = definition - 'flow' where key = 'home'",
    "update public.pages set definition = jsonb_set(definition, '{flow}', '\"unknown\"') where key = 'home'",
    "update public.pages set definition = jsonb_set(definition, '{id}', '\"mismatch\"') where key = 'home'",
    "update public.pages set definition = jsonb_set(definition, '{type}', '\"unknown\"') where key = 'home'",
    ...['https://example.test', '//example.test', '/bad?query', '/bad#fragment', '/bad path'].map(path => `update public.pages set definition = jsonb_set(definition, '{path}', '${JSON.stringify(path)}') where key = 'home'`),
    "update public.pages set definition = jsonb_set(definition, '{path}', '\"/\"') where key = 'review'",
    "update public.pages set position = -1 where key = 'home'",
    "update public.site_pages set position = -1 where site_key = 'asce' and page_key = 'home'",
  ];
  for (const statement of invalidPageWrites) reject(statement);
  reject("select public.portal_read_snapshot(array['applications'])");
  reject("select public.portal_read_snapshot(array['sites','sites'])");
  reject("select public.portal_read_snapshot(array[]::text[])");
  reject("select public.portal_read_snapshot(array[null]::text[])");
  reject("set local role anon; select public.portal_read_snapshot(array['sites'])");
  const rlsResult = JSON.parse(sql("begin; grant select on public.products to authenticated; set local role authenticated; select public.portal_read_snapshot(array['products']); rollback;"));
  if (rlsResult.data.products.length !== 0) throw new Error("Snapshot bypassed caller RLS");
  await verifyConcurrentSnapshot();
  const rls = Number(sql(`select count(*) from pg_class where relname in (${newTables.map((n) => `'${snake(n)}'`).join(",")}) and relrowsecurity;`).trim());
  if (rls !== newTables.length) throw new Error("Missing RLS on library tables");
  reject("insert into public.pattern_rules(id,key,pattern_key,related_key,relationship_type,display_id) values ('bad','bad','missing','missing','uses',1)");
  reject("insert into public.coverage_amount_patterns(id,key,pattern_key,amount_type,display_id,increment) values ('bad','bad','coverage-amount-options','range',1,-1)");
  reject("insert into public.flag_definitions(id,key,name,level,value_type,persistence,description,display_id,provided_by) values ('bad','bad','Bad','site','boolean','configuration','Bad',1,'unknown')");
  reject("update public.source_requirements set promotion_state = 'AUTO_PROMOTED'");
  reject("update public.source_requirements set promotion_state = 'SOURCE_ONLY', active_site_keys = '[\"abe\"]'::jsonb");
  writeFileSync(resolve(directory, "postgres-validation.json"), JSON.stringify({ candidate: reviewed ? "reviewed-step3" : "compatibility-baseline", postgres: sql("show server_version;").trim(), migrations: 13, pageCatalogUpgrade, fieldCollectionUpgrade, fieldSurfaceUpgrade, seedApplications: 2, idempotent: true, readbackEquivalence: true, rejectedInvalidWrites: 12 + invalidPageWrites.length, rejectedSnapshotRequests: 5, snapshotRls: true, concurrentSnapshot: true, rlsTables: rls }, null, 2) + "\n");
  console.log(`PostgreSQL gate passed. Results: ${directory}`);
} finally {
  sql(`drop database ${database};`, "postgres");
}

/** Stall the second table while a transaction changes both tables. The snapshot
 * must see the old values together; a later statement must see the new values. */
async function verifyConcurrentSnapshot() {
  const before = JSON.parse(sql("select public.portal_read_snapshot(array['clients','sites']);"));
  const args = ["exec", "-i", container, "psql", "-U", "postgres", "-d", database, "-v", "ON_ERROR_STOP=1", "-qAt"];
  const writer = spawn("docker", args, { stdio: ["pipe", "pipe", "pipe"] });
  let output = "", failure = "";
  writer.stdout.on("data", chunk => { output += chunk; });
  writer.stderr.on("data", chunk => { failure += chunk; });
  const waitFor = async predicate => {
    const start = Date.now();
    while (!predicate()) {
      if (Date.now() - start > 15000) throw new Error(`Concurrent snapshot test timed out: ${failure}`);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  };
  let reader;
  try {
    writer.stdin.write("begin; lock public.sites in access exclusive mode; update public.clients set name = name || ' concurrent'; update public.sites set name = name || ' concurrent'; select 'writer_ready';\n");
    await waitFor(() => output.includes("writer_ready"));
    reader = spawn("docker", args, { stdio: ["pipe", "pipe", "pipe"] });
    let readOutput = "", readError = "";
    reader.stdout.on("data", chunk => { readOutput += chunk; });
    reader.stderr.on("data", chunk => { readError += chunk; });
    const done = new Promise((resolve, reject) => reader.on("close", code => code === 0 ? resolve() : reject(new Error(readError))));
    reader.stdin.end("set application_name = 'portal_snapshot_reader'; select public.portal_read_snapshot(array['clients','sites']);\n");
    await waitFor(() => sql("select count(*) from pg_stat_activity where application_name='portal_snapshot_reader' and wait_event_type='Lock';").trim() === "1");
    writer.stdin.end("commit;\n");
    await done;
    if (JSON.parse(readOutput).revision !== before.revision) throw new Error("Snapshot mixed concurrent committed edits");
    const after = JSON.parse(sql("select public.portal_read_snapshot(array['clients','sites']);"));
    if (after.revision === before.revision || !after.data.clients.every(row => row.name.endsWith(" concurrent")) || !after.data.sites.every(row => row.name.endsWith(" concurrent"))) throw new Error("Fresh snapshot missed committed edits");
  } finally {
    if (!writer.stdin.destroyed) writer.stdin.end("rollback;\n");
    if (reader && !reader.stdin.destroyed) reader.stdin.end();
  }
}
