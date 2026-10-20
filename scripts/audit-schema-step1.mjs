/** Read-only repository audit. Generates documentation; never connects to a database.
 * Usage: node scripts/audit-schema-step1.mjs /tmp/portal-schema-step1-audit
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import ts from 'typescript';
import { createServer } from 'vite';

const root = process.cwd();
const seedDir = path.resolve(process.argv[2] ?? '/tmp/portal-schema-step1-audit');
const out = path.join(root, 'docs/schema-step1');
fs.mkdirSync(out, { recursive: true });
const read = p => fs.readFileSync(p, 'utf8');
const hash = s => crypto.createHash('sha256').update(s).digest('hex');
const snake = s => s.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
const clean = s => s.replaceAll('"', '').trim();
const link = (file, line) => `${file}:${line}`;
const sources = [];

// Split outside quotes, comments, dollar bodies and nested parentheses. Keep source offsets.
function splitSql(text, delimiter = ';') {
  const result = []; let start = 0, depth = 0, quote = null, dollar = null;
  for (let i = 0; i < text.length; i++) {
    if (dollar) { if (text.startsWith(dollar, i)) { i += dollar.length - 1; dollar = null; } continue; }
    if (quote) { if (text[i] === quote) { if (text[i + 1] === quote) i++; else quote = null; } continue; }
    if (text.startsWith('--', i)) { const end = text.indexOf('\n', i); i = end < 0 ? text.length : end; continue; }
    if (text.startsWith('/*', i)) { const end = text.indexOf('*/', i + 2); if (end < 0) throw Error('Unclosed comment'); i = end + 1; continue; }
    if (text[i] === "'" || text[i] === '"') { quote = text[i]; continue; }
    const tag = text.slice(i).match(/^\$(?:[a-zA-Z_][\w]*)?\$/)?.[0];
    if (tag) { dollar = tag; i += tag.length - 1; continue; }
    if (text[i] === '(') depth++;
    if (text[i] === ')') depth--;
    if (text[i] === delimiter && depth === 0) { result.push({ text: text.slice(start, i), offset: start }); start = i + 1; }
  }
  if (quote || dollar || depth !== 0) throw Error('Unbalanced SQL');
  if (text.slice(start).trim()) result.push({ text: text.slice(start), offset: start });
  return result;
}
const tables = new Map(); const functions = []; const otherDdl = [];
function addPart(table, part, source) {
  const text = part.trim();
  if (/^(?:constraint\s+\w+\s+)?(?:primary key|unique|check|foreign key)\b/i.test(text)) {
    table.constraints.push({ sql: text, source }); return;
  }
  const match = text.match(/^"?(\w+)"?\s+([\s\S]+)$/);
  if (!match) throw Error(`Unrecognized column: ${text}`);
  const [, name, ddl] = match;
  if (table.columns[name]) throw Error(`Duplicate column ${table.name}.${name}`);
  table.columns[name] = { name, ddl, source, nullable: !/\bnot null\b|\bprimary key\b|\bgenerated\s+by\s+default\s+as\s+identity\b/i.test(ddl), type: ddl.match(/^\S+/)[0] };
}
for (const name of fs.readdirSync('supabase/migrations').filter(n => n.endsWith('.sql')).sort()) {
  const file = `supabase/migrations/${name}`, content = read(file);
  sources.push({ file, sha256: hash(content) });
  for (const statement of splitSql(content)) {
    const stripped = statement.text.replace(/--[^\n]*/g, m => ' '.repeat(m.length));
    const s = stripped.trim();
    const offset = statement.offset + stripped.search(/\S/);
    const source = link(file, content.slice(0, Math.max(0, offset)).split('\n').length);
    const create = s.match(/^create table(?: if not exists)? public\.(\w+)\s*\(([\s\S]*)\)$/i);
    if (create) {
      const table = { name: create[1], source, columns: {}, constraints: [], alterations: [], indexes: [], triggers: [], policies: [] };
      if (tables.has(table.name)) throw Error(`Duplicate table ${table.name}`);
      for (const part of splitSql(create[2], ',')) addPart(table, part.text, source);
      tables.set(table.name, table); continue;
    }
    const alter = s.match(/^alter table public\.(\w+)\s+([\s\S]*)$/i);
    if (alter) {
      const t = tables.get(alter[1]); if (!t) throw Error(`Unknown altered table: ${alter[1]}`);
      t.alterations.push({ sql: alter[2], source });
      for (const action of splitSql(alter[2], ',')) {
        const a = action.text.trim();
        if (/^add column /i.test(a)) addPart(t, a.replace(/^add column /i, ''), source);
        else if (/^add constraint /i.test(a)) t.constraints.push({ sql: a.replace(/^add /i, ''), source });
        else if (/^alter column \w+ set not null$/i.test(a)) t.columns[a.split(/\s+/)[2]].nullable = false;
        else if (/^enable row level security$/i.test(a)) t.rls = true;
        else throw Error(`Unhandled alteration: ${s}`);
      }
      continue;
    }
    const index = s.match(/^create (?:unique )?index\s+\w+\s+on public\.(\w+)/i);
    if (index) { tables.get(index[1]).indexes.push({ sql: s, source }); continue; }
    const trigger = s.match(/^create trigger[\s\S]*?\bon public\.(\w+)\b/i);
    if (trigger) { tables.get(trigger[1]).triggers.push({ sql: s, source }); continue; }
    const policy = s.match(/^create policy[\s\S]*?\bon public\.(\w+)\b/i);
    if (policy) { tables.get(policy[1]).policies.push({ sql: s, source }); continue; }
    if (/^create(?: or replace)? function /i.test(s)) functions.push({ sql: s, source });
    else if (/^(?:do |grant |revoke |create type )/i.test(s)) otherDdl.push({ sql: s, source });
  }
}

