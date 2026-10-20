/** File-only review. Reads captured PostgreSQL evidence and current contracts/seeds.
 * Never connects to a database, reads saved applicant stores, or modifies runtime code.
 * Run: node scripts/review-project-structure.mjs [--check]
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import ts from 'typescript';

const destination = 'docs/project-review';
const read = file => fs.readFileSync(file, 'utf8');
const json = file => JSON.parse(read(file));
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const snake = name => name.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
const esc = value => String(value ?? '—').replaceAll('|', '\\|').replaceAll('\n', ' ');
const sourceLink = file => `[${file}](../../${file})`;
const sql = json('docs/schema-validation/table-dictionary.json');
const validation = json('docs/schema-validation/postgres.json');
const previous = json('docs/schema-step1/inventory.json');
const seeds = { reviewed: json('migration-artifacts/mock/database.json'), operations: json('migration-artifacts/mock/operations-data.json') };
const library = json('migration-artifacts/mock/library-data.json');
const migrationNames = fs.readdirSync('supabase/migrations').filter(file => file.endsWith('.sql')).sort();
if (JSON.stringify(migrationNames) !== JSON.stringify(validation.reports[0].migrations)) throw Error('Captured database evidence does not cover the current migration list. Refresh db:verify-schema first.');
const migrationSources = migrationNames.map(file => `supabase/migrations/${file}`);
const changedSinceCapture = migrationSources.filter(file => fs.statSync(file).mtimeMs > Date.parse(validation.validatedAt));
if (changedSinceCapture.length) throw Error(`SQL changed after captured validation: ${changedSinceCapture.join(', ')}`);
// A matching filename list/mtime is a freshness check, not proof of captured content hashes.
const migrations = migrationSources.map(file => ({ file, sha256: hash(read(file)) }));
const compile = file => ts.transpileModule(read(file), { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
const { tableNames } = await import(`data:text/javascript;base64,${Buffer.from(compile('src/persistence/tableNames.ts')).toString('base64')}`);
const { libraryOwners } = await import(`data:text/javascript;base64,${Buffer.from(compile('src/domain/libraryOwnership.ts')).toString('base64')}`);
const bySql = new Map(Object.entries(tableNames).map(([collection, table]) => [table, collection]));
const logicalOwners = new Map(Object.entries(libraryOwners).flatMap(([owner, tables]) => tables.map(table => [table, owner])));
if (logicalOwners.size !== Object.keys(library).length || [...logicalOwners.keys()].some(table => !Object.hasOwn(library, table))) throw Error('Library ownership and exported snapshot disagree');

const config = ts.readConfigFile('tsconfig.app.json', ts.sys.readFile);
const options = ts.parseJsonConfigFileContent(config.config, ts.sys, process.cwd()).options;
const program = ts.createProgram(['src/persistence/types/index.ts'], { ...options, noEmit: true });
const checker = program.getTypeChecker();
const schemaFile = program.getSourceFile(path.resolve('src/persistence/types/index.ts'));
const schemaNode = schemaFile.statements.find(node => ts.isInterfaceDeclaration(node) && node.name.text === 'DatabaseSchema');
const contracts = new Map();
for (const symbol of checker.getPropertiesOfType(checker.getTypeAtLocation(schemaNode))) {
  const row = checker.getIndexTypeOfType(checker.getTypeOfSymbolAtLocation(symbol, schemaNode), ts.IndexKind.Number);
  if (!row || !Object.hasOwn(tableNames, symbol.name)) throw Error(`Unmapped contract ${symbol.name}`);
  contracts.set(symbol.name, { rowType: checker.typeToString(row), fields: checker.getPropertiesOfType(row).map(field => {
    const declaration = field.valueDeclaration ?? field.declarations[0];
    const type = checker.getTypeOfSymbolAtLocation(field, declaration);
    const file = declaration.getSourceFile();
    return { name: field.name, sqlName: snake(field.name), type: checker.typeToString(type, declaration, ts.TypeFormatFlags.NoTruncation),
      optional: !!(field.flags & ts.SymbolFlags.Optional), allowsNull: !!(type.flags & ts.TypeFlags.Null) || !!(type.isUnion() && type.types.some(member => member.flags & ts.TypeFlags.Null)),
      source: path.relative(process.cwd(), file.fileName), line: file.getLineAndCharacterOfPosition(declaration.getStart()).line + 1 };
  }) });
}
if (contracts.size !== bySql.size || new Set(Object.values(tableNames)).size !== contracts.size) throw Error('Adapter/contract table map is not one-to-one');
const currentTables = new Map(sql.map(table => [table.table, table]));
for (const name of bySql.keys()) if (!currentTables.has(name)) throw Error(`Adapter table absent from captured SQL: ${name}`);
const declaredIndexes = new Map();
const declaredTriggers = new Map();
for (const file of migrationSources) {
  const text=read(file);
  for(const match of text.matchAll(/create (?:unique )?index\s+(\w+)\s+on public\.(\w+)[^;]*;/gi)) {
    const table=currentTables.get(match[2]);
    if(table) declaredIndexes.set(match[1],{table:match[2],name:match[1],sql:match[0],file,line:text.slice(0,match.index).split('\n').length});
  }
  for(const match of text.matchAll(/(?:create (?:constraint )?trigger\s+(\w+)[^;]*?on public\.(\w+)[^;]*;|drop trigger\s+(\w+)\s+on public\.(\w+)\s*;)/gi)) {
    if(match[3]) declaredTriggers.delete(`${match[4]}.${match[3]}`);
    else if(currentTables.has(match[2])) declaredTriggers.set(`${match[2]}.${match[1]}`,{table:match[2],name:match[1],sql:match[0],file,line:text.slice(0,match.index).split('\n').length});
  }
}

const groups = {
  hierarchy: ['organizations','organization_profiles','association_entities','association_aliases','association_affiliations','clients','associations','sites','site_associations','site_association_contexts','site_environment_links','client_environment_links','support_profiles'],
  applications: ['applicants','applications','application_applicants','application_associations','application_participants','application_events','application_coverages','application_riders','application_answers','application_snapshots'],
  identity: ['users','roles','user_roles','user_scopes','portal_actors','portal_admin_accounts'],
  changes: ['change_requests','change_items','releases','release_changes','site_builder_drafts','audit_events','migration_schedules'],
  publication: ['portal_library_drafts','portal_library_releases','portal_library_heads','portal_library_readiness','portal_library_publication_audit'],
  evidence: ['source_workbooks','source_sheets','source_requirements','requirement_targets','identity_resolutions','url_definitions','url_usages','provenance_tags','schema_reconciliation_issues','portal_reference_types','portal_entity_references'],
  analytics: ['analytics_metrics','analytics_measurements','analytics_tags'],
  compatibility: ['site_coverages','site_configurations','product_clients'],
  catalog: ['applicant_types','pattern_question_sets'],
};
const groupFor = new Map(Object.entries(groups).flatMap(([group, tables]) => tables.map(table => [table, group])));
for (const table of sql) if (!groupFor.has(table.table)) {
  const owner = logicalOwners.get(bySql.get(table.table));
  if (!owner) throw Error(`Table needs explicit ownership review: ${table.table}`);
  groupFor.set(table.table, `library-${owner}`);
}
const purposes = new Map(previous.tables.map(table => [table.name, table.purpose]));
Object.entries({
  organizations: 'TPA/organization root', clients: 'Legacy hosting Association record; not an additional business entity',
  associations: 'Legacy Association definition/profile retained through canonical aliases', applicants: 'People in hosting Association tenancy, independent of sign-in accounts',
  audit_events: 'Immutable operational changes with actor and registered entity references',
  association_entities: 'Canonical hosting/member Association identities under a TPA', association_aliases: 'Explicit source identity crosswalk and original records',
  association_affiliations: 'Same-TPA hosting/member Association affiliations', site_association_contexts: 'Automatic or membership/URL Association context on a Site',
  portal_actors: 'Human, service, system or unresolved historical actors', application_coverages: 'Application selections linked to Site products and optional application people',
  application_riders: 'Riders linked to exact application coverage and product assignment', application_answers: 'Field answers with optional person and repeat occurrence',
  application_snapshots: 'Immutable configuration, answer, coverage, participant and Association capture',
  schema_reconciliation_issues: 'Retained unresolved historical structural values', portal_reference_types: 'Registry of current-table or historical-external reference types',
  portal_entity_references: 'Validated current primary-key references or original historical snapshots',
}).forEach(([table, purpose]) => purposes.set(table, purpose));

function ownership(table) {
  const names = new Set(table.columns.map(column => column.name));
  if (table.table === 'organizations') return 'TPA/organization root; global portal identity';
  if (table.table === 'association_entities' || table.table === 'clients') return 'TPA via organization_id; clients is the hosting Association compatibility identity';
  if (table.table === 'association_aliases') return 'Canonical Association when resolved; otherwise archived source identity';
  if (table.table === 'association_affiliations') return 'Two Association endpoints constrained to one TPA';
  if (table.table === 'applicants') return 'Hosting Association via legacy client_id; selected Association belongs to application context';
  if (table.table === 'sites') return 'Hosting Association via hosting_association_id/client_id; TPA derived';
  if (names.has('application_id')) return 'Application child via application_id; Site/Association/person dimensions must agree where present';
  if (table.table === 'applications') return 'Site via site_id; hosting Association and TPA derived';
  if (table.table === 'flag_assignments') return 'One optional catalog/Association/Site/application target; level/persistence contract needs full review';
  if (names.has('scope')) return 'Global, hosting Association (legacy client), or Site by declared scope; inspect CHECK/targets';
  if (names.has('site_id') || names.has('site_key')) return 'Site-scoped or optional Site dimension; inspect nullable links and any paired Association target';
  if (names.has('client_id') || names.has('client_key')) return 'Hosting Association through compatibility reference; optional links do not establish mandatory ownership';
  if (names.has('organization_key')) return 'TPA via organization_key';
  if (groupFor.get(table.table) === 'identity') return 'Global identity/access catalog or child of user/actor; tenant applicability through typed scopes';
  if (groupFor.get(table.table) === 'changes') return 'Portal operations; entity/Site ownership only through declared references';
  if (groupFor.get(table.table) === 'evidence') return 'Source/evidence or reference registry; retention independent of runtime activation';
  return 'Shared catalog or child of shared definitions; effective applicability through assignments';
}
const mockTables = new Set(['sites','applications','applicationParticipants','applicationEvents','changeRequests','changeItems','releases','releaseChanges','siteBuilderDrafts','auditEvents','migrationSchedules']);
const foreignKeys = [];
const contractDrift = [];
for (const table of sql) {
  table.collection = bySql.get(table.table) ?? null;
  table.contract = contracts.get(table.collection) ?? null;
  table.group = groupFor.get(table.table);
  table.purpose = purposes.get(table.table);
  if (!table.purpose) throw Error(`Missing purpose ${table.table}`);
  table.observedOwnership = ownership(table);
  table.migrationMentions=migrationSources.filter(file=>new RegExp(`\\b${table.table}\\b`).test(read(file)));
  table.declaredIndexes=[...declaredIndexes.values()].filter(index=>index.table===table.table);
  table.declaredTriggers=[...declaredTriggers.values()].filter(trigger=>trigger.table===table.table);
  table.libraryOwner = logicalOwners.get(table.collection) ?? null;
  table.ownershipStatus = 'documented observation; final source/ownership decisions remain in decision register';
  table.access = !table.collection ? 'Dedicated SQL RPC/service boundary' : mockTables.has(table.collection) ? 'Mock server operational arrays; Supabase table adapter in configured mode' : 'Browser fallback for generic CRUD; exported Library reads when included; Supabase table adapter in configured mode';
  table.seedCounts = Object.fromEntries(Object.entries(seeds).map(([name, seed]) => [name, table.collection ? seed[table.collection]?.length ?? null : null]));
  for (const column of table.columns) {
    const field = table.contract?.fields.find(field => field.sqlName === column.name);
    if (table.contract && !field) contractDrift.push({ table: table.table, column: column.name, issue: 'SQL column absent from contract' });
    if (field && column.nullable && !field.optional && !field.allowsNull) contractDrift.push({ table: table.table, column: column.name, issue: 'SQL nullable; required contract excludes null' });
    if (field && !column.nullable && field.allowsNull && column.type !== 'jsonb') contractDrift.push({ table: table.table, column: column.name, issue: 'Contract permits null; SQL requires a value' });
  }
  for (const field of table.contract?.fields ?? []) if (!table.columns.some(column => column.name === field.sqlName)) contractDrift.push({ table: table.table, field: field.name, issue: 'Contract field absent from SQL' });
  for (const constraint of table.constraints.filter(constraint => constraint.type === 'f')) {
    const match = /^FOREIGN KEY \(([^)]+)\) REFERENCES ([\w.]+)\(([^)]+)\)/.exec(constraint.definition);
    if (!match) throw Error(`Unparsed FK: ${constraint.definition}`);
    const columns = match[1].split(',').map(s => s.trim().replaceAll('"',''));
    const target = match[2].includes('.') ? match[2] : `public.${match[2]}`;
    const targetColumns = match[3].split(',').map(s => s.trim().replaceAll('"',''));
    if (target.startsWith('public.') && !currentTables.has(target.slice(7))) throw Error(`Unknown FK target ${target}`);
    const unique = table.constraints.some(c => ['u','p'].includes(c.type) && (c.definition.match(/\(([^)]+)\)/)?.[1].split(',').map(s=>s.trim().replaceAll('"','')).every(c=>columns.includes(c))));
    const nullable = columns.some(name => table.columns.find(column => column.name === name)?.nullable);
    foreignKeys.push({ table: table.table, name: constraint.name, columns, target, targetColumns, nullable, childUnique: unique,
      onDelete: constraint.definition.match(/ON DELETE (CASCADE|SET NULL|SET DEFAULT|RESTRICT|NO ACTION)/)?.[1] ?? 'NO ACTION',
      onUpdate: constraint.definition.match(/ON UPDATE (CASCADE|SET NULL|SET DEFAULT|RESTRICT|NO ACTION)/)?.[1] ?? 'NO ACTION',
      definition: constraint.definition, status: constraint.validated ? 'enforced and validated in captured PostgreSQL review' : 'unvalidated; blocker' });
  }
}
const referenceName = /(?:_id|_key|_keys|_table|_column|_owner|_by|_reference|_step|_type|_fact|_path|_ref)$|^(?:fact|formula|derivation|url|image_ref)$/;
function disposition(table, column) {
  const identity = currentTables.get(table).constraints.some(c => ['u','p'].includes(c.type) && c.definition.match(/\(([^)]+)\)/)?.[1].replaceAll('"','').trim() === column);
  if (identity && ['id','key','display_id','metric_key','release_key'].includes(column)) return ['own-identity', 'Primary/natural identity of this row; outgoing FK unnecessary'];
  if (column === 'legacy_action_owner_id') return ['historical-copy', 'Retained original identity; current_action_owner_id references portal_actors'];
  if (table === 'applications' && column === 'product_key') return ['compatibility-product-label', 'Original presentation/import label retained; product_catalog_key and application_coverages carry enforced identities. Native insert/update product resolution is trigger-based.'];
  if (table === 'application_answers' && column === 'occurrence_key' || table === 'application_coverages' && column === 'selection_key') return ['local-occurrence-identity', 'Local occurrence/selection discriminator within composite uniqueness, not an outgoing entity FK; stable repeat-instance interpretation needs a domain contract.'];
  if (table === 'schema_reconciliation_issues' && column === 'record_id') return ['historical-reconciliation-identity', 'Original unresolved record identity retained with table_name/original_value; a compulsory current-row FK would erase the purpose of this ledger.'];
  if (table === 'site_flows' && column === 'flow_id') return ['compatibility-flow-alias-review', 'Runtime flow alias differs from enforced flow_key; reconcile alias consistency and retain compatibility deliberately.'];
  if (table === 'analytics_tags' && ['page_id','element_key'].includes(column)) return ['interaction-target-review', 'Tracking target can be a page, virtual app-shell or interaction element; define namespace-specific validation rather than a blanket page/field FK.'];
  if (['source_reference','source_owner','evidence_reference','import_reference','image_ref','url','legacy_client_id'].includes(column)) return ['locator-or-evidence', 'Evidence/asset/external locator or compatibility alias; needs documented locator/alias contract, not a fabricated entity FK'];
  if (['fact','formula','derivation'].includes(column)) return ['expression-review-open', 'Expression/fact vocabulary; complete typed expression and precedence validation not established'];
  if (['target_table','target_key','target_column','subject_table','subject_key'].includes(column)) return ['polymorphic-review-open', 'Source/semantic target lacks enforced typed target relationship; justify evidence-only use or validate target'];
  if (['performed_by','requested_by','owner_id','entity_id','scope_id'].includes(column)) return ['compatibility-pair-review-open', 'Legacy label/polymorphic identity paired with actor/entity/scope validator where implemented; every supplied pair needs consistency review'];
  if (table === 'association_aliases' && ['source_id','source_key','source_table'].includes(column)) return ['historical-source-crosswalk', 'Source identity preserved in original_record; explicit alias identity, not an inferred merge'];
  if (['current_step','from_owner_type','to_owner_type'].includes(column) || column.endsWith('_type')) return ['vocabulary-review', 'Discriminator/vocabulary; CHECK/enum may constrain spelling; identity pairing is a separate invariant'];
  if (table === 'site_builder_drafts' && column === 'site_key') return ['proposed-identity', 'Pre-creation Site identity; reservation and uniqueness need explicit lifecycle contract'];
  return ['reference-review-open', 'No declared FK for this candidate; validator, intentional vocabulary or historical alternative must be justified'];
}
const scalarReferences = [];
const jsonSurfaces = [];
const seedIssues = [];
const validatedJsonTables = new Set(['configuration_definitions','configuration_values','fields','site_policies','pages','flows','flow_steps','flow_transitions']);
const historyJson = new Set(['original_record','original_identity','original_value','record_snapshot','answers_snapshot','coverages_snapshot','participants_snapshot','association_snapshot','configuration_snapshot','identity']);
for (const table of sql) for (const column of table.columns) {
  const field = table.contract?.fields.find(field => field.sqlName === column.name);
  if (referenceName.test(column.name) && !foreignKeys.some(fk => fk.table === table.table && fk.columns.includes(column.name))) {
    const [status, rationale] = disposition(table.table, column.name);
    scalarReferences.push({ table: table.table, column: column.name, type: column.type, status, rationale });
  }
  if (column.type === 'uuid' && field) for (const [seedName, seed] of Object.entries(seeds)) {
    const invalid = (seed[table.collection] ?? []).filter(row => row[field.name] != null && !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(row[field.name]));
    if (invalid.length) seedIssues.push({ seed: seedName, table: table.table, column: column.name, count: invalid.length, issue: 'Semantic export identity differs from SQL UUID; generic adapter does not translate it' });
  }
  if (column.type !== 'jsonb') continue;
  const paths = new Map();
  const walk = (value, location='') => {
    if (Array.isArray(value)) { value.forEach(item => walk(item, `${location}[]`)); return; }
    if (value && typeof value === 'object') { Object.entries(value).forEach(([key,item]) => walk(item, location ? `${location}.${key}` : key)); return; }
    const leaf = location.split('.').at(-1)?.replaceAll('[]','') ?? '';
    if (/key|id|ref|target|source|owner|actor|page|field|product|rider|association|condition|rule|flow|flag|applicant|depend|formula|expression|fact|path|scope|client|site|table|column|validation|when|visible|include|require/i.test(leaf)) paths.set(location,(paths.get(location) ?? 0)+1);
  };
  if (field) for (const seed of Object.values(seeds)) for (const row of seed[table.collection] ?? []) walk(row[field.name]);
  const boundary = validatedJsonTables.has(table.table) ? 'SQL key-name validator on selected catalog JSON; exact recognized keys only. Shape, type, applicability and expressions still require per-surface review.'
    : table.table.startsWith('portal_library_') ? 'SQL publication envelope/allowlist boundary plus service readiness; full nested relationship and historical revision validation requires review.'
    : historyJson.has(column.name) ? 'Historical/reference capture or source evidence; preserve original values. Snapshot/reference functions validate selected identities; do not rewrite archived keys.'
    : 'TypeScript/resolver or source-only validation varies; no complete SQL JSON relationship contract established for this surface.';
  jsonSurfaces.push({ table: table.table, column: column.name, contractType: field?.type ?? 'Dedicated SQL/RPC', boundary, status: 'documented boundary; reference disposition review remains open',
    candidatePaths: [...paths].sort(([a],[b])=>a.localeCompare(b)).map(([path,count])=>({path,count})) });
}
// Check representable composite references in each standalone export; partial
// operations exports are reported as partial, never repaired with guessed rows.
for (const fk of foreignKeys.filter(fk=>fk.target.startsWith('public.'))) {
  const from = currentTables.get(fk.table), to = currentTables.get(fk.target.slice(7));
  const fromFields = fk.columns.map(name=>from.contract?.fields.find(field=>field.sqlName===name)?.name);
  const toFields = fk.targetColumns.map(name=>to.contract?.fields.find(field=>field.sqlName===name)?.name);
  if (fromFields.some(name=>!name) || toFields.some(name=>!name)) continue;
  for (const [seedName,seed] of Object.entries(seeds)) {
    const keys = new Set((seed[to.collection] ?? []).map(row=>JSON.stringify(toFields.map(field=>row[field]))));
    const invalid = (seed[from.collection] ?? []).filter(row=>fromFields.every(field=>row[field]!=null) && !keys.has(JSON.stringify(fromFields.map(field=>row[field]))));
    if (invalid.length) seedIssues.push({seed:seedName,table:fk.table,columns:fk.columns,target:fk.target,count:invalid.length,issue:'Reference unresolved within this standalone export; partial export versus actual orphan needs reconciliation'});
  }
}

function walkFiles(directory) {
  return fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walkFiles(path.join(directory,entry.name)):[path.join(directory,entry.name)]);
}
const sourceFiles = ['src','scripts','supabase','public','docs','.storybook'].flatMap(walkFiles).filter(file=>!file.startsWith(`${destination}/`));
const rootFiles = fs.readdirSync('.',{withFileTypes:true}).filter(entry=>entry.isFile() && !entry.name.startsWith('.env') && entry.name!=='.DS_Store').map(entry=>entry.name);
const fileRegister = [...sourceFiles,...rootFiles].sort().map(file=>{
  let disposition='keep', reason='Maintained project source, tests, configuration or asset; no deletion authorized';
  if (file.endsWith('.zip')) { disposition='archive-review'; reason='Backup package; establish provenance and unique contents before removal'; }
  else if (/^src\/migration\//.test(file) || /^scripts\/(?:ingest|generate-canonical|write-canonical|map-association|review-active)/.test(file)) { disposition='move-candidate'; reason='Import/review tooling or source evidence; isolate from runtime after tracing imports'; }
  else if (file.startsWith('docs/') || file.startsWith('src/docs/')) { disposition='documentation-review'; reason='Classify current reference, generated inventory and historical evidence; preserve imported evidence'; }
  else if (['src/repositories/persistedSiteAdapter.ts','src/repositories/canonicalMetadataRepository.ts','src/repositories/libraryRepository.ts','src/repositories/effectiveSiteRepository.ts','src/app/PortalDataProvider.tsx'].includes(file)) { disposition='consolidation-candidate'; reason='Compatibility/opt-in access path; review runtime and test consumers before retirement'; }
  else if (file==='scripts/mock-platform.mjs' || file==='scripts/start-mock-dev.mjs') { disposition='split-candidate'; reason='Separate HTTP, domain services, storage and synthetic integration concerns using existing tools'; }
  return { file, bytes:fs.statSync(file).size, disposition, reason };
});
// Maintenance evidence shares this review's source inventory and regeneration gate.
// A double assertion is a review candidate, not proof of an unsafe value.
const maintenanceFiles = sourceFiles.filter(file => /^(src|scripts)\//.test(file) && /\.(?:ts|tsx|mjs)$/.test(file)).sort().map(file => {
  const content = read(file);
  const source = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);
  const doubleAssertions = [];
  function visit(node) {
    if (ts.isAsExpression(node) && ts.isAsExpression(node.expression) && node.expression.type.kind === ts.SyntaxKind.UnknownKeyword) {
      doubleAssertions.push({ line: source.getLineAndCharacterOfPosition(node.getStart()).line + 1, target: node.type.getText(source) });
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return { file, sha256: hash(content), lines: content.split('\n').length - Number(content.endsWith('\n')),
    category: /\.(?:test|spec)\./.test(file) ? 'test' : /\.stories\./.test(file) ? 'storybook' : 'implementation', doubleAssertions };
});
const assignmentKey = (row, property) => JSON.stringify([row.siteId, row[property]]);
const coverageAssignments = new Map(seeds.reviewed.siteCoverages.map(row => [assignmentKey(row, 'coverageKey'), row]));
const productAssignments = new Map(seeds.reviewed.siteProducts.map(row => [assignmentKey(row, 'productKey'), row]));
const assignmentDifferences = [...new Set([...coverageAssignments.keys(), ...productAssignments.keys()])].sort().flatMap(key => {
  const coverage = coverageAssignments.get(key), product = productAssignments.get(key);
  return !coverage || !product || coverage.enabled !== product.enabled
    ? [{ identity: JSON.parse(key), coverageEnabled: coverage?.enabled ?? null, productEnabled: product?.enabled ?? null }] : [];
});
const maintenance = {
  scope: 'Current src/scripts TS, TSX and MJS source; test and Storybook assertions classified separately. Export comparison is not live-store parity.',
  doubleAssertions: Object.fromEntries(['implementation', 'test', 'storybook'].map(category => [category,
    maintenanceFiles.filter(file => file.category === category).reduce((count, file) => count + file.doubleAssertions.length, 0)])),
  filesAtLeast800Lines: maintenanceFiles.filter(file => file.lines >= 800).sort((a, b) => b.lines - a.lines),
  assertionFiles: maintenanceFiles.filter(file => file.doubleAssertions.length),
  siteAssignmentComparison: { source: 'migration-artifacts/mock/database.json',
    siteProducts: seeds.reviewed.siteProducts.length, siteCoverages: seeds.reviewed.siteCoverages.length,
    duplicateProducts: seeds.reviewed.siteProducts.length - productAssignments.size,
    duplicateCoverages: seeds.reviewed.siteCoverages.length - coverageAssignments.size, differences: assignmentDifferences },
};
const decisions = [
  ['D01','Identity and tenancy','Reconcile canonical Association aliases, retained hosting records and differing TPA seed mappings; confirm applicant tenancy and multi-Association reuse','hierarchy/identity crosswalk','open'],
  ['D02','Context lifecycle','Missing association policy currently creates automatic context; finalize explicit defaults and parent/affiliation/archive changes on already-linked Sites','associationStructure.ts and canonical identity migration','open'],
  ['D03','Canonical assignment sources','Finalize site_products versus site_coverages; define disposition for site_configurations, product_clients and legacy environment links','compatibility tables','open'],
  ['D04','Business values and precedence','Reconcile product/rider JSON, typed policy tables and configurationValues; define assignment dimensions, ordering and null uniqueness','Library rules/configuration','open'],
  ['D05','Reference boundaries','Disposition every scalar and JSON candidate, polymorphic target, expression and supplied actor/reference pair; target deletion/key changes need review','reference register','open'],
  ['D06','Backend equivalence','Choose authoritative local development stores and shared service validation; resolve semantic-ID/UUID differences without guessing historical IDs','persistence adapters and exports','open'],
  ['D07','Atomic writes and history','Application transition/event/audit writes are separate; define transactional boundary and configuration/archive survival tests for all history','applicationService and publication services','open'],
  ['D08','Schema authority and checks','SQL is installed structure; export manifests are subsets. Consolidate current full-chain checks and explicitly label historical subset checks','migration manifests/check scripts','open'],
  ['D09','Applied development database','Identify data-bearing development target; preserve and reconcile its records before applying migrations. Disposable checks are not Step 7','captured PostgreSQL evidence','not applied'],
];
const inputSources = ['docs/schema-validation/table-dictionary.json','docs/schema-validation/postgres.json',
  'docs/project-review/ownership-and-cleanup-plan.md', 'src/main.tsx', 'src/repositories/sites.ts',
  'src/services/libraryCatalogService.ts', 'src/domain/prototypeLibrary.ts', 'src/domain/effectiveConfiguration.ts',
  'src/domain/prototypeProductProjection.ts', 'src/domain/prototypeConfigurationProjection.ts',
  'src/domain/prototypeAssociationProjection.ts', 'src/domain/siteBuild.ts',
  'migration-artifacts/mock/database.json','migration-artifacts/mock/operations-data.json','migration-artifacts/mock/library-data.json',
  'src/persistence/tableNames.ts','src/domain/libraryOwnership.ts','src/persistence/localAdapter.ts','src/persistence/mockOperationsAdapter.ts',
  'src/persistence/supabaseAdapter.ts','src/persistence/associationStructure.ts','src/services/applicationService.ts',
  'src/migration/export.ts','src/migration/canonical.ts','src/migration/schema.ts','src/migration/canonicalSchema.ts',
  'scripts/mock-platform.mjs','scripts/applicant-saves.mjs',...walkFiles('src/persistence/types').filter(file=>file.endsWith('.ts'))];
const report = { scope:'Review artifacts only; no runtime change, cleanup, database application, source identity merge or final ownership approval',
  date:'2026-10-13', completionGate:'open', databaseEvidence:validation.validatedAt,
  evidenceLimit:'Captured PostgreSQL dictionary reused; current names and mtime checked. Current hashes recorded now, not historical capture hashes. No new database run.',
  counts:{sqlTables:sql.length,adapterCollections:contracts.size,librarySnapshotTables:Object.keys(library).length,foreignKeys:foreignKeys.length,jsonColumns:jsonSurfaces.length,scalarCandidates:scalarReferences.length,jsonCandidatePaths:jsonSurfaces.reduce((n,s)=>n+s.candidatePaths.length,0),contractDrift:contractDrift.length,seedIssueGroups:seedIssues.length,reviewedProjectFiles:fileRegister.length},
  sources:inputSources.map(file=>({file,sha256:hash(read(file))})),
  migrations,tables:sql,foreignKeys,scalarReferences,jsonSurfaces,contractDrift,seedIssues,decisions,fileRegister,maintenance };
const artifacts = new Map();
artifacts.set('inventory.json',JSON.stringify(report,null,2)+'\n');
let ownershipMd='# Current table ownership review\n\nOctober 13, 2026. All public tables are listed. Observed storage ownership and Library navigation ownership are different. These observations do not close the decisions in the review index. Legacy client/client_id/client_key names mean hosting Association where applicable, not another business entity.\n\n| Table | Purpose | Observed storage ownership | Library owner | Access | Reviewed / operational export rows |\n| --- | --- | --- | --- | --- | --- |\n';
for(const table of sql) ownershipMd+=`| [${table.table}](table-dictionary.md#${table.table.replaceAll('_','-')}) | ${esc(table.purpose)} | ${esc(table.observedOwnership)} | ${table.libraryOwner ?? 'Outside Library snapshot'} | ${esc(table.access)} | ${table.seedCounts.reviewed ?? '—'} / ${table.seedCounts.operations ?? '—'} |\n`;
artifacts.set('ownership.md',ownershipMd);
let dictionary='# Current table dictionary\n\nCaptured PostgreSQL columns and constraints joined to current TypeScript contracts and detached reviewed/operational seeds. All 147 public tables; auth.users is external. See [ownership](ownership.md), [references](references.md), [relationships](relationships.md), and [limits and blockers](README.md). Types, nullability and defaults below are SQL values. Dedicated RPC tables intentionally have no generic CRUD contract. SQL checks are not browser fallback enforcement.\n';
for(const table of sql){
  dictionary+=`\n## ${table.table.replaceAll('_',' ')}\n\n\`${table.table}\`: ${table.purpose}.\n\nOwner: ${table.observedOwnership}. Group: ${table.group}. RLS: ${table.rls}. Contract: ${table.contract?.rowType ?? 'Dedicated RPC/service'}. Access: ${table.access}.\n\n| Column | SQL type | Nullable | Default | Contract field/type | Source |\n| --- | --- | --- | --- | --- | --- |\n`;
  for(const column of table.columns){const field=table.contract?.fields.find(field=>field.sqlName===column.name);dictionary+=`| ${column.name} | ${esc(column.type)} | ${column.nullable} | ${esc(column.default)} | ${field?esc(`${field.name}${field.optional?'?':''}: ${field.type}`):'RPC/service'} | ${field?`[contract](../../${field.source}#L${field.line})`:'[captured SQL](../schema-validation/table-dictionary.json)'} |\n`;}
  dictionary+='\nInstalled constraints:\n\n```sql\n'+table.constraints.map(c=>`${c.name}: ${c.definition}${c.validated?'':' /* NOT VALID */'}`).join('\n')+'\n```\n';
  dictionary+='\nMigration sources mentioning this table: '+table.migrationMentions.map(sourceLink).join(', ')+'. Mentions include references and function bodies, not just table declarations.\n';
  if(table.declaredIndexes.length || table.declaredTriggers.length) dictionary+='\nStatic index/trigger declarations from the ordered migration sources:\n\n'+[...table.declaredIndexes,...table.declaredTriggers].map(item=>`- [${item.name}](../../${item.file}#L${item.line}): \`${esc(item.sql)}\``).join('\n')+'\n';
}
dictionary+='\n## Declaration inventory limits\n\nIndex/trigger declarations above are source-derived; the captured PostgreSQL dictionary did not include installed index/trigger rows. Dynamic triggers created inside DO/functions are not expanded by this scanner, including JSON/reference identity guards. Full bodies are in the linked source migrations. These declarations are not an exhaustive installed trigger inventory or a claim of lifecycle enforcement.\n';
artifacts.set('table-dictionary.md',dictionary);
const edge = fk=>`  ${fk.target.replace('.','_')} ${fk.nullable?'|o':'||'}--${fk.childUnique?'o|':'o{'} public_${fk.table} : "${fk.columns.join('+')}"`;
let diagrams='# Current relationship diagrams\n\nAll 147 public tables and 400 declared foreign keys from captured PostgreSQL evidence. Edges express maximum FK cardinality, not a required minimum of children. MATCH SIMPLE nullable composites can have no checked parent when a component is null. Unique indexes and trigger-only business relationships are not converted into invented FK edges; inspect source migrations for those. auth.users is external. Grouping is presentation, not a new schema or ownership approval.\n';
for(const group of [...new Set(sql.map(t=>t.group))]){
  const members=sql.filter(t=>t.group===group);
  for(let offset=0;offset<members.length;offset+=12){const batch=members.slice(offset,offset+12),names=new Set(batch.map(t=>t.table));
    diagrams+=`\n## ${group} ${Math.floor(offset/12)+1}\n\n\`\`\`mermaid\nerDiagram\n${batch.map(t=>`  public_${t.table}`).join('\n')}\n${foreignKeys.filter(fk=>names.has(fk.table)).map(edge).join('\n')}\n\`\`\`\n`;
  }
}
artifacts.set('relationships.md',diagrams);
let references='# Reference disposition register\n\nThis register accounts for every declared FK, every detected scalar reference/vocabulary candidate without an FK, and all 70 JSON columns. Candidate detection is name/path based; arbitrary strings, dynamic JSON object keys and unseeded values can embed additional references. A candidate is not automatically an entity relationship. Counts are coverage, not proof of closure.\n\n## Enforced SQL relationships\n\n| Child table | Columns | Parent | Parent columns | Nullable component | Unique child FK | Delete / update | Status |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n';
for(const fk of foreignKeys) references+=`| ${fk.table} | ${fk.columns.join(', ')} | ${fk.target} | ${fk.targetColumns.join(', ')} | ${fk.nullable} | ${fk.childUnique} | ${fk.onDelete} / ${fk.onUpdate} | ${fk.status} |\n`;
references+='\n## Scalar candidates without declared FKs\n\n| Table | Column | Status | Rationale or required decision |\n| --- | --- | --- | --- |\n';
for(const ref of scalarReferences) references+=`| ${ref.table} | ${ref.column} | ${ref.status} | ${esc(ref.rationale)} |\n`;
references+='\n## JSON surfaces\n\nSQL recursive key validation is in '+sourceLink('supabase/migrations/202610120008_reference_validation.sql')+'. It recognizes exact key names in eight selected tables; it is not a universal schema/type/ownership validator. Archived evidence and expression names need separate treatment. Paths below include vocabulary as well as reference candidates; occurrence counts combine reviewed and operational exports. No values from saved applicant stores were inspected.\n';
for(const surface of jsonSurfaces){references+=`\n### ${surface.table}.${surface.column}\n\nContract: \`${surface.contractType}\`. Boundary: ${surface.boundary} Status: ${surface.status}.\n\n`;
  references+=surface.candidatePaths.length?'| Observed candidate path | Occurrences |\n| --- | --- |\n'+surface.candidatePaths.map(p=>`| ${esc(p.path)} | ${p.count} |`).join('\n')+'\n':'No candidate leaf paths in these detached exports. Empty/unseeded data is not proof that the surface carries no references.\n';
}
references+='\n## Contract drift\n\nColumn presence and SQL-nullability comparisons only; not full semantic type, enum, default, trigger-output or adapter equivalence. JSON null is distinct from SQL NULL.\n\n| Table | Column/field | Finding |\n| --- | --- | --- |\n';
for(const drift of contractDrift) references+=`| ${drift.table} | ${drift.column ?? drift.field} | ${drift.issue} |\n`;
references+='\n## Seed compatibility findings\n\nThese are standalone exports; reviewed SQL export explicitly translates selected semantic identities and excludes operational application rows. A partial operational export lacking catalogs is not automatically a corrupt running database. Each discrepancy needs that distinction before reconciliation.\n\n| Export | Table | Column(s) | Rows | Finding |\n| --- | --- | --- | --- | --- |\n';
for(const issue of seedIssues) references+=`| ${issue.seed} | ${issue.table} | ${issue.column ?? issue.columns.join(', ')} | ${issue.count} | ${issue.issue}${issue.target?`; target ${issue.target}`:''} |\n`;
artifacts.set('references.md',references);

