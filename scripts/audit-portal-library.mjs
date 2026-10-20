import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { readStoryInventory, walkFiles } from './storybook-inventory.mjs';
import { normalizeSiteReferences } from '../src/domain/siteIdentity.mjs';

const ownershipSource = fs.readFileSync('src/domain/libraryOwnership.ts', 'utf8');
const compiled = ts.transpileModule(ownershipSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { libraryOwners, configurationOwner, flagOwner } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const snapshot = normalizeSiteReferences(JSON.parse(fs.readFileSync('migration-artifacts/mock/library-data.json', 'utf8')));
const ownership = new Map();
for (const [owner, tables] of Object.entries(libraryOwners)) for (const table of tables) {
  if (ownership.has(table)) throw new Error(`Multiple table owners: ${table}`);
  ownership.set(table, owner);
}
for (const table of Object.keys(snapshot)) if (!ownership.has(table)) throw new Error(`Unaccounted Library table: ${table}`);
for (const table of ownership.keys()) if (!Object.hasOwn(snapshot,table)) throw new Error(`Stale Library export; missing ${table}. Run npm run mock:seed.`);

const config = ts.readConfigFile('tsconfig.app.json', ts.sys.readFile);
const options = ts.parseJsonConfigFileContent(config.config, ts.sys, process.cwd()).options;
const program = ts.createProgram(['src/persistence/types/index.ts'], options);
const checker = program.getTypeChecker();
const ast = program.getSourceFile(path.resolve('src/persistence/types/index.ts')) ?? program.getSourceFile('src/persistence/types/index.ts');
const schemaNode = ast.statements.find(node => ts.isInterfaceDeclaration(node) && node.name.text === 'DatabaseSchema');
const schema = checker.getTypeAtLocation(schemaNode);
const namesSource = ts.transpileModule(fs.readFileSync('src/persistence/tableNames.ts', 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { tableNames } = await import(`data:text/javascript;base64,${Buffer.from(namesSource).toString('base64')}`);
const constraints = new Map();
for (const file of walkFiles('supabase/migrations').filter(file => file.endsWith('.sql')).sort()) {
  const sql = fs.readFileSync(file, 'utf8');
  for (const match of sql.matchAll(/create table(?: if not exists)? public\."?(\w+)"?\s*\(([\s\S]*?)\);/gi)) {
    const entries = constraints.get(match[1]) ?? [];
    entries.push({ migration: file, operation: 'create table', definition: match[2].trim() });
    constraints.set(match[1], entries);
  }
  for (const match of sql.matchAll(/alter table(?: if exists)? public\."?(\w+)"?([\s\S]*?);/gi)) {
    const entries = constraints.get(match[1]) ?? [];
    entries.push({ migration: file, operation: 'alter table', definition: match[2].trim() });
    constraints.set(match[1], entries);
  }
}
const tables = checker.getPropertiesOfType(schema).map(property => {
  const array = checker.getTypeOfSymbolAtLocation(property, schemaNode);
  const row = checker.getIndexTypeOfType(array, ts.IndexKind.Number);
  return { table: property.name, owner: ownership.get(property.name) ?? (property.name === 'analyticsTags' ? 'analytics' : 'outside Library snapshot'), snapshot: Object.hasOwn(snapshot, property.name), rows: snapshot[property.name]?.length ?? null,
    sqlTable: tableNames[property.name], sqlDefinitions: constraints.get(tableNames[property.name]) ?? [],
    fields: row ? checker.getPropertiesOfType(row).map(field => ({ name: field.name, type: checker.typeToString(checker.getTypeOfSymbolAtLocation(field, schemaNode)), referenceCandidate: /(?:Key|Id)$/.test(field.name) && !['id', 'key', 'displayId'].includes(field.name) })) : [],
  };
}).sort((a, b) => a.table.localeCompare(b.table));
const stories = readStoryInventory().filter(row => row.file.startsWith('src/components/') && !/\/(admin|docs)\//.test(row.file) || row.file === 'src/app/RoutePage.stories.tsx' || row.file === 'src/pages/admin/Accounts.stories.tsx');
const storyIds = new Set(stories.flatMap(row => row.storyIds));
if (process.argv.includes('--verify-built-storybook')) {
  const index = JSON.parse(fs.readFileSync('storybook-static/index.json', 'utf8'));
  const built = new Set(Object.values(index.entries).filter(row => row.type === 'story').map(row => row.id));
  const missing = [...storyIds].filter(id => !built.has(id));
  const unexpected = [...built].filter(id => !storyIds.has(id));
  if (missing.length || unexpected.length) throw new Error(`Storybook build differs from component inventory: ${JSON.stringify({ missing, unexpected })}`);
}
const brokenLinks = [];
for (const file of walkFiles('src').filter(file => /\.[jt]sx?$/.test(file) && !file.includes('.test.') && !file.includes('/docs/overview/') && !file.endsWith('/foundations/Overview.tsx'))) {
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(/["']((?:forms|layout|content|coverage-commerce|feedback|overlays|navigation|application-patterns|foundations|guidelines|home|components)-[a-z0-9-]+--[a-z0-9-]+)["']/g)) if (!storyIds.has(match[1])) brokenLinks.push({ file, storyId: match[1] });
}
const report = {
  scope: 'Source schemas, persisted Library snapshot and component Storybook references. Counts include catalog/source-only records; this is not an ASCE business accuracy assessment.',
  summary: { storageTables: constraints.size, adapterTables: tables.length, snapshotTables: Object.keys(snapshot).length, storyModules: stories.length, stories: storyIds.size, storedComponents: snapshot.components.length, brokenStoryLinks: brokenLinks.length },
  tableOwnership: tables,
  configurationOwnership: snapshot.configurationDefinitions.map(row => ({ key: row.key, owner: configurationOwner(row), path: row.definition.path, target: row.definition.target ?? null })),
  stateOwnership: snapshot.flagDefinitions.map(row => ({ key: row.key, owner: flagOwner(row.persistence), persistence: row.persistence })),
  storybook: stories,
  brokenStoryLinks: brokenLinks,
  nextReviews: ['ASCE source accuracy and completeness', 'ASCE applicant journey verification', 'Single revision PDF requirements export'],
};
if (process.argv.includes('--write')) fs.writeFileSync('docs/portal-library-schema-audit.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report.summary, null, 2));
if (brokenLinks.length) { console.error(JSON.stringify(brokenLinks, null, 2)); process.exitCode = 1; }