const tableMap = Object.fromEntries([...read('src/persistence/tableNames.ts').matchAll(/(\w+):\s*"(\w+)"/g)].map(m => [m[1], m[2]]));
const reverseMap = Object.fromEntries(Object.entries(tableMap).map(([a, b]) => [b, a]));
const config = ts.readConfigFile('tsconfig.app.json', ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
const program = ts.createProgram(parsed.fileNames, { ...parsed.options, noEmit: true });
const checker = program.getTypeChecker();
const schemaFile = program.getSourceFile(path.join(root, 'src/persistence/types/index.ts'));
const schemaNode = schemaFile.statements.find(s => ts.isInterfaceDeclaration(s) && s.name.text === 'DatabaseSchema');
const schemaType = checker.getTypeAtLocation(schemaNode);
const contract = {};
for (const symbol of checker.getPropertiesOfType(schemaType)) {
  const collection = checker.getTypeOfSymbolAtLocation(symbol, schemaNode);
  const row = checker.getIndexTypeOfType(collection, ts.IndexKind.Number);
  if (!row) throw Error(`Not a row array: ${symbol.name}`);
  contract[symbol.name] = { rowType: checker.typeToString(row), fields: checker.getPropertiesOfType(row).map(field => {
    const declaration = field.valueDeclaration ?? field.declarations?.[0] ?? schemaNode;
    const type = checker.getTypeOfSymbolAtLocation(field, declaration);
    const file = declaration.getSourceFile();
    const allowsNull = !!(type.flags & ts.TypeFlags.Null) || !!(type.isUnion() && type.types.some(member => member.flags & ts.TypeFlags.Null));
    return { name: field.name, sqlName: snake(field.name), type: checker.typeToString(type, declaration, ts.TypeFormatFlags.NoTruncation), allowsNull, optional: !!(field.flags & ts.SymbolFlags.Optional), source: link(path.relative(root, file.fileName), file.getLineAndCharacterOfPosition(declaration.getStart()).line + 1) };
  }) };
}
if (Object.keys(contract).sort().join() !== Object.keys(tableMap).sort().join()) throw Error('Contract/map inventory mismatch');
for (const [key, name] of Object.entries(tableMap)) if (!tables.has(name)) throw Error(`Missing SQL table: ${key}`);

const seeds = Object.fromEntries(['database', 'operations-data'].map(n => [n, JSON.parse(read(path.join(seedDir, `${n}.json`)))]));
const vite = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false, ws: false }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom' });
let manifest, snapshotTables;
try {
  manifest = (await vite.ssrLoadModule('/src/migration/canonical.ts')).expandedTableSpecs;
  snapshotTables = (await vite.ssrLoadModule('/src/persistence/snapshot.ts')).normalizedSnapshotTables;
} finally { await vite.close(); }
const manifestDrift = [];
for (const [name, spec] of Object.entries(manifest)) {
  const table = tables.get(name); if (!table) throw Error(`Manifest table not found: ${name}`);
  for (const [column, ddl] of Object.entries(spec.columns)) {
    const actual = table.columns[column];
    if (!actual) manifestDrift.push({ table: name, column, issue: 'Manifest column absent from SQL' });
    else if (clean(ddl).replace(/\s+/g,' ') !== clean(actual.ddl).replace(/\s+/g,' ')) manifestDrift.push({ table: name, column, manifest: ddl, sql: actual.ddl });
  }
  for (const constraint of spec.constraints) if (!table.constraints.some(c => clean(c.sql).replace(/\s+/g,' ') === clean(constraint).replace(/\s+/g,' '))) manifestDrift.push({ table: name, issue: 'Manifest constraint not text-equivalent to SQL', manifest: constraint });
}
for (const name of ['database', 'operations-data']) sources.push({ file: `${seedDir}/${name}.json`, sha256: hash(read(`${seedDir}/${name}.json`)) });
for (const file of ['src/persistence/tableNames.ts', 'src/persistence/seed.ts', 'supabase/seed.sql', 'src/migration/schema.ts', 'src/migration/canonical.ts', 'src/migration/export.ts', 'src/persistence/localAdapter.ts', 'src/persistence/supabaseAdapter.ts', 'src/persistence/mockOperationsAdapter.ts', 'src/persistence/snapshot.ts']) sources.push({ file, sha256: hash(read(file)) });
for (const file of ['scripts/audit-schema-step1.mjs', 'src/migration/canonicalSchema.ts', 'scripts/mock-platform.mjs', 'scripts/applicant-saves.mjs', 'src/services/libraryPublicationService.ts', ...fs.readdirSync('src/persistence/types').filter(n => n.endsWith('.ts')).map(n => `src/persistence/types/${n}`)]) sources.push({ file, sha256: hash(read(file)) });