// Static narrative is deliberately kept here beside the generated evidence, so
// --check validates the review package as one artifact rather than more registries.
artifacts.set('README.md',`# Project structure and Library review\n\nOctober 13, 2026. Inventory generation only. Runtime cleanup progress is recorded in the ownership and implementation plan. The original completion gate remains **open**.\n\nThe package covers **${sql.length} SQL tables**, **${contracts.size} generic collections**, **${Object.keys(library).length} Library snapshot tables**, **${foreignKeys.length} foreign keys** and **${jsonSurfaces.length} JSON columns**. ${scalarReferences.length} scalar reference/vocabulary candidates without FKs and ${report.counts.jsonCandidatePaths} observed JSON leaf paths are registered. These are review coverage counts, not final ownership or reference acceptance.\n\n## Package\n\n- [Ownership for every table](ownership.md)\n- [Current column/contract/constraint dictionary](table-dictionary.md)\n- [Complete FK relationship diagrams](relationships.md)\n- [Reference dispositions, contract and seed findings](references.md)\n- [Canonical-source proposals and cleanup register](cleanup.md)\n- [Runtime ownership and implementation batches](ownership-and-cleanup-plan.md)\n- [Machine-readable evidence, maintenance baseline and complete file register](inventory.json)\n\n## Current completion status\n\n| Original step | Evidence | Remaining work |\n| --- | --- | --- |\n| 1 Audit | Current table dictionary, FK diagrams, scalar/JSON surfaces and file register | Review candidate classifications and dynamic/unseeded JSON; this package records gaps rather than resolving them |\n| 2 Ownership/cardinality | Confirmed TPA → Association → Site; explicit canonical tables and affiliation/context links | Finalize identity mappings, default context, shared Association boundaries, assignments and precedence |\n| 3 Application model | SQL people, coverages, riders, answers and immutable snapshots implemented | Runtime operational and applicant stores remain separate; minimum relationships and supplied pair consistency need decisions |\n| 4 Identity/actors | Human/service/system/unresolved actor and reference registry implemented | Finalize public/auth/mock identity mapping and historical alternatives; permissions/auth/account workflows remain deferred |\n| 5 Constraints/migrations | 23 migrations; declared constraints represented in installed dictionary | ${contractDrift.length} contract/nullability findings; export UUID and backend equivalence findings; unresolved lifecycle invariants |\n| 6 Validation | Captured fresh/upgrade checks, ASCE scenarios, seed repeatability and preserved historical application | Full relationship/archive/reassignment matrix, domain-specific JSON validation and backend parity |\n| 7 Apply | Disposable PostgreSQL evidence only | Intended data-bearing development database not selected or migrated |\n\n## Open decisions and blockers\n\n| ID | Area | Required decision/work | Evidence | Status |\n| --- | --- | --- | --- | --- |\n${decisions.map(([id,area,action,evidence,status])=>`| ${id} | ${area} | ${action} | ${evidence} | ${status} |`).join('\n')}\n\n## Evidence boundaries\n\nThe PostgreSQL dictionary was captured at ${validation.validatedAt}. Migration filename lists and modification times match that evidence; current migration hashes are recorded in inventory.json, but the prior capture did not record hashes. This pass did not rerun or apply database migrations. The prior ASCE test result is 139 focused tests passed; the broad regression result and its repaired failure are documented in [ASCE setup](../asce-database-setup.md).\n\nCurrent TypeScript contracts are inspected directly with the compiler API. SQL-only RPC contracts are recorded explicitly. Both current detached reviewed and operational exports are inspected; application recovery files, credentials and user saved records are excluded. Static candidate detection cannot prove all references embedded in arbitrary JSON or expressions. The full model still needs per-surface decisions and tests.\n\n## Next bounded step\n\nFinalize D01–D04: an approved ownership/cardinality and canonical-source map. Use the cleanup register to define a first implementation batch; preserve source evidence and historical identities. Authentication, role permissions, customer tracking/editing and ASCE content accuracy remain outside this review.\n\nReproduce with \`node scripts/review-project-structure.mjs\`; detect drift with \`node scripts/review-project-structure.mjs --check\`. Refresh the reviewed exports and PostgreSQL evidence through their existing commands when those inputs change.\n`);
artifacts.set('cleanup.md',`# Canonical sources and cleanup register\n\nProposals only. No file/table deletion, rename, merge, new framework or runtime switch is authorized by generating this review. Keep React, TypeScript, Vite, the existing Node HTTP server, existing storage adapters and PostgreSQL/Supabase tooling.\n\n## Canonical source proposals\n\n| Concern | Current overlap | Proposed authority | Required compatibility/decision |\n| --- | --- | --- | --- |\n| TPA/Association/Site | clients, associations, canonical identity/context tables and static registry | Canonical Association identity and explicit Site context | Resolve source aliases and TPA differences; legacy wire names remain projections until mapping accepted |\n| Site products | site_products, site_coverages and enabled configuration values | site_products assignment | Prove disagreement handling and derive compatibility coverage assignments; do not drop records first |\n| Product policies | product/rider definitions, normalized policy tables and business JSON in configurationValues | One authority per business property; typed ownership and precedence contract | Choose per property, not a blanket preference for JSON or extra tables |\n| Page/field composition | pages/sections/placements, field collections, source registries | Stored page/field model with portable resolver | Keep React rendering separate; reconcile rich legacy adapters and repeated collection semantics |\n| Rules | JSON rules/actions, normalized predicates/actions and code catalogs | One executable rule/condition contract | Expression validation, ordering and backward compatibility must be explicit |\n| Content/email/branding | Stored entries/configuration and rich preview/source adapters | Stored definitions/values plus render-only presentation | Verify actual preview/runtime parity before retiring source catalogs |\n| Applications | Admin operational rows, applicant recovery values and mock receipts | One application-domain service with explicit draft/submission/recovery boundaries | Do not conflate recovery capability records with people or workflow participants |\n| Actors/history | public users, auth users, mock accounts and legacy labels | Portal actor identity and validated typed target | Keep source identities and snapshots; authentication/permissions remain deferred |\n| Releases | delivery planning releases and immutable configuration releases | Keep distinct models | Similar names do not make them duplicate entities; define associations only where needed |\n| Schema | SQL migrations, TypeScript interfaces and subset export manifests | Installed SQL structure, verified against current contracts | Import/export manifests describe supported subsets, not the full schema |\n\n## Prioritized cleanup\n\n| Priority | Candidate | Disposition | Entry condition | Verification |\n| --- | --- | --- | --- | --- |\n| 1 | README.md, docs/, src/docs/ | One current entry point; archive historical reports; label generated inventory | Preserve imported evidence and historical acceptance/source decisions | Links resolve; current gate states agree |\n| 1 | migration-artifacts/, dist/, storybook-static/, root ZIP backups | Generated output cleanup and backup archive review | Confirm regeneration/provenance and unique contents; never include .mock-platform saved state | Reproduce exports/builds; compare hashes before removing backups |\n| 2 | site_coverages/site_products, site_configurations/configuration_values | Consolidate authority through compatibility projections | Approve source map and reconcile disagreements | Serialized/readback and all Site assignment tests |\n| 2 | src/repositories/ and static/persisted compatibility paths | Consolidate redundant access boundaries | Trace imports, catalog-only mode, injection seams and test consumers | All supported consumers read the same captured revision; failures propagate |\n| 3 | scripts/mock-platform.mjs, start-mock-dev.mjs, builder-release.mjs, applicant-saves.mjs | Separate server HTTP, application services, persistence and synthetic integrations | Define domain/store ownership; preserve atomic file writes and recovery behavior | Restart, isolation, idempotency and failure rollback tests |\n| 3 | src/migration/ and import/report scripts | Move import/evidence tooling outside runtime modules | Trace runtime dependency graph; keep curated execution data/resolvers available | Build/startup and seed exports work without browser-time source compilation |\n| 3 | parallel schema/audit/check scripts | One current authoritative audit and full-chain gate; preserve historical evidence | Explicitly distinguish subset/export gates from complete schema checks | Current migration list/contract inventory agrees; historical tools cannot claim readiness |\n\n## Organization direction\n\nKeep application bootstrap/routing in src/app; pure contracts/resolvers in src/domain; business use cases in src/services; storage mechanics in src/persistence; UI by existing feature boundaries. Separate the existing Node server into HTTP adapters, domain-service entry points, file storage and mock external-service providers. Group existing files before adding abstractions; one-line forwarding wrappers need a documented responsibility to remain.\n\nMigration/source evidence should have its own tooling area and dated archive. Generated outputs should have documented regeneration commands and stay out of source imports. Preserve historical migrations and original source datasets. Avoid broad folder moves until imports and the canonical source map are approved.\n\n## Complete file register\n\n${fileRegister.length} files in maintained source, scripts, schema, assets, documentation, Storybook configuration and selected root files are classified in [inventory.json](inventory.json). Candidate classifications are not deletion orders and do not assert a file is unused. node_modules, generated output trees, saved state, credentials and Git internals are excluded from this source register. Generated folders/backups appear separately in the prioritized review above.\n`);
if (process.argv.includes('--check')) {
  for (const [name,content] of artifacts) if (!fs.existsSync(`${destination}/${name}`) || read(`${destination}/${name}`)!==content) throw Error(`Review artifact drift: ${name}`);
} else {
  fs.mkdirSync(destination,{recursive:true});
  for(const [name,content] of artifacts) fs.writeFileSync(`${destination}/${name}`,content);
}
console.log(JSON.stringify({completionGate:report.completionGate,...report.counts,output:destination},null,2));