const relationships = []; const referenceCandidates = []; const contractDrift = []; const jsonInventory = []; const seedViolations = [];
const metadata = new Set(['id', 'key', 'display_id', 'metric_key', 'release_key', 'flag_key']);
const referencePattern = /(?:_id|_key|_keys|_table|_column|_owner|_by|_reference|_step|_type|_fact|_path|_ref)$|^(?:fact|formula|derivation|url|image_ref)$/;
function keys(sql) { return clean(sql).split(',').map(s => s.trim()); }
for (const t of tables.values()) {
  t.contract = reverseMap[t.name] ? contract[reverseMap[t.name]] : null;
  t.adapterKey = reverseMap[t.name] ?? null;
  t.seedCounts = Object.fromEntries(Object.entries(seeds).map(([name, seed]) => [name, t.adapterKey ? (seed[t.adapterKey]?.length ?? null) : null]));
  t.uniques = [];
  for (const c of Object.values(t.columns)) if (/\bprimary key\b|\bunique\b/i.test(c.ddl)) t.uniques.push([c.name]);
  for (const c of t.constraints) {
    const m = c.sql.match(/(?:primary key|unique(?: nulls not distinct)?)\s*\(([^)]+)\)/i);
    if (m) t.uniques.push(keys(m[1]));
  }
  const addReference = (columns, target, targetColumns, sql, source) => {
    if (target.startsWith('public.') && !tables.has(target.slice(7))) throw Error(`Unknown FK target ${target}`);
    for (const column of columns) if (!t.columns[column]) throw Error(`Unknown FK column ${t.name}.${column}`);
    const r = { from: t.name, columns, target, targetColumns, nullable: columns.some(c => t.columns[c].nullable), childUnique: t.uniques.some(u => u.every(c => columns.includes(c))), onDelete: sql.match(/on delete (cascade|set null|restrict|no action|set default)/i)?.[1] ?? 'NO ACTION', onUpdate: sql.match(/on update (cascade|set null|restrict|no action|set default)/i)?.[1] ?? 'NO ACTION', source };
    if (target.startsWith('public.')) for (const c of targetColumns) if (!tables.get(target.slice(7)).columns[c]) throw Error(`Unknown target column: ${target}.${c}`);
    relationships.push(r);
  };
  for (const c of Object.values(t.columns)) {
    const m = c.ddl.match(/references\s+((?:public|auth)\.\w+)(?:\s*\(([^)]+)\))?/i);
    if (m) addReference([c.name], m[1], m[2] ? keys(m[2]) : ['id'], c.ddl, c.source);
  }
  for (const c of t.constraints) {
    const m = c.sql.match(/foreign key\s*\(([^)]+)\)\s*references\s+((?:public|auth)\.\w+)\s*\(([^)]+)\)/i);
    if (m) addReference(keys(m[1]), m[2], keys(m[3]), c.sql, c.source);
  }
  for (const c of Object.values(t.columns)) {
    if (referencePattern.test(c.name) && !relationships.some(r => r.from === t.name && r.columns.includes(c.name))) referenceCandidates.push({ table: t.name, column: c.name, ddl: c.ddl, classification: metadata.has(c.name) ? 'Own identity or vocabulary, not automatically a missing FK' : 'Unenforced candidate; see findings and raw DDL for vocabulary versus entity reference', source: c.source });
    const field = t.contract?.fields.find(f => f.sqlName === c.name);
    if (t.contract && !field) contractDrift.push({ table: t.name, column: c.name, issue: 'SQL column absent from contract' });
    if (field && !field.optional && c.nullable && !field.allowsNull) contractDrift.push({ table: t.name, column: c.name, issue: 'SQL nullable, contract excludes null', type: field.type });
    if (field && !c.nullable && field.allowsNull && c.type !== 'jsonb') contractDrift.push({ table: t.name, column: c.name, issue: 'Contract allows null, SQL requires value', type: field.type });
    if (c.type === 'jsonb') {
      const paths = new Map();
      const walk = (v, p, rowId) => {
        if (Array.isArray(v)) { for (const item of v) walk(item, `${p}[]`, rowId); return; }
        if (v && typeof v === 'object') { for (const [k, item] of Object.entries(v)) walk(item, p ? `${p}.${k}` : k, rowId); return; }
        const leaf = p.split('.').at(-1)?.replaceAll('[]', '') ?? '';
        if (/key|id|ref|target|source|owner|actor|page|field|product|rider|association|condition|rule|flow|flag|applicant|depend|formula|expression|fact|path|scope|client|site|table|column|validation|when|visible|include|require/i.test(leaf)) {
          const entry = paths.get(p) ?? { path: p, count: 0, samples: [] };
          entry.count++;
          const value = typeof v === 'string' ? v.slice(0, 180) : v;
          if (entry.samples.length < 3 && !entry.samples.some(s => JSON.stringify(s.value) === JSON.stringify(value))) entry.samples.push({ rowId, value });
          paths.set(p, entry);
        }
      };
      for (const [seedName, seed] of Object.entries(seeds)) for (const row of seed[t.adapterKey] ?? []) if (field) walk(row[field.name], '', `${seedName}:${row.id}`);
      jsonInventory.push({ table: t.name, column: c.name, contractType: field?.type ?? 'RPC payload / SQL only', source: c.source, candidatePaths: [...paths.values()].sort((a,b) => a.path.localeCompare(b.path)) });
    }
  }
  for (const f of t.contract?.fields ?? []) if (!t.columns[f.sqlName]) contractDrift.push({ table: t.name, field: f.name, issue: 'Contract field absent from SQL' });
}

// Check current exports, not previously saved fixtures. No repairs or guessed identity mapping.
for (const [seedName, seed] of Object.entries(seeds)) {
  for (const t of tables.values()) {
    const rows = seed[t.adapterKey] ?? [];
    for (const c of Object.values(t.columns).filter(c => c.type === 'uuid')) {
      const field = t.contract?.fields.find(f => f.sqlName === c.name);
      if (!field) continue;
      const invalid = rows.filter(r => r[field.name] != null && !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(r[field.name]));
      if (invalid.length) seedViolations.push({ seed: seedName, table: t.name, column: c.name, issue: 'Semantic string in UUID SQL column; generic adapter does not transform identities', count: invalid.length, samples: invalid.slice(0,3).map(r => ({ id: r.id, value: r[field.name] })) });
    }
    for (const r of relationships.filter(r => r.from === t.name && r.target.startsWith('public.'))) {
      const target = tables.get(r.target.slice(7));
      const fromFields = r.columns.map(c => t.contract?.fields.find(f => f.sqlName === c)?.name);
      const targetFields = r.targetColumns.map(c => target.contract?.fields.find(f => f.sqlName === c)?.name);
      if (fromFields.some(f => !f) || targetFields.some(f => !f)) continue;
      const targetKeys = new Set((seed[target.adapterKey] ?? []).map(row => JSON.stringify(targetFields.map(f => row[f]))));
      const invalid = rows.filter(row => fromFields.every(f => row[f] != null) && !targetKeys.has(JSON.stringify(fromFields.map(f => row[f]))));
      if (invalid.length) seedViolations.push({ seed: seedName, table: t.name, columns: r.columns, target: r.target, issue: 'Unresolved FK in this standalone export; may be intentionally partial', count: invalid.length, samples: invalid.slice(0,3).map(row => ({ id: row.id, values: fromFields.map(f => row[f]) })) });
    }
  }
}

function ownership(t) {
  const c = t.columns;
  if (t.name === 'organizations') return 'Organization account root';
  if (t.name === 'clients') return 'Organization via organization_id';
  if (t.name === 'sites') return 'Client via client_id';
  if (t.name === 'applicants') return 'Client via client_id';
  if (t.name === 'applications') return 'Site via site_id; client derived';
  if (t.name === 'flag_assignments') return 'Global or one nullable target; application target also permitted (F08)';
  if (c.scope) return 'Global/client/site according to scope; see CHECK for required target';
  if (c.site_id || c.site_key) return (c.client_id || c.client_key ? 'Site and client references; compatibility depends on composite FK or code (F03)' : 'Site reference; client derived') + (c.application_id ? '; application child' : '');
  if (c.application_id) return 'Application via application_id';
  if (c.client_id || c.client_key) return `Client${c.site_key ? ' or site' : ''} reference${t.name === 'migration_schedules' ? ' not enforced (F02)' : ''}`;
  if (c.organization_key) return 'Organization via organization_key';
  if (c.user_id || t.name === 'users') return 'Identity/access record; public users and auth.users are separate (F07)';
  if (['change_requests','change_items','releases','release_changes','audit_events'].includes(t.name)) return 'Portal operations; entity/site scope only where a column provides it';
  return 'Shared catalog or source-evidence child; no organization/client/site owner column';
}
const purposes = {
  organizations: 'Organization account roots, currently including TPAs', clients: 'Client organization accounts under an organization', sites: 'Portal application experiences owned by a client',
  applicants: 'Client-owned people independent of sign-in accounts', applications: 'Operational application status, site and action owner', application_applicants: 'People and applicant roles on applications with tenant consistency columns', application_associations: 'Optional single association selected for an application', application_participants: 'Workflow participants with optional public-user link and copied contact details', application_events: 'Application workflow/status history',
  users: 'Portal user profiles, separate from Supabase auth identities', roles: 'Role vocabulary', user_roles: 'User-to-role assignments', user_scopes: 'User access scope assignments with polymorphic target', audit_events: 'Operational entity change history and free-text actor',
  change_requests: 'Change request tracking, owner and target release', change_items: 'Entity/field changes proposed under change requests', releases: 'Operational delivery release planning', release_changes: 'Release-to-change request assignments', site_builder_drafts: 'Proposed site construction data before publication',
  analytics_metrics: 'Measurement definitions and units', analytics_measurements: 'Sourced period measurements by optional client, site and device', analytics_tags: 'Interaction instrumentation definitions and vendor mapping metadata', migration_schedules: 'Client migration milestones and expected dates',
  organization_profiles: 'Extended organization metadata', associations: 'Client-owned membership association definitions', pages: 'Page catalog and routing definitions', page_sections: 'Sections of catalog pages', fields: 'Reusable field definitions', page_fields: 'Ordered page-to-field composition', coverage_categories: 'Coverage category catalog', products: 'Products classified by coverage category', riders: 'Optional benefit/rider definitions', product_riders: 'Scoped product-to-rider assignments', product_identifiers: 'Scoped product identifiers such as G number and plan code', applicant_types: 'Applicant-role metadata, not people',
  conditions: 'Condition definitions and expressions', rules: 'Rule definitions', rule_conditions: 'Rule-to-condition composition', rule_actions: 'Legacy JSON action definitions under rules', flows: 'Flow catalog', flow_steps: 'Nodes within flows', flow_transitions: 'Edges with source and target nodes constrained to the same flow', features: 'Feature catalog', configuration_definitions: 'Configuration paths, targets and metadata', content_entries: 'Content slot definitions', email_templates: 'Email template definitions', document_definitions: 'Document catalog definitions', validation_rules: 'Field validation definitions', components: 'Portal component catalog and Storybook metadata',
  site_associations: 'Associations assigned to sites', site_pages: 'Page participation and ordering on sites', site_field_configurations: 'Scoped page-field inclusion and override values', site_product_applicants: 'Applicant-role types offered for products on sites', site_features: 'Feature activation on sites', site_flows: 'Scoped flow selection and runtime alias', rule_assignments: 'Scoped rule activation/order', configuration_values: 'Scoped configuration values', content_values: 'Scoped content values', branding_profiles: 'Scoped brand presentation definitions', support_profiles: 'Scoped support contact/presentation definitions', site_email_templates: 'Email templates enabled on sites', site_documents: 'Document assignments on sites', site_policies: 'Site association and payment policy definitions', site_environment_links: 'Site launch/reference links by environment', site_coverages: 'Legacy site-to-coverage assignment', site_products: 'Site-to-product assignment', site_riders: 'Site-to-rider assignment', site_configurations: 'Legacy dated site configuration values',
  provenance_tags: 'Controlled provider/evidence vocabulary', source_workbooks: 'Imported workbook identity and content hash', source_sheets: 'Workbook sheets and extraction metadata', source_requirements: 'Cell-level source evidence and adoption state', patterns: 'Reusable behavior pattern catalog', flag_definitions: 'Flag vocabulary, value type and persistence intent', flag_values: 'Named values of flags', flag_assignments: 'Flag values attached to zero or one catalog/tenant/application target', flag_rules: 'Conditional flag derivation rules', rule_flags: 'Flag predicates associated with rules', rule_predicates: 'Normalized rule facts/operators/values', structured_rule_actions: 'Normalized action type and value under rules', product_configuration_values: 'Product-specific configuration values', product_clients: 'Products available to clients', coverage_plan_definitions: 'Reusable coverage plan families', coverage_plan_variants: 'Plan variants and applicant-role qualifiers', product_coverage_plans: 'Product-to-plan and applicant-role assignments', plan_benefit_periods: 'Waiting/benefit durations on plan variants', pattern_assignments: 'Pattern configuration for optional client, site, product or applicant-role targets', coverage_amount_patterns: 'Amount calculation/selection strategy and optional base product/role', amount_options: 'Ordered named amount choices', amount_bands: 'Conditional amount ranges/increments', product_amount_rules: 'Conditional amount strategy for product and optional role/tenant', product_applicant_eligibility: 'Product applicant-role eligibility with optional site/condition', rider_amount_rules: 'Rider amount strategy and optional base product/condition', aggregate_limits: 'Coverage/product/role aggregate maximum or formula', underwriting_bands: 'Product underwriting pathways by age and amount band', residency_rules: 'Site/product/rider jurisdiction eligibility policy', residency_jurisdictions: 'Jurisdictions under residency policies', benefit_period_options: 'Product/site/applicant-role waiting and benefit choices', eligibility_constraints: 'Product/site/applicant-role age and work eligibility', coverage_dependencies: 'Required applicant-role/category relationships for coverage', maximum_plan_rules: 'Limits on plan counts by product/site/applicant-role/category', benefit_caps: 'Conditional benefit caps under aggregate limits', question_sets: 'Versioned question group definitions', question_definitions: 'Individual questions, response type and status', question_set_questions: 'Ordered conditional question membership in sets', question_set_fields: 'Ordered conditional field membership in question sets', rate_tables: 'Rate table content and external assets', product_rate_tables: 'Conditional product/site assignment of rate tables', rate_table_presentations: 'Rate table placement/display mode by site/product/flag', url_parameters: 'URL parameter vocabulary and behavior', site_url_parameters: 'URL parameters enabled on sites', client_environment_links: 'Client environment URLs', url_parameter_values: 'Named values of URL parameters', page_section_fields: 'Field composition within page sections', requirement_targets: 'Source evidence links to polymorphic table/key/column targets', semantic_requirements: 'Documented semantic predicates for polymorphic subjects', identity_resolutions: 'Source-row identity matches, candidates and explanations', url_definitions: 'Parsed URL identity, parts and parameters', url_usages: 'Recorded URL usage and optional client', product_question_sets: 'Product question-set assignments with optional applicant-role', plan_amount_rules: 'Conditional amount strategies on plan variants',
  portal_admin_accounts: 'Approved Supabase authentication identities for publication administration', portal_library_drafts: 'Versioned site configuration drafts owned by an auth identity', portal_library_releases: 'Published site configuration payloads and publisher identity', portal_library_heads: 'Current published release pointer and generation per site', portal_library_readiness: 'Service-written readiness evidence bound to site and payload hash', portal_library_publication_audit: 'Auth actor and draft/release history of publication actions',
};
function candidateClassification(r) {
  if (['id','key','display_id','metric_key','release_key'].includes(r.column)) return 'Identity of this row or catalog vocabulary; no outgoing FK required';
  if (['source_reference','source_owner','evidence_reference'].includes(r.column)) return 'Evidence label or locator; intentional free text, not a validated portal actor';
  if (['url','image_ref','legacy_client_id'].includes(r.column)) return 'External asset/URL or compatibility alias; separate validation and alias resolution, not necessarily a portal entity FK';
  if (['fact','formula','derivation'].includes(r.column)) return 'Executable expression or fact name; references require DSL/resolver validation, not a simple FK';
  if (r.column.endsWith('_type') || ['current_step','from_owner_type','to_owner_type'].includes(r.column)) return 'Discriminator or vocabulary; SQL enum/CHECK where present; entity pairing still requires validation';
  if (r.table === 'site_builder_drafts' && r.column === 'site_key') return 'Proposed site key before creation; need uniqueness/reservation semantics, not necessarily an existing-site FK';
  if (r.table === 'site_flows' && r.column === 'flow_id') return 'Runtime flow alias distinct from catalog flow_key; alias consistency is code-only';
  if (['target_table','target_key','target_column','subject_table','subject_key'].includes(r.column)) return 'Polymorphic evidence target; target existence/column validity not enforced by SQL';
  if (['active_site_keys','candidate_keys'].includes(r.column)) return 'Embedded JSON entity candidates; source-evidence alternatives require explicit reconciliation';
  if (['performed_by','requested_by','owner_id','current_action_owner_id','scope_id','entity_id'].includes(r.column)) return 'Actor/entity/scope target; unenforced relationship and unresolved historical identity semantics';
  if (['field_key','element_key','page_id'].includes(r.column)) return 'Logical runtime or audit target; may be catalog or interaction identity; validation alternative must be documented';
  return 'Entity/catalog key candidate without FK; unresolved relationship (see findings)';
}
for (const r of referenceCandidates) r.classification = candidateClassification(r);
for (const t of tables.values()) {
  t.observedOwnership = ownership(t);
  t.purpose = purposes[t.name] ?? (t.name.startsWith('pattern_') ? `Pattern-to-${t.name.slice(8).replaceAll('_',' ')} composition with relationship type` : null);
  if (!t.purpose) throw Error(`Missing table purpose ${t.name}`);
}
const sorted = [...tables.values()].sort((a,b) => a.name.localeCompare(b.name));
const report = { scope: 'Step 1 only; repository audit, no database application or full schema gate', date: '2026-10-12', counts: { sqlTables: tables.size, adapterTables: Object.keys(tableMap).length, foreignKeys: relationships.length, jsonColumns: jsonInventory.length }, sources, tables: sorted, relationships, referenceCandidates, jsonInventory, contractDrift, manifestDrift, snapshotTables, seedViolations, functions, otherDdl };
fs.writeFileSync(`${out}/inventory.json`, JSON.stringify(report, null, 2) + '\n');
const escape = s => String(s ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ');
let scalarMd = '# Portal scalar reference register\n\nAll detected identity, key, actor, discriminator, evidence, URL and expression columns without an FK are listed. The classifications distinguish justified storage alternatives from unresolved entity relationships. References already enforced appear in the table dictionary and diagrams. Free text expressions may embed further names; this register does not treat vocabulary as an invented relationship.\n\n| Table | Column | Current classification | SQL source |\n| --- | --- | --- | --- |\n';
for (const r of referenceCandidates) scalarMd += `| ${r.table} | ${r.column} | ${r.classification} | ${r.source} |\n`;
fs.writeFileSync(`${out}/scalar-references.md`, scalarMd);
let dictionary = '# Portal database table dictionary\n\nStep 1 repository audit dated October 12, 2026. All 135 public tables are included; 129 have generic adapter contracts. Ownership here describes current columns, not the final ownership decision. `auth.users` is an external Supabase dependency. See [findings](audit.md), [relationship diagrams](relationships.md), and [machine-readable evidence](inventory.json).\n\nSQL below includes CREATE columns plus additive ALTER columns. Table CHECKs and alterations are preserved rather than interpreted as stronger business rules. Nullability is SQL nullability; JSON `null` differs from SQL NULL. Default FK update/delete behavior is NO ACTION. SQL-only publication tables use RPCs; generic adapters assume an `id` column and do not support these tables.\n\n';
dictionary += '| Table | Adapter key | Observed ownership | Reviewed / local seed rows |\n| --- | --- | --- | --- |\n';
for (const t of sorted) dictionary += `| [${t.name}](#${t.name.replaceAll('_','-')}) | ${t.adapterKey ?? 'RPC only'} | ${escape(t.observedOwnership)} | ${t.seedCounts.database ?? '—'} / ${t.seedCounts['operations-data'] ?? '—'} |\n`;
for (const t of sorted) {
  dictionary += `\n## ${t.name.replaceAll('_',' ')}\n\nTable: \`${t.name}\`. ${t.purpose}. Created at \`${t.source}\`. Current ownership: ${t.observedOwnership}.\n\n`;
  dictionary += t.contract ? `Contract: \`${t.contract.rowType}\`; adapter key: \`${t.adapterKey}\`. Supabase performs shallow snake/camel mapping; local storage does not enforce SQL constraints.\n\n` : 'No DatabaseSchema collection or generic adapter mapping. Publication RPCs and trusted service writes access this table. No ordinary demo seed rows.\n\n';
  dictionary += '| Column | SQL type | SQL nullable | Contract field and type | Definition source |\n| --- | --- | --- | --- | --- |\n';
  for (const c of Object.values(t.columns)) { const f = t.contract?.fields.find(f => f.sqlName === c.name); dictionary += `| ${c.name} | ${c.type} | ${c.nullable ? 'yes' : 'no'} | ${f ? escape(`${f.name}${f.optional ? '?' : ''}: ${f.type}`) : 'RPC only / absent'} | ${f ? `\`${f.source}\`` : `\`${c.source}\``} |\n`; }
  dictionary += '\n```sql\n' + Object.values(t.columns).map(c => `${c.name} ${c.ddl}`).join(',\n') + (t.constraints.length ? ',\n' + t.constraints.map(c => c.sql).join(',\n') : '') + '\n```\n\n';
  const refs = relationships.filter(r => r.from === t.name);
  dictionary += refs.length ? 'Enforced foreign keys:\n\n' + refs.map(r => `- \`(${r.columns.join(', ')}) → ${r.target}(${r.targetColumns.join(', ')})\`; ${r.nullable ? 'nullable/MATCH SIMPLE' : 'required'}; ${r.childUnique ? 'unique child key' : 'multiple children permitted'}; delete ${r.onDelete}; update ${r.onUpdate}.`).join('\n') + '\n\n' : 'No foreign keys.\n\n';
  const candidates = referenceCandidates.filter(r => r.table === t.name);
  if (candidates.length) dictionary += 'Unenforced reference or vocabulary candidates: ' + candidates.map(c => `\`${c.column}\``).join(', ') + '. These require semantic review; a vocabulary field is not automatically an entity reference.\n\n';
  const json = jsonInventory.filter(j => j.table === t.name);
  if (json.length) dictionary += 'JSON surfaces: ' + json.map(j => `\`${j.column}\` (${j.candidatePaths.length} observed candidate paths)`).join(', ') + '. Full paths, counts and sample row IDs are in [JSON reference register](json-references.md). Empty seeds do not establish an absence of embedded references.\n\n';
  if (t.alterations.length) dictionary += 'Additive migration history:\n\n' + t.alterations.map(a => `- \`${a.source}\`: ${escape(a.sql)}`).join('\n') + '\n\n';
  if (t.indexes.length || t.triggers.length) dictionary += 'Indexes and triggers:\n\n```sql\n' + [...t.indexes, ...t.triggers].map(x => x.sql + ';').join('\n') + '\n```\n\n';
  dictionary += `RLS enabled: ${t.rls ? 'yes' : 'no'}. Policies/grants, including dynamic demo policies, are retained in inventory.json; RLS alone does not establish ownership validation.\n`;
}
fs.writeFileSync(`${out}/table-dictionary.md`, dictionary);

let jsonMd = '# Portal JSON reference register\n\nEvery JSON column is listed. Paths are reference candidates observed in current reviewed and local seed exports, including expressions and vocabulary; they are not claims of foreign keys. Array indexes are generalized to `[]`. Arbitrary JSON, expressions, URLs and unseeded RPC payloads can carry further references. Contracts and resolver validation must be considered alongside these paths. SQL CHECKs are in the table dictionary.\n\n';
for (const j of jsonInventory) {
  jsonMd += `## ${j.table.replaceAll('_',' ')} ${j.column.replaceAll('_',' ')}\n\nSQL source: \`${j.source}\`. Contract: \`${escape(j.contractType)}\`.\n\n`;
  if (!j.candidatePaths.length) jsonMd += 'No candidate paths observed in these exports. This is not evidence that the JSON cannot contain references.\n\n';
  else { jsonMd += '| Path | Occurrences | Sample value and row |\n| --- | --- | --- |\n'; for (const p of j.candidatePaths) jsonMd += `| ${escape(p.path)} | ${p.count} | ${escape(p.samples.map(s => `${JSON.stringify(s.value)} (${s.rowId})`).join('; '))} |\n`; jsonMd += '\n'; }
}
fs.writeFileSync(`${out}/json-references.md`, jsonMd);

// ER notation describes FK cardinality only, never a required minimum of children.
let diagram = '# Portal database relationship diagrams\n\nSolid ER edges represent migration foreign keys. Parents may have zero children. A required FK gives exactly one parent per child; a nullable FK gives zero or one. A unique child FK limits the parent to zero or one matching child. Composite constraints use all listed columns. Dashed inferred business relationships are deliberately excluded. Provenance edges are separated for readability. No organization or site ownership is implied by layout. All 135 public entities occur in at least one diagram; auth.users is external.\n\n';
const groups = new Map();
for (const t of sorted) { const file = t.source.split(':')[0].split('/').at(-1); if (!groups.has(file)) groups.set(file, []); groups.get(file).push(t); }
function edge(r) { return `  ${r.target.replace('.', '_')} ${r.nullable ? '|o' : '||'}--${r.childUnique ? 'o|' : 'o{'} public_${r.from} : "${r.columns.join('+')} to ${r.targetColumns.join('+')}"`; }
for (const [group, allMembers] of groups) for (let offset = 0; offset < allMembers.length; offset += 15) {
  const members = allMembers.slice(offset, offset + 15);
  diagram += `## ${group.replace('.sql','').replaceAll('_',' ')} part ${Math.floor(offset / 15) + 1}\n\n\`supabase/migrations/${group}\`\n\n\`\`\`mermaid\nerDiagram\n`;
  for (const t of members) diagram += `  public_${t.name}\n`;
  for (const r of relationships.filter(r => members.some(t => t.name === r.from) && !(r.columns.length === 1 && r.columns[0] === 'provided_by'))) diagram += edge(r) + '\n';
  diagram += '```\n\n';
}
const provenance = relationships.filter(r => r.columns.length === 1 && r.columns[0] === 'provided_by');
for (let offset = 0; offset < provenance.length; offset += 15) {
  diagram += `## Provenance metadata part ${Math.floor(offset / 15) + 1}\n\n\`\`\`mermaid\nerDiagram\n`;
  for (const r of provenance.slice(offset, offset + 15)) diagram += edge(r) + '\n';
  diagram += '```\n\n';
}
fs.writeFileSync(`${out}/relationships.md`, diagram);
fs.writeFileSync(`${out}/relationships.mmd`, 'erDiagram\n' + sorted.map(t => `  public_${t.name}`).join('\n') + '\n' + relationships.map(edge).join('\n') + '\n');
console.log(JSON.stringify({ ...report.counts, contractDrift: contractDrift.length, seedViolationGroups: seedViolations.length, output: out }, null, 2));
